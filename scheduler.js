var EventEmitter = require('events');
var browserApi = require('./browser-api');
var geolib = require('geolib');
var db = require('./activity-db');

function Scheduler()
{
};

Scheduler.prototype =
{
  loadFromDbList: function loadFromDbList(conditions)
  {
    var root = conditions.shift();
    
    var conditionsByParent = {};
    conditions.forEach(function(condition)
    {
      if(!conditionsByParent[condition.parent])
        conditionsByParent[condition.parent] = [];
      conditionsByParent[condition.parent].push(condition);
    });
    
    function createFromDB(condition)
    {
      var args = [null];
      if(condition.data)
        args = args.concat(JSON.parse(condition.data));
      
      if(condition.type == 'OperatorCondition')
      {
        var children = conditionsByParent[condition.id].map(createFromDB);
        args = args.concat(children);
      }
      
      //console.log("Condition type", condition.type, "and args", args);
      var Constructor = Scheduler[condition.type];
      Constructor = Constructor.bind.apply(Constructor, args);
      var result = new Constructor();
      
      result.dbId = condition.id;
      
      return result;
    }
    
    var result = createFromDB(root);
    //console.log("loaded", result, "as", category);
    return result;
  },
  
  load: function load(category)
  {
    return db.initializedPromise.then(function(db)
    {
      return db.all('SELECT * FROM scheduler WHERE category = $category ORDER BY root DESC', { $category: category });
    }).then(function(conditions)
    {
      if(!conditions[0].root)
        throw "Cannot find root in scheduler category " + category;
      return conditions;
    }).then(this.loadFromDbList.bind(this));
  }
};

Scheduler.Condition = function Condition() { };
Scheduler.Condition.prototype = new EventEmitter();
Scheduler.Condition.prototype.state = false;

function VariableCondition(initialState)
{
  EventEmitter.call(this);
  this._state = initialState;
}

VariableCondition.prototype = new Scheduler.Condition();

Object.defineProperty(VariableCondition.prototype, 'state',
{
  get: function getState()
  {
    return this._state;
  },
  set: function setState(newState)
  {
    var oldState = this._state;
    this._state = newState;
    if(oldState != newState)
      this.emit('state-changed', this);
  }
});

Scheduler.VariableCondition = VariableCondition;

function OperatorCondition(operator)
{
  var that = this;
  EventEmitter.call(this);
  this.conditions = Array.prototype.slice.call(arguments, 1);
  this.stateChanged = this.stateChanged.bind(this);
  this.conditions.forEach(function(condition)
  {
    condition.on('state-changed', that.stateChanged);
  });
  
  switch(operator)
  {
    case 'and':
      this.reduceState = function reduceAnd(a,b) { return a && b; };
    break;
    case 'or':
      this.reduceState = function reduceOr(a,b) { return a || b; };
    break;
    case 'nand':
    case 'orn':
      this.reduceState = function reduceNand(a,b) { return !a || !b; };
    break;
    case 'nor':
    case 'andn':
      this.reduceState = function reduceNor(a,b) { return !a && !b; };
    break;
  }
  
  this.oldState = -1;
}
OperatorCondition.prototype = new Scheduler.Condition();
Object.defineProperty(OperatorCondition.prototype, 'state',
{
  get: function state()
  {
    var that = this;
    return this.conditions
      .map(function(x) { return x.state; })
      .reduce(that.reduceState);
  }
});
OperatorCondition.prototype.stateChanged = function stateChanged(condition)
{
  var newState = this.state;
  if(newState != this.oldState)
  {
    this.oldState = newState;
    this.emit('state-changed', condition);
  }
};

Scheduler.OperatorCondition = OperatorCondition;

Date.prototype.setDay = function(dayOfWeek) {
    this.setDate(this.getDate() - this.getDay() + dayOfWeek);
};

