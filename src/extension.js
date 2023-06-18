/* global imports */

const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const Util = imports.misc.util;

let systemMenu, _cancellable, _proxy, _lockActionBtn, _lockActionId;

function _onProxyCallFailure(o, res)
{
    try {
        o.call_finish(res);
    }
    catch ( e ) {
        // Make one last-ditch attempt by having the D-Bus call done externally
        Util.spawn( ['gnome-screensaver-command', '-l'] );
    }
}

function _onLockClicked() {
    Main.overview.hide();
    Main.panel.closeQuickSettings();
    _proxy.call( "Lock", null, Gio.DBusCallFlags.NONE, -1, null, _onProxyCallFailure );
}

function _onProxyReady(o, res)
{
    try
    {
        _cancellable = null;
        _proxy = Gio.DBusProxy.new_finish(res);
        _lockActionId = _lockActionBtn.connect( 'clicked', _onLockClicked );
    }
    catch ( e ) {
        Main.notifyError( 'gnome-screensaver-lock: ' + e );
    }
}

function enable()
{
    _lockActionBtn = Main.panel.statusArea.quickSettings._system._systemItem.child.get_children()[5];
    _lockActionBtn.visible = true;

    _cancellable = new Gio.Cancellable();
    Gio.DBusProxy.new(Gio.DBus.session,
                      Gio.DBusProxyFlags.DO_NOT_LOAD_PROPERTIES | Gio.DBusProxyFlags.DO_NOT_CONNECT_SIGNALS | Gio.DBusProxyFlags.DO_NOT_AUTO_START,
                      null,
                      "org.gnome.ScreenSaver",
                      "/org/gnome/ScreenSaver",
                      "org.gnome.ScreenSaver",
                      _cancellable,
                      _onProxyReady);
}

function disable()
{
    _lockActionBtn.disconnect( _lockActionId );
    if (_cancellable) {
        _cancellable.cancel();
    }
}

