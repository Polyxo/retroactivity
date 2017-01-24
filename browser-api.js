var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;
var ipc = require('electron').ipcMain;
var EventEmitter = require('events');
var process = require('process');

process.env.GOOGLE_API_KEY = 'AIzaSyDWUqBQqohHRt5QtGTSHdW2CtZN9AcAGBA';

var browserWindow;

function initBrowserWindow()
{
  browserWindow = new BrowserWindow({ show: false });
  browserWindow.loadURL('file://' + __dirname + '/browser-api.html');
}

app.on('ready', function()
{
  exports.GeoLocation = function GeoLocation()
  {
    if(!browserWindow)
      initBrowserWindow();
    
    this.idCounter = 0;
    this.idMapping = [];
    this.successMapping = [];
    this.errorMapping = [];
  };
  
  exports.GeoLocation.prototype = new EventEmitter();
  
  exports.GeoLocation.prototype.getCurrentPosition = function getCurrentPosition(callback, errorCallback, options)
  {
    browserWindow.webContents.executeJavaScript('geolocation("getCurrentPosition", ' + JSON.stringify(options) + ');');
    ipc.once('got-current-position', function(event, position) { callback(position); });
    ipc.once('error-getting-current-position', function(event, error) { errorCallback(error); });
  };
  
  exports.GeoLocation.prototype.watchPosition = function getCurrentPosition(callback, errorCallback, options)
  {
    var id = this.idCounter++;
    browserWindow.webContents.executeJavaScript('geolocation("watchPosition", ' + JSON.stringify(options) + ');', false, this.idCallback.bind(this, id));
    ipc.on('got-current-position', this.successMapping[id] = function(event, position) { callback(position); });
    ipc.on('error-getting-current-position', this.errorMapping[id] = function(event, error) { errorCallback(error); });
    return id;
  };
  
  exports.GeoLocation.prototype.idCallback = function idCallback(ourID, remoteID)
  {
    this.idMapping[ourID] = remoteID;
    
    if(this.idMapping[ourID] == -1) //'poisoned' id, see clearWatch
      this.clearWatch(ourID);
  };
  
  exports.GeoLocation.prototype.clearWatch = function clearWatch(id)
  {
    if(this.idMapping[id])
    {
      browserWindow.webContents.executeJavaScript('navigator.geolocation.clearWatch(' +  JSON.stringify(id) + ');');
      delete this.idMapping[id];
      ipc.removeListener('got-current-position', this.successMapping[id]);
      delete this.successMapping[id];
      ipc.removeListener('error-getting-current-position', this.errorMapping[id]);
      delete this.errorMapping[id];
    }
    //maybe we do not have the remote ID yet, 'poison' this id, so the idCallback will call us again once we get it
    //but don't allow the user to clear future watches in advance
    else if(id < this.idCounter)
    {
      this.idMapping[id] = -1;
    }
  };
  
  exports.OnlineStatus = function OnlineStatus()
  {
    if(!browserWindow)
      initBrowserWindow();
    
    this.reEmit = this.reEmit.bind(this);
    
    ipc.on('online-status-changed', this.reEmit);
  };
  exports.OnlineStatus.prototype = new EventEmitter();
  
  exports.OnlineStatus.prototype.reEmit = function reEmit(event, status)
  {
    this.emit('online-status-changed', status);
  };
  
  exports.OnlineStatus.prototype.destroy = function destroy()
  {
    this.emit('will-destroy', this);
    ipc.removeListener('online-status-changed', reEmit);
    this.removeAllListeners();
  };
});
