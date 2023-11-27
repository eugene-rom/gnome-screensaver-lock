/* global imports */

const Main = imports.ui.main;
const Util = imports.misc.util;
const SystemActions = imports.misc.systemActions;

let _systemActivateLockScreen, _systemOnStatusChanged;

function enable()
{
    _systemOnStatusChanged = null;
    _systemActivateLockScreen = null;
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
        _systemOnStatusChanged = Main.screenShield._onStatusChanged;
        _systemActivateLockScreen = SystemActions.getDefault().activateLockScreen;

        Main.screenShield._onStatusChanged = (status) => {}; // prevents gnome shell message "error: Unable to lock: Lock was blocked by an application"

        SystemActions.getDefault().activateLockScreen = () => {
            Main.overview.hide();
            Main.panel.closeQuickSettings();
            Util.spawn( ['gnome-screensaver-command', '-l'] );
	    };

        _lockActionBtn.visible = true;
    }
}

function disable()
{
    if ( _systemOnStatusChanged ) {
        Main.screenShield._onStatusChanged = _systemOnStatusChanged;
    }
    if ( _systemActivateLockScreen ) {
        SystemActions.getDefault().activateLockScreen = _systemActivateLockScreen;
    }
}
