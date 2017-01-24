module.exports = exports =
{
  arrayToURL: function arrayToURL(array, mimetype)
  {
    if(typeof array === 'string')
      return array;
    var blob = new Blob([array], {type: mimetype}); // ein gültiger MIME-Typ
    return URL.createObjectURL(blob);
  },
  
  dateManipulation:
  {
    setProperty: function setProperty(date, value, prop)
    {
      date['set' + prop](value); //FIXME: capitalization
    },

    getProperty: function getProperty(date, prop)
    {
      return date['get' + prop](); //FIXME: capitalization
    },

    resetLower: function resetLower(date, property)
    {
      date = new Date(date);
      var order = [ ['Seconds'], ['Minutes'], ['Hours'], ['Date', 'Day'], ['Month'], ['FullYear'] ];
      var resetTo =[ 0,            0,           0,         1,               0,         0 ];
      for(var i = 0; i < order.length && order[i].indexOf(property) == -1; i++)
      {
        var propToReset = order[i][0];
        //console.log("Reset", propToReset, "to", resetTo[i], "in", date);
        exports.dateManipulation.setProperty(date, resetTo[i], propToReset);
      }
      //console.log("Result", date);
      return date;
    },
    
    formatDuration: function formatDuration(duration)
    {
      if(duration == 0)
        return '';
      
      var unitNames = [ 'ms', 's', 'm', 'h', 'd' ];
      var unitDividers = [ 1000, 60,  60,  24 ];
      
      for(var i = 0; i < 4 && duration > unitDividers[i]; i++)
      {
        duration /= unitDividers[i];
      }
      
      return Math.round(duration) + ' ' + unitNames[i];
    }
  }
};
