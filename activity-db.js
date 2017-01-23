var sqlite = require('sqlite');
var path = require('path');
var Promise = require('promise');

function Database()
{
  this.dbPromise = sqlite.open(path.join(__dirname, 'storage', 'database'));
}

function sqliteAffinity(value)
{
  switch(typeof value)
  {
    case 'string':
      return 'TEXT';
    case 'number':
      return 'NUMERIC';
    case 'object':
      return 'BLOB';
    default:
      return 'BLOB';
  }
}

function objToSqliteSpec(obj)
{
  return Object.keys(obj).map(function(name) { return name + ' ' + sqliteAffinity(obj[name]); }).join(', ');
};

var exampleKey = 
{
  windowID: 123,
  pid: 123,
  desktopFile: '/some/path',
  'class': 'some_string',
  gtkWinID: 'some_string',
  windowRole: 'some_string'
};

var exampleData =
{
  'programName': 'some_string',
  'localisedProgramName': 'some_string',
  'icon': new Buffer(['1', '2', '3']),
  'color': '#123456'
};

Database.prototype =
{
  initialize: function initialize()
  {
    
    
    this.initializedPromise = this.dbPromise.then(function(db)
    {
      return Promise.all
      ([
        db.run('PRAGMA foreign_keys = ON;'),
        db.run
        (
          'CREATE TABLE IF NOT EXISTS applications ' +
          '(' +
             'id INTEGER PRIMARY KEY, ' +
             objToSqliteSpec(exampleKey) + ', ' +
             objToSqliteSpec(exampleData) +
          ');'
        ),
        db.run
        (
          'CREATE TABLE IF NOT EXISTS tasks ' +
          '( ' +
            'id INTEGER PRIMARY KEY, ' +
            'name TEXT, ' +
            'parent INTEGER, ' +
            'FOREIGN KEY(parent) REFERENCES tasks(parent)' +
          ');'
        ),
        db.run
        (
          'CREATE TABLE IF NOT EXISTS slices ' +
          '( ' +
            'id INTEGER PRIMARY KEY, ' +
            'begin INTEGER, ' +
            'end INTEGER, ' +
            'application INTEGER, ' +
            'task INTEGER, ' +
            'FOREIGN KEY(application) REFERENCES applications(id), ' +
            'FOREIGN KEY(task) REFERENCES tasks(id)' +
          ');'
        )
      ]);
    }).then(function(results)
    {
      console.log("DB initialized");
      return this.dbPromise;
    }.bind(this), function(err)
    {
      console.log("DB error", err);
      throw err;
    });
    
    return this.initializedPromise;
  },
  
  insertApplication: function insertApplication(key, data)
  {
    var fields = Object.keys(exampleKey).concat(Object.keys(exampleData));
    var values = fields.map(function(name) { if(typeof key[name] !== 'undefined') return key[name]; else return data[name]; });
    return this.initializedPromise.then(function(db)
    {
      var statement = 'INSERT INTO applications (' + fields.join(', ') + ') VALUES(' + fields.map(function() { return '?'; }).join(', ') + ')';
      
      return db.run(statement, values);
    }).then(function(result)
    {
      if(result.changes > 0)
      {
        return Object.assign({}, key, data, {id: result.lastID});
      }
      else
        throw "insert failed"; //FIXME
    });
  },
  
  matchApplication: function matchApplication(key)
  {
    return this.initializedPromise.then(function(db)
    {
      var newKey =  {};
      Object.keys(key).forEach(function(propName)
      {
        newKey['$' + propName] = key[propName];
      });
      
      var statement = 'SELECT * FROM applications WHERE ';
      var whereClauses = [];
      Object.keys(key).forEach(function(propName)
      {
        whereClauses.push(propName + ' = $' + propName);
      });
      statement += whereClauses.join(' OR ');
      
      statement += ' LIMIT 1';
      
      return db.get(statement, newKey);
    });
  },
  
  
  //returns: db id of application
  matchOrInsertApplication: function matchOrInserApplication(window)
  {
    return window.getKeyObject().then(function(iKey)
    {
      key = iKey;
      return this.matchApplication(key);
    }.bind(this)).then(function(result)
    {
      if(!result)
      {
        return window.getFrozen().then(function(iData)
        {
          data = iData;
          return this.insertApplication(key, data);
        }.bind(this)).then(function(result)
        {
          return result;
        }.bind(this));
      }
      else
        return result;
    }.bind(this));
  },
  
  addSlice: function addSlice(begin, end, application, task)
  {
    if(typeof begin == 'object') begin = begin.getTime();
    if(typeof end == 'object') end = end.getTime();
    if(typeof application == 'object') application = application.id;
    
    var values = { $begin: begin, $end: end, $application: application, $task: task };
    
    var db = null;
    return this.initializedPromise.then(function(idb)
    {
      db = idb;
      
      var statement = 'UPDATE slices ' +
                        'SET end = max(end, $end), begin = min(begin, $begin) ' +
                        'WHERE (application = $application OR IFNULL(application, $application) IS NULL) ' +
                        'AND   (task        = $task        OR IFNULL(task, $task) IS NULL) ' +
                        'AND end >= $begin AND begin <= $end';
      return db.run(statement, values);
    }.bind(this)).then(function(result)
    {
      if(result.changes < 1)
      {
        var statement = 'INSERT INTO slices (begin, end, application, task) VALUES ($begin, $end, $application, $task)';
        return db.run(statement, values);
      }
      return result;
    });
  },
  
  getSlices: function getSlices(begin, end)
  {
    if(typeof begin == 'object') begin = begin.getTime();
    if(typeof end == 'object') end = end.getTime();
    
    var values = { $begin: begin, $end: end };
    var db = null;
    
    return this.initializedPromise.then(function(idb)
    {
      db = idb;
      
      var statement = 'SELECT * FROM slices WHERE end >= $begin AND begin <= $end';
      return db.all(statement, values);
    }.bind(this)).then(function(result)
    {
      console.log("Get slices", result, values, "now", new Date().getTime());
      return result;
    });
  },
  
  getApplications: function getApplications(ids)
  {
    if(ids && ids.length > 0)
    {
      var where = ' WHERE id IN (' + ids.map(function() { return '?'; }).join(', ') + ')';
    }
    else
    {
      var where = '';
      ids = [];
    }
    
    return this.initializedPromise.then(function(idb)
    {
      db = idb;
      
      var statement = 'SELECT * FROM applications' + where;
      return db.all(statement, ids);
    }.bind(this)).then(function(result)
    {
      var applications = {};
      result.forEach(function(app) { applications[app.id] = app; });
      return applications;
    });
  }
}

module.exports = exports = new Database();
