// Bing Wallpaper GNOME extension
// Copyright (C) 2017-2022 Michael Carroll
// This extension is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// See the GNU General Public License, version 3 or later for details.
// Based on GNOME shell extension NASA APOD by Elia Argentieri https://github.com/Elinvention/gnome-shell-extension-nasa-apod

const { Gio, GLib, Soup, GdkPixbuf } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Config = imports.misc.config;
const Convenience = Me.imports.convenience;
const Gettext = imports.gettext.domain('hidebook');
const _ = Gettext.gettext;
const ByteArray = imports.byteArray;

var ROOT_DIR = 'Downloads/book/hidebook/';
var HIDEBOOK_SCHEMA = 'org.gnome.shell.extensions.hidebook';
let gitreleaseurl = 'https://github.com/liujinlong123/HideBook';

function validate_icon(icon_image = null) {
    if (icon_image) {
        let pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(Me.dir.get_path() + '/icons/book.svg', 32, 32);
        icon_image.set_from_pixbuf(pixbuf);
    }
}

// 获取图片列表
function getImageList() {
    let imageList = new Array();
    let root_file = Gio.file_new_for_path(ROOT_DIR);
    let childs = root_file.enumerate_children('standard::', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
    while (true) {
        const info = childs.next_file(null);

        if (info == null)
            break;

        imageList.push(info.get_name());
    }
    return imageList;
}