DateCondition = function DateCondition(property, values)
{
  EventEmitter.call(this);
  this.property = property;
  if(values instanceof Array)
  {
    this.values = values.sort(function(a,b) { return a-b; } );
  }
  else
    this.values = [ values ];
  
  this.oldState = -1;
  
  this.schedule();
}
DateCondition.prototype = new Scheduler.Condition();
DateCondition.prototype.getProperty = function(date, prop)
{
  if(!prop) prop = this.property;
  return date['get' + prop](); //FIXME: capitalization
};
DateCondition.prototype.setProperty = function(date, value, prop)
{
  if(!prop) prop = this.property;
  date['set' + prop](value); //FIXME: capitalization
};
DateCondition.prototype.resetLower = function resetLower(date)
{
  date = new Date(date);
  var order = [ ['Seconds'], ['Minutes'], ['Hours'], ['Date', 'Day'], ['Month'], ['FullYear'] ];
  var resetTo =[ 0,            0,           0,         1,               0,         0 ];
  for(var i = 0; order[i].indexOf(this.property) == -1 && i < order.length; i++)
  {
    var propToReset = order[i][0];
    //console.log("Reset", propToReset, "to", resetTo[i], "in", date);
    this.setProperty(date, resetTo[i], propToReset);
  }
  //console.log("Result", date);
  return date;
};
DateCondition.prototype.schedule = function schedule()
{
  var now = new Date();
  var nextChange = this.resetLower(now);
  this.setProperty(nextChange, this.getProperty(nextChange) + 1); //TODO: check this.value
  
  var diff = nextChange.getTime() - now.getTime();
  //console.log(nextChange, diff);
  
  this.lastSchedule = now;
  this.targetSchedule = nextChange;
  this.timeout = setTimeout(this.stateChanged.bind(this), diff);
};
Object.defineProperty(DateCondition.prototype, 'state',
{
  get: function getState()
  {
    var now = new Date();
    return this.values.indexOf(this.getProperty(now)) != -1;
  }
});
DateCondition.prototype.stateChanged = function stateChanged()
{
  var newState = this.state;
  if(newState != this.oldState)
  {
    this.oldState = newState;
    this.emit('state-changed', this);
  }
  this.schedule();
};
Scheduler.DateCondition = DateCondition;


function LocationCondition(conditions)
{
  EventEmitter.call(this);
  this.conditions = conditions;
  this.geolocation = new browserApi.GeoLocation();
  this.currentLocation = null;
  this.state = false;
  
  this.onLocationChange = this.onLocationChange.bind(this);
  this.geolocation.watchPosition(this.onLocationChange);
}
LocationCondition.prototype = new Scheduler.Condition();

LocationCondition.prototype.onLocationChange = function onLocationChange(event)
{
  var distance = geolib.getDistance(event.coords, this.conditions, this.conditions.distance / 100);
  var newState = distance < this.conditions.distance;

  if(newState != this.state)
  {
    this.state = newState;
    this.emit('state-changed', this);
  }
};

Scheduler.LocationCondition = LocationCondition;

module.exports = exports = Scheduler;

/*TESTS*/
/*
var app = require('electron').app;

app.on('ready', function()
{
  var dateCondition = new DateCondition('Seconds', [1, 10, 12, 24, 25, 39, 50, 51, 52]);
  var dateCondition2 = new DateCondition('Minutes', [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58]);
  var locationCondition = new LocationCondition({ latitude: 51.4921714, longitude: 11.9571541, distance: 500 });
  var condition = new OperatorCondition('or', dateCondition, dateCondition2, locationCondition);
  console.log("State:", condition.state);
  condition.on('state-changed', function()
  {
    console.log("State changed:", condition.state);
  });
});
*/
//electron testing
/*
var browserApi = require('./browser-api');

app.on('ready', function()
{
  var onlineStatus = new browserApi.OnlineStatus();
  onlineStatus.on('online-status-changed', function(event) { console.log(event); });
  
  var geolocation = new browserApi.GeoLocation();
  geolocation.getCurrentPosition( function(position) { console.log(position); }, function(error) { console.log("error", error); });
});*/
