var Command = require('./command');
var Promise = require('promise');

function AssignCommand(sliceID, taskID)
{
  this.type = 'Assign';
  this.doData = {sliceID: sliceID, taskID: taskID};
  this.guiUndoData = {};
  this.dbUndoData = {};
  console.log("New Assign", this.doData);
};

AssignCommand.prototype = new Command();

AssignCommand.prototype.guiDo = function guiDo(model, updateModel)
{
  var index = model.timeSlices.findIndex(function(slice) { return this.doData.sliceID == slice.id; }.bind(this));
  if(index != -1)
  {
    var update = { timeSlices: {} };
    this.guiUndoData.update = { timeSlices: {} };
    
    update.timeSlices[index] = { task: { $set: this.doData.taskID } };
    this.guiUndoData.update.timeSlices[index] = { task: { $set: model.timeSlices[index].task } };
    console.log("Assign update", update, "model", model);
    return Promise.resolve(updateModel(update));
  }
  this.guiUndoData.update = {};
  return Promise.resolve(updateModel({}));
};

AssignCommand.prototype.guiUndo = function guiUndo(model, updateModel)
{
  return Promise.resolve(updateModel(this.guiUndoData.update));
};

AssignCommand.prototype.dbDo = function dbDo(db)
{
  var getStatement = 'SELECT task AS taskID FROM slices WHERE id = $sliceID';
  var doStatement = 'UPDATE slices SET task = $taskID WHERE id = $sliceID';
  var values = { $taskID: this.doData.taskID, $sliceID: this.doData.sliceID };
  return this.dbUndoData.promise = db.run(getStatement, values).then(function(data)
  {
    this.dbUndoData.taskID = data.taskID;
    return db.run(doStatement, values);
  }.bind(this));
};

AssignCommand.prototype.dbUndo = function dbUndo(db)
{
  return this.dbUndoData.promise.then(function()
  {
    var undoStatement = 'UPDATE slices SET task = $taskID WHERE id = $sliceID';
    var values = { $taskID: this.dbUndoData.taskID, $sliceID: this.doData.sliceID };
    return db.run(undoStatement, values);
  }.bind(this));
};

module.exports = exports = AssignCommand;

