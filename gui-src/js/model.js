import EventEmitter from 'events';
import update from 'react-addons-update';
try
{
  var ipcRenderer = window.require('electron').ipcRenderer;
}
catch(e)
{
  console.log("We don't seem to run in electron, showing test data only!", e);
}

var emitter = new EventEmitter();

var model =
{
  timeSlices:
  [
    { begin: new Date(2017, 0, 2, 16,  0).getTime(), end: new Date(2017, 0, 2, 16, 10).getTime(), application: 1, task: null },
    { begin: new Date(2017, 0, 2, 16, 10).getTime(), end: new Date(2017, 0, 2, 16, 15).getTime(), application: 3, task: 2 },
    { begin: new Date(2017, 0, 2, 16, 15).getTime(), end: new Date(2017, 0, 2, 16, 30).getTime(), application: 4, task: 2 },
    { begin: new Date(2017, 0, 2, 16, 30).getTime(), end: new Date(2017, 0, 2, 16, 32).getTime(), application: 1, task: 2 },
    { begin: new Date(2017, 0, 2, 16, 32).getTime(), end: new Date(2017, 0, 2, 16, 38).getTime(), application: 4, task: 2 },
    { begin: new Date(2017, 0, 2, 16, 38).getTime(), end: new Date(2017, 0, 2, 16, 40).getTime(), application: 3, task: 1 },
    { begin: new Date(2017, 0, 2, 16, 40).getTime(), end: new Date(2017, 0, 2, 16, 41).getTime(), application: 1, task: null },
    { begin: new Date(2017, 0, 2, 16, 41).getTime(), end: new Date(2017, 0, 2, 16, 45).getTime(), application: 2, task: 1 },
    { begin: new Date(2017, 0, 2, 16, 45).getTime(), end: new Date(2017, 0, 2, 16, 48).getTime(), application: 3, task: 1 },
    { begin: new Date(2017, 0, 2, 16, 48).getTime(), end: new Date(2017, 0, 2, 17,  0).getTime(), application: 4, task: 1 },
  ],
  applications:
  {
    "1":
    {
      programName: "Firefox",
      icon: "img/firefox.png",
      color: '#ea7e1c'
    },
    "2":
    {
      programName: "Google Chrome",
      icon: "img/chrome.png",
      color: '#38a0ce'
    },
    "3":
    {
      programName: "gedit",
      icon: "img/gedit.png",
      color: '#97cf1a'
    },
    "4":
    {
      programName: "Adobe After Effects",
      icon: "img/ae.png",
      color: '#6f1f9c'
    },
  },
  tasks:
  {
    "1":
    {
      name: "Webseite Mercedes Benz > Landingpage C-Klasse",
      selection: 0
    },
    "2":
    {
      name: "Webseite Mercedes Benz > Konfigurator",
      selection: 1
    }
  }
};

function updateModel(spec)
{
  model = update(model, spec);
  console.log("new model", model);
  emitter.emit('update', model);
}

function onUpdateModel(listener)
{
  emitter.on('update', listener);
}

try
{
  ipcRenderer.on('update-model', function(event, arg)
  {
    updateModel(arg);
  });

  ipcRenderer.send('can-update-model', {});
}
catch(e)
{
  console.log("Cannot establish connection to electron main thread");
}

export default model;
export { updateModel, onUpdateModel };
