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

// https://gjs-docs.gnome.org/gio20~2.66p/
const Gio = imports.gi.Gio;

// https://www.cs.uni.edu/~okane/Code/Glade%20Cookbook/37b%20Running%20GTK%20on%20Windows%2010%20using%20Visual%20C++/share/icons/Adwaita/32x32/actions/
const ICON_PREVIOUS_BUTTON = 'media-seek-backward-symbolic';
const ICON_NEXT_BUTTON = 'media-seek-forward-symbolic';
const ICON_SWITCH = 'media-playlist-shuffle-symbolic';

// edit-redo-symbolic-rtl.symbolic.png
// 	edit-undo-symbolic.symbolic.png
const ICON_RESET = 'view-refresh-symbolic';

const _ = ExtensionUtils.gettext;

const getActorCompat = (obj) =>
    Convenience.currentVersionGreaterEqual('3.33') ? obj : obj.actor;

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('My Shiny Indicator'));

            // 设置Icon
            this._setIcon();

            let item = new PopupMenu.PopupMenuItem(_('Refresh Now'));
            this.menu.addMenuItem(item);
            item.connect('activate', () => {
                this._refreshImage();
            });

            this.currentImg = new Widget.NextWallpaperWidget();
            this.menu.addMenuItem(this.currentImg.item);

            // 设置控制条
            this._setControl();

            // 监听
            this.menu.connect('open-state-changed', (menu, open) => {
                if (open) {
                    // log(' ------> 打开了');
                } else {
                    // log(' ------> 关闭了');
                    this.isHide = true;
                    this.currentImg.setDefault();
                }
            });

            // 类变量
            this._settings = ExtensionUtils.getSettings(Utils.HIDEBOOK_SCHEMA);

            this.imageList = Utils.getImageList();
            this.picIndex = 0;

            let cacheIndex = this._settings.get_int('current-index');
            if (cacheIndex >= 0 && cacheIndex < this.imageList.length) {
                this.picIndex = cacheIndex;
            }

            this.isHide = true;
        }

        // 设置控制条
        _setControl() {
            this.controlItem = new PopupMenu.PopupMenuItem("");
            this.menu.addMenuItem(this.controlItem);

            // 重置
            this.resetBtn = this._newMenuIcon(
                ICON_RESET,
                this.controlItem,
                this._resetImage);

            // 上一页
            this.prevBtn = this._newMenuIcon(
                ICON_PREVIOUS_BUTTON,
                this.controlItem,
                this._prevImage);

            // 刷新
            this.refreshBtn = this._newMenuIcon(
                ICON_SWITCH,
                this.controlItem,
                this._refreshImage);

            // 下一页
            this.nextBtn = this._newMenuIcon(
                ICON_NEXT_BUTTON,
                this.controlItem,
                this._nextImage);
        }

        // set indicator icon (tray icon)
        _setIcon() {
            Utils.validate_icon();
            let gicon = Gio.icon_new_for_string(Me.dir.get_path() + '/icons/book.svg');
            this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon' });
            getActorCompat(this).remove_all_children();
            getActorCompat(this).add_child(this.icon);
        }

        // 重置
        _resetImage() {
            this.picIndex = 0;
            this.imageList = Utils.getImageList();
            this._settings.set_int('current-index', this.picIndex);

            this.currentImg.setDefault();
        }

        // 上一页
        _prevImage() {
            if (this.picIndex < 1) {
                Main.notify(_('index = ' + this.picIndex));
                return;
            }

            if (this.imageList.length < 1) {
                Main.notify(_('image list is empty!'));
                return;
            }

            this.picIndex--;
            if (this.picIndex < 0) this.picIndex = 0;
            this.currentImg.setNextWallpaper(Utils.ROOT_DIR + this.imageList[this.picIndex]);
            this._settings.set_int('current-index', this.picIndex);
        }

        // 刷新
        _refreshImage() {
            this.isHide = !this.isHide;
            if (this.isHide) {
                this.currentImg.setDefault();
            } else {
                if (this.picIndex >= 0 && this.picIndex < this.imageList.length) {
                    this.currentImg.setNextWallpaper(Utils.ROOT_DIR + this.imageList[this.picIndex]);
                }
            }
        }

        // 下一页
        _nextImage() {
            if (this.picIndex >= this.imageList.length - 1) {
                Main.notify(_('It`s the last picture, no next!'));
                return;
            }

            if (this.imageList.length < 1) {
                Main.notify(_('image list is empty!'));
                return;
            }

            this.picIndex++;
            if (this.picIndex >= this.imageList.length) {
                this.picIndex = this.imageList.length - 1;
            }
            this.currentImg.setNextWallpaper(Utils.ROOT_DIR + this.imageList[this.picIndex]);
            this._settings.set_int('current-index', this.picIndex);
        }

        _newMenuIcon(icon_name, parent, fn, position = null) {
            let icon = new St.Icon({
                icon_name: icon_name,
                style_class: 'popup-menu-icon',
                x_expand: false,
                y_expand: false
            });

            let iconBtn = new St.Button({
                style_class: 'ci-action-btn',
                can_focus: true,
                child: icon,
                /* x_align: Clutter.ActorAlign.END, // FIXME: errors on GNOME 3.28, default to center is ok */
                x_expand: true,
                y_expand: true
            });

            if (position) {
                getActorCompat(parent).insert_child_at_index(iconBtn, position);
            }
            else {
                getActorCompat(parent).add_child(iconBtn);
            }

            iconBtn.connect('button-press-event', fn.bind(this));
            return iconBtn;
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
