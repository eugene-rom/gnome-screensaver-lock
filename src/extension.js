/* global imports */

import Gio from 'gi://Gio'

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import * as Keyboard from 'resource:///org/gnome/shell/ui/status/keyboard.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class GnomeScreenSaverHack extends Extension
{
    _lock() {
        Main.overview.hide();
        Main.panel.closeQuickSettings();
        Util.spawn( ['gnome-screensaver-command', '-l'] );
    };

    _unlock() {
        Util.spawn( ['gnome-screensaver-command', '-d'] );
    };

    _reset_kbd_layout()
    {
        const sourceman = Keyboard.getInputSourceManager();

        if ( !sourceman ) {
            return;
        }

        const idx = sourceman.currentSource.index;

        if ( idx !== 0 ) {
            sourceman.inputSources[0].activate( true );
        }
    }

    enable()
    {
        this._shieldOnStatusChanged = null;
        this._shieldActivate = null;
        this._shieldLock = null;
        this._shieldDeactivate = null;

        let _lockActionBtn = null;
        let arr = Main.panel.statusArea.quickSettings._system._systemItem.child.get_children();
        for (let i = 0; i < arr.length; i++) {
            if ( arr[i].toString().includes( "LockItem" ) ) {
                _lockActionBtn = arr[i];
                break;
            }
        }

        if ( _lockActionBtn )
        {
            this._shieldOnStatusChanged = Main.screenShield._onStatusChanged;
            this._shieldActivate = Main.screenShield.activate;
            this._shieldLock = Main.screenShield.lock;
            this._shieldDeactivate = Main.screenShield.deactivate;

            Main.screenShield._onStatusChanged = (status) => {}; // prevents gnome shell message "error: Unable to lock: Lock was blocked by an application"
            Main.screenShield.activate = (animate) => { this._lock() };
            Main.screenShield.lock = (animate) => { this._lock() };
            Main.screenShield.deactivate = (animate) => { this._unlock() };

            _lockActionBtn.visible = true;

            Gio.DBus.session.signal_subscribe( null, "org.gnome.ScreenSaver", "ActiveChanged", "/org/gnome/ScreenSaver", null,
                Gio.DBusSignalFlags.NONE, (connection, sender, path, iface, signal, params) => {
                    this._reset_kbd_layout();
                } );
        }
    }

    disable()
    {
        if ( this._shieldOnStatusChanged ) {
            Main.screenShield._onStatusChanged = this._shieldOnStatusChanged;
        }
        if ( this._shieldActivate ) {
            Main.screenShield.activate = this._shieldActivate;
        }
        if ( this._shieldLock ) {
            Main.screenShield.lock = this._shieldLock;
        }
        if ( this._shieldDeactivate ) {
            Main.screenShield.deactivate = this._shieldDeactivate;
        }
    }
}
