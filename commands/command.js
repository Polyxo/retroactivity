function Command()
{
}

Command.prototype =
{
  toJSON: function toJSON()
  {
    return { doData: this.doData, type: this.type };
  }
};

module.exports = exports = Command;
