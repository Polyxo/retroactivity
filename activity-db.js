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

Database.prototype =
{
  initialize: function initialize()
  {
    var key = 
    {
      windowID: 123,
      desktopFile: '/some/path',
      'class': 'some_string',
      gtkWinID: 'some_string',
      windowRole: 'some_string'
    };
    
    var obj =
    {
      'programName': 'some_string',
      'localisedProgramName': 'some_string',
      'icon': new Buffer(['1', '2', '3']),
      'color': '#123456'
    };
    
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
             objToSqliteSpec(key) + ', ' +
             objToSqliteSpec(obj) +
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
  }
}

module.exports = exports = new Database();
