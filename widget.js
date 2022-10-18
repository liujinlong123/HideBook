// -------------------------------------------------------------------------------

const { GObject, St } = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Pixbuf = imports.gi.GdkPixbuf;
const Clutter = imports.gi.Clutter;
const Cogl = imports.gi.Cogl;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const Gio = imports.gi.Gio;
const Utils = Me.imports.utils;

/**
 * Shows a preview of the next wallpaper to be set.
 * 文件操作: https://gjs.guide/guides/gio/file-operations.html#navigating-files-and-directories
 * 官网内容: https://gjs.guide/guides/
 */
var NextWallpaperWidget = GObject.registerClass({},
    class NextWallpaperWidget extends GObject.Object {

        _init() {
            this._icon = new Clutter.Actor()
            this._img = new Clutter.Image();
            this.item = new PopupMenu.PopupBaseMenuItem({ reactive: false });
            // Overall Box:
            this._box = new St.BoxLayout({
                vertical: true,
            });

            this.item.add_child(this._box)
            this._box.span = -1;
            this._box.align = St.Align.MIDDLE;

            // The computer-picture:
            let initial_pixbuf = Pixbuf.Pixbuf.new_from_file(this.getDefaultImagePath());

            this._img.set_data(initial_pixbuf.get_pixels(),
                initial_pixbuf.get_has_alpha() ? Cogl.PixelFormat.RGBA_8888
                    : Cogl.PixelFormat.RGB_888,
                initial_pixbuf.get_width(),
                initial_pixbuf.get_height(),
                initial_pixbuf.get_rowstride());
            this._icon.set_content(this._img);
            this._icon.set_size(500, 700.0 / initial_pixbuf.get_height() * initial_pixbuf.get_width());

            this._icon_bin = new St.Bin({
                child: this._icon, // The icon has much space on top/bottom,
            });
            this._box.add(this._icon_bin);

            this._texture = new Clutter.Actor({
                content: this._img
            });

            this._wallpaper = new St.Bin({
                style_class: "overlay"
            });
            this._wallpaper.set_child(this._texture);
            this._box.add(this._wallpaper);
        }

        setDefault() {
            this.setNextWallpaper(this.getDefaultImagePath());
        }

        getDefaultImagePath() {
            let userDefaultImg = Gio.file_new_for_path(Utils.ROOT_DIR_BOOK + 'default.png');
            let file_exists = userDefaultImg.query_exists(null);
            if (file_exists) {
                return userDefaultImg.get_path();
            }

            let defaultImg = Me.dir.get_child('image').get_child("default.png");
            return defaultImg.get_path();
        }

        /**
         * Load the next image to be set as the wallpaper into the widget.
         * @param path the path to the image to preview.
         */
        setNextWallpaper(path) {
            let pixbuf = Pixbuf.Pixbuf.new_from_file(path);
            let new_img = new Clutter.Image();
            let isSet = new_img.set_data(pixbuf.get_pixels(),
                pixbuf.get_has_alpha() ? Cogl.PixelFormat.RGBA_8888
                    : Cogl.PixelFormat.RGB_888,
                pixbuf.get_width(),
                pixbuf.get_height(),
                pixbuf.get_rowstride());

            if (isSet === false) {
                throw "Image at '" + path + "' couldn't be found. It will be removed from the list...";
            } else {
                this._texture.set_content(new_img);
                this._wallpaper.set_child(this._texture);
                this._icon.set_content(new_img);

            }
        }

        destroy() {
            this._wallpaper.destroy();
            this._wallpaper = null;

            // Call the base-implementation:
            PopupMenu.PopupBaseMenuItem.prototype.destroy.call(this.item);
        }
    });

// -------------------------------------------------------------------------------