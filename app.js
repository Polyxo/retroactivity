var Scheduler = require('./scheduler');
var actions = require('./actions/index');
var BrowserWindow = require('electron').BrowserWindow;
var electronApp = require('electron').app;
var database = require('./activity-db');

function App()
{
  this.tray = require('./tray');
  this.conditions =
  {
    taskAssignmentAskCondition: new Scheduler.DateCondition('Seconds', 0),
    taskAssignmentDoCondition: new Scheduler.DateCondition('Day', [1,2,3,4,5]),
    taskAssignmentActiveCondition: new Scheduler.VariableCondition(true)
  };
  this.conditions.taskAssignmentDoAskCondition =
    new Scheduler.OperatorCondition('and', this.conditions.taskAssignmentAskCondition,
                                           this.conditions.taskAssignmentDoCondition,
                                           this.conditions.taskAssignmentActiveCondition);
  
  this.conditions.taskAssignmentDoAskCondition.on('state-changed', function()
  {
    if(this.conditions.taskAssignmentDoAskCondition.state == true)
      actions.openTaskAssignment();
  }.bind(this));
  
  this.database = database;
  this.database.initialize();
  
  electronApp.on('window-all-closed', function() {
    //Keep running :)
  });
}

App.prototype =
{
  openTaskAssignment: function openTaskAssignment()
  {
    //FIXME: switch to task assignment view
    return this.openAppWindow();
  },
  
  openAppWindow: function openAppWindow()
  {
    this.database.matchApplication({ windowID: 123 }).then(function(app)
    {
      console.log("match", app);
    }, function(err)
    {
      console.log("match err", err);
    });
    
    if(!this.window)
    {
      this.window = new BrowserWindow({ webPreferences: { }, height: 600, width: 1200});
      this.window.loadURL('file://' + __dirname + '/gui/index.html');
      this.window.on('close', function()
      {
        delete this.window;
      }.bind(this));
    }
  },
};

var app = new App();

module.exports = app;
