var modules = [ 'activity-monitor-x11>iconv', 'sqlite3', 'activity-monitor-x11>ref', 'activity-monitor-x11>ffi' ];

var path = require('path');
var getVersion = require('electron-version');
var requireRelative = require('require-relative');
var childProcess = require('child_process');

getVersion(function(err, version)
{
  version = version.slice(1); //remove 'v'
  
  modules.forEach(function(moduleName)
  {
    var modules = moduleName.split('>');
    var modulePath = __dirname;
    try
    {
      modules.forEach(function(part)
      {
        modulePath = path.dirname(requireRelative.resolve(part + '/package.json', modulePath));
      });
    }
    catch(e)
    {
      console.log("Cannot resolve module path", moduleName, ". It will be skipped!");
      return;
    }
    try
    {
      var nodePreGypPath = path.dirname(requireRelative.resolve('node-pre-gyp/package.json', modulePath));
      var gypBin = path.join(nodePreGypPath, 'bin/node-pre-gyp');
      var commands = ['install'];
    }
    catch(e)
    {
      var nodeGypPath = path.dirname(requireRelative.resolve('node-gyp/package.json', modulePath));
      var gypBin = path.join(nodeGypPath, 'bin/node-gyp.js');
      var commands = ['configure', 'build'];
    }
    console.log("Rebuilding module", moduleName);
    var args = commands.concat([
                '--build-from-source',
                '--fallback-to-build',
                '--runtime=electron',
                '--target=' + version,
                '--directory=' + modulePath,
                '--update-binary',
                '--dist-url=https://atom.io/download/atom-shell' ]);
    var result = childProcess.spawnSync(gypBin, args, { stdio: [0,1,2] });
    //console.log(result);
  });
});
