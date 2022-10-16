/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, St } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Widget = Me.imports.widget;
const Utils = Me.imports.utils;
const Convenience = Me.imports.convenience;

const Gio = imports.gi.Gio;

const _ = ExtensionUtils.gettext;

const getActorCompat = (obj) =>
    Convenience.currentVersionGreaterEqual('3.33') ? obj : obj.actor;

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('My Shiny Indicator'));

            this.add_child(new St.Icon({
                icon_name: 'face-smile-symbolic',
                style_class: 'system-status-icon',
            }));

            let item = new PopupMenu.PopupMenuItem(_('Show Notification'));
            this.menu.addMenuItem(item);

            let currentImg = new Widget.NextWallpaperWidget();
            this.menu.addMenuItem(currentImg.item);

            // 设置Icon
            this._setIcon();
        }

        // set indicator icon (tray icon)
        _setIcon() {
            Utils.validate_icon();
            let gicon = Gio.icon_new_for_string(Me.dir.get_child('icons').get_path() + '/book.svg');
            this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon' });
            getActorCompat(this).remove_all_children();
            getActorCompat(this).add_child(this.icon);
        }
    });

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        // Main.panel.addToStatusArea(this._uuid, this._indicator);

        this.settings = ExtensionUtils.getSettings(Utils.HIDEBOOK_SCHEMA);

        let indicatorName = `${Me.metadata.name} Indicator`;

        // Bind our indicator visibility to the GSettings value
        //
        // NOTE: Binding properties only works with GProperties (properties
        // registered on a GObject class), not native JavaScript properties
        this.settings.bind(
            'show-indicator',
            this._indicator,
            'visible',
            Gio.SettingsBindFlags.DEFAULT
        );

        Main.panel.addToStatusArea(indicatorName, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
