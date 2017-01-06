module.exports =
{
  openTaskAssignment: function()
  {
    console.log("OPEN TASK ASSIGNMENT!");
    var app = require('../app');
    app.openTaskAssignment();
  },
  
  toggleTaskAssignment: function(item)
  {
    console.log("TOGGLE TASK ASSIGNMENT!", item.checked);
    var app = require('../app');
    app.conditions.taskAssignmentActiveCondition.state = item.checked;
  },
  
  openStatistics: function()
  {
    console.log("OPEN STATISTICS!");
  },
  
  openSettings: function()
  {
    console.log("OPEN SETTINGS!");
  },
};
