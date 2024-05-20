/* global imports */

const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const Util = imports.misc.util;
const BoxPointer = imports.ui.boxpointer;

let systemMenu, _cancellable, _proxy, _lockActionBtn, _lockActionId, _lockAction;

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
    systemMenu.menu.itemActivated( BoxPointer.PopupAnimation.NONE );
    _proxy.call( "Lock", null, Gio.DBusCallFlags.NONE, -1, null, _onProxyCallFailure );
}

function _onProxyReady(o, res)
{
    try
    {
        _cancellable = null;
        _proxy = Gio.DBusProxy.new_finish(res);
        _lockActionId = _lockActionBtn.connect( 'activate', _onLockClicked );
    }
    catch ( e ) {
        Main.notifyError( 'gnome-screensaver-lock: ' + e );
    }
}

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
    _lockAction = Main.panel.statusArea.aggregateMenu._system._systemActions._actions.get("lock-screen");
    _lockAction.available = false;
    _lockActionBtn = Main.panel.statusArea.aggregateMenu._system._lockScreenItem;
    Main.panel.statusArea.aggregateMenu._system._lockScreenItem.visible = true;

    systemMenu = Main.panel.statusArea['aggregateMenu']._system;
    _cancellable = new Gio.Cancellable();
    Gio.DBusProxy.new(Gio.DBus.session,
                      Gio.DBusProxyFlags.DO_NOT_LOAD_PROPERTIES | Gio.DBusProxyFlags.DO_NOT_CONNECT_SIGNALS | Gio.DBusProxyFlags.DO_NOT_AUTO_START,
                      null,
                      "org.gnome.ScreenSaver",
                      "/org/gnome/ScreenSaver",
                      "org.gnome.ScreenSaver",
                      _cancellable,
                      _onProxyReady);

    Gio.DBus.session.signal_subscribe( null, "org.gnome.ScreenSaver", "ActiveChanged", "/org/gnome/ScreenSaver", null,
            Gio.DBusSignalFlags.NONE, (connection, sender, path, iface, signal, params) => {
                _reset_kbd_layout();
            } );
}

function disable()
{
    _lockAction.available = true;
    _lockActionBtn.disconnect( _lockActionId );
    if (_cancellable) {
        _cancellable.cancel();
    }
}
