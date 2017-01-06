var app = require('electron').app;
var Menu = require('electron').Menu;
var Tray = require('electron').Tray;
var actions = require('./actions/index');

function AppTray()
{
  this.tray = null;

  app.on('ready', function()
  {
    this.tray = new Tray('gui/img/icon.png');
    this.menu = this.buildMenu();
    this.tray.setContextMenu(this.menu);
  }.bind(this));
}

AppTray.prototype.buildMenu = function buildMenu()
{
  return Menu.buildFromTemplate([
      { enabled: false, label: '10 minutes since last task assignment' },
      { enabled: false, label: '50 minutes until next task assignment' },
      { click: actions.toggleTaskAssignment, type: 'checkbox', label: 'ask me to assign tasks (hourly)', checked: true },
      { click: actions.openTaskAssignment, label: 'Assign tasks now...'  },
      { click: actions.openStatistics, label: 'Show statistics...' },
      { click: actions.openSettings, label: 'Settings...' }
    ]);
};

module.exports = new AppTray();
