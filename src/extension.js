/* global imports */

const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const Util = imports.misc.util;
const BoxPointer = imports.ui.boxpointer;

let _systemMenu, _shieldOnStatusChanged, _shieldActivate, _shieldLock, _shieldDeactivate;

function _lock() {
    Main.overview.hide();
    _systemMenu.menu.itemActivated( BoxPointer.PopupAnimation.NONE );
    Util.spawn( ['gnome-screensaver-command', '-l'] );
};

function _unlock() {
    Util.spawn( ['gnome-screensaver-command', '-d'] );
};

function _reset_kbd_layout()
{
    const sourceman = imports.ui.status.keyboard.getInputSourceManager();

    if ( !sourceman ) {
        return;
    }

    const idx = sourceman.currentSource.index;

    if ( idx !== 0 ) {
        sourceman.inputSources[0].activate( true );
    }
}

function enable()
{
    _systemMenu = Main.panel.statusArea['aggregateMenu']._system;

    _shieldOnStatusChanged = Main.screenShield._onStatusChanged;
    _shieldActivate = Main.screenShield.activate;
    _shieldLock = Main.screenShield.lock;
    _shieldDeactivate = Main.screenShield.deactivate;

    Main.screenShield._onStatusChanged = (status) => {}; // prevents gnome shell message "error: Unable to lock: Lock was blocked by an application"
    Main.screenShield.activate = (animate) => { _lock(); };
    Main.screenShield.lock = (animate) => { _lock(); };
    Main.screenShield.deactivate = (animate) => { _unlock(); };

    // hack to release dbus name
    let id = Gio.DBus.session.own_name('org.gnome.ScreenSaver', Gio.BusNameOwnerFlags.REPLACE, null, null);
    for ( let i = 0; i <= id; i++ ) {
        Gio.DBus.session.unown_name(i);
    }

    Util.spawn( ['gnome-screensaver'] );

    Gio.DBus.session.signal_subscribe( null, "org.gnome.ScreenSaver", "ActiveChanged", "/org/gnome/ScreenSaver", null,
            Gio.DBusSignalFlags.NONE, (connection, sender, path, iface, signal, params) => {
                _reset_kbd_layout();
            } );
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

