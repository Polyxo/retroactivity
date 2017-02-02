var Command = require('./command');
var Promise = require('promise');

function GroupCommand(commands)
{
  this.type = 'Group';
  this.doData = commands;
  this.guiUndoData = { current: 0, promise: Promise.resolve() };
  this.dbUndoData = { current: 0 };
};

GroupCommand.prototype = new Command();

GroupCommand.prototype.add = function add(command)
{
  this.doData.splice(this.guiUndoData.current); //FIXME: what about dbUndoData?
  this.doData.push(command);
};

GroupCommand.prototype.guiDo = function guiDo(model, updateModel, num)
{
  var chain = this.guiUndoData.promise.then(function() { return model; });
  var begin = this.guiUndoData.current;
  var end = typeof num == 'undefined' ? undefined : begin+num;
  this.doData.slice(begin, end).forEach(function(command, i)
  {
    chain = chain.then(function(model) 
    {
      return command.guiDo(model, updateModel);
    }.bind(this)).then(function(model)
    {
      this.guiUndoData.current = begin+i+1;
      return model;
    }.bind(this));
  }.bind(this));
  this.guiUndoData.promise = chain;
  return chain;
};

GroupCommand.prototype.guiUndo = function guiUndo(model, updateModel, num)
{
  var chain = this.guiUndoData.promise.then(function() { return model; });
  var end = this.guiUndoData.current;
  var begin = typeof num == 'undefined' ? 0 : end-num;
  this.doData.slice(begin, end).reverse().forEach(function(command, i)
  {
    chain = chain.then(function(model)
    {
      return command.guiUndo(model, updateModel);
    }).then(function(model)
    {
      this.guiUndoData.current = end-i-1;
      return model;
    }.bind(this));
  }.bind(this));
  this.guiUndoData.promise = chain;
  return chain;
};

module.exports = exports = GroupCommand;
