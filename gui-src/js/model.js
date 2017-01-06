import EventEmitter from 'events';
import update from 'react-addons-update';

var emitter = new EventEmitter();

var model =
{
  timeSlices:
  [
    { begin: new Date(2017, 0, 2, 16,  0), end: new Date(2017, 0, 2, 16, 10), application: 1, task: null },
    { begin: new Date(2017, 0, 2, 16, 10), end: new Date(2017, 0, 2, 16, 15), application: 3, task: 2 },
    { begin: new Date(2017, 0, 2, 16, 15), end: new Date(2017, 0, 2, 16, 30), application: 4, task: 2 },
    { begin: new Date(2017, 0, 2, 16, 30), end: new Date(2017, 0, 2, 16, 32), application: 1, task: 2 },
    { begin: new Date(2017, 0, 2, 16, 32), end: new Date(2017, 0, 2, 16, 38), application: 4, task: 2 },
    { begin: new Date(2017, 0, 2, 16, 38), end: new Date(2017, 0, 2, 16, 40), application: 3, task: 1 },
    { begin: new Date(2017, 0, 2, 16, 40), end: new Date(2017, 0, 2, 16, 41), application: 1, task: null },
    { begin: new Date(2017, 0, 2, 16, 41), end: new Date(2017, 0, 2, 16, 45), application: 2, task: 1 },
    { begin: new Date(2017, 0, 2, 16, 45), end: new Date(2017, 0, 2, 16, 48), application: 3, task: 1 },
    { begin: new Date(2017, 0, 2, 16, 48), end: new Date(2017, 0, 2, 17,  0), application: 4, task: 1 },
  ],
  applications:
  {
    "1":
    {
      name: "Firefox",
      logo: "img/firefox.png",
      color: '#ea7e1c'
    },
    "2":
    {
      name: "Google Chrome",
      logo: "img/chrome.png",
      color: '#38a0ce'
    },
    "3":
    {
      name: "gedit",
      logo: "img/gedit.png",
      color: '#97cf1a'
    },
    "4":
    {
      name: "Adobe After Effects",
      logo: "img/ae.png",
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

export default model;
export { updateModel, onUpdateModel };
