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

		_lockActionId = _lockActionBtn.connect('clicked', _onLockClicked);
	}
    catch ( e ) {
        Main.notifyError( 'gnome-screensaver-lock: ' + e );
	}
}

function enable()
{
    _lockAction = Main.panel.statusArea.aggregateMenu._system._systemActions._actions.get("lock-screen");
    _lockAction.available = false;
    _lockActionBtn = Main.panel.statusArea.aggregateMenu._system._lockScreenAction;

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
}

function disable()
{
    _lockAction.available = true;
    _lockActionBtn.disconnect( _lockActionId );
	if (_cancellable) {
		_cancellable.cancel();
	}
}
