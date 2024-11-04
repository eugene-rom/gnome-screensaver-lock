/* global imports */

const Main = imports.ui.main;
const Util = imports.misc.util;

let _shieldOnStatusChanged, _shieldActivate, _shieldLock, _shieldDeactivate;

function _lock() {
    Main.overview.hide();
    Main.panel.closeQuickSettings();
    Util.spawn( ['gnome-screensaver-command', '-l'] );
};

function _unlock() {
    Util.spawn( ['gnome-screensaver-command', '-d'] );
};

function enable()
{
    _shieldOnStatusChanged = null;
    _shieldActivate = null;
    _shieldLock = null;
    _shieldDeactivate = null;

    let _lockActionBtn = null;
    let arr = Main.panel.statusArea.quickSettings._system._systemItem.child.get_children();
    for (i = 0; i < arr.length; i++) {
        if ( arr[i].toString().includes( "LockItem" ) ) {
            _lockActionBtn = arr[i];
            break;
        }
    }

    if ( _lockActionBtn )
    {
        _shieldOnStatusChanged = Main.screenShield._onStatusChanged;
        _shieldActivate = Main.screenShield.activate;
        _shieldLock = Main.screenShield.lock;
        _shieldDeactivate = Main.screenShield.deactivate;

        Main.screenShield._onStatusChanged = (status) => {}; // prevents gnome shell message "error: Unable to lock: Lock was blocked by an application"
        Main.screenShield.activate = (animate) => { _lock(); };
        Main.screenShield.lock = (animate) => { _lock(); };
        Main.screenShield.deactivate = (animate) => { _unlock(); };

        _lockActionBtn.visible = true;
    }
}

function disable()
{
    if ( _shieldOnStatusChanged ) {
        Main.screenShield._onStatusChanged = _shieldOnStatusChanged;
    }
    if ( _shieldActivate ) {
        Main.screenShield.activate = _shieldActivate;
    }
    if ( _shieldLock ) {
        Main.screenShield.lock = _shieldLock;
    }
    if ( _shieldDeactivate ) {
        Main.screenShield.deactivate = _shieldDeactivate;
    }
}

