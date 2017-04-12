var Scheduler = require('./scheduler');
var actions = require('./actions/index');
var BrowserWindow = require('electron').BrowserWindow;
var electronApp = require('electron').app;
var database = require('./activity-db');
try
{
  if(process.platform == 'linux')
    var ActivityMonitor = require('activity-monitor-x11');
  else if(process.platform == 'darwin')
    var ActivityMonitor = require('activity-monitor-mac');
  else if(process.platform == 'win32')
    var ActivityMonitor = require('activity-monitor-win');
  else
    throw new Error("Cannot find activity-monitor package for current platform");
}
catch(e)
{
  //TODO: show error window
}

var ipc = require('electron').ipcMain;
var Promise = require('promise');

function App()
{
  this.tray = require('./tray');
  
  this.database = database;
  this.database.initialize();
  
  this.activityMonitor = new ActivityMonitor();
  
  this.scheduler = new Scheduler();
  
  Promise.all(['taskAssignmentRepeatCondition', this.scheduler.load('taskAssignmentRepeat'),
               'taskAssignmentDoCondition',     this.scheduler.load('taskAssignmentDo'),
               'taskAssignmentActiveCondition', new Scheduler.VariableCondition(true)])
  .then(function(conditions)
  {
    this.conditions = {};
    for(var i = 0; i < conditions.length; i++)
      this.conditions[conditions[i]] = conditions[i+1];
    
    this.conditions.taskAssignmentDoAskCondition =
      new Scheduler.OperatorCondition('and', this.conditions.taskAssignmentRepeatCondition,
                                             this.conditions.taskAssignmentDoCondition,
                                             this.conditions.taskAssignmentActiveCondition);
    
    this.conditions.activityMonitorCondition =
      new Scheduler.DateCondition('Seconds', [0, 10, 20, 30, 40, 50]);
    
    this.conditions.taskAssignmentDoAskCondition.on('state-changed', function()
    {
      if(this.conditions.taskAssignmentDoAskCondition.state == true)
        actions.openTaskAssignment();
    }.bind(this));
    
    this.sampleActivity = this.sampleActivity.bind(this);
    this.conditions.activityMonitorCondition.on('state-changed', this.sampleActivity);
  }.bind(this), function(err)
  {
    console.log("Error initializing conditions:", err);
  });
  
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
  
  sampleActivity: function sampleActivity()
  {
    if(this.conditions.activityMonitorCondition.state == true)
    {
      this.activityMonitor.getActiveWindow()
      .then(this.database.matchOrInsertApplication.bind(this.database))
      .then(function(dbApp)
      {
        console.log("Matched or inserted:", dbApp);
        var lastSample = this.lastSample;
        this.lastSample = new Date();
        console.log("Add slice", lastSample, new Date(), dbApp.id, null);
        return this.database.addSlice(lastSample, new Date(), dbApp.id, null);
      }.bind(this))
      .catch(function(err)
      {
        console.log("Something went wrong:", err);
      });
    }
  }
};

var app = new App();

module.exports = app;
