/**
 * 🥐 Bunery Webview Extensions - Linux
 * Native GTK extensions for webview
 * Adds: setIcon, setMinSize, frameless, fullscreen, alwaysOnTop
 */

#include <gtk/gtk.h>
#include <gdk/gdk.h>

extern "C" {

/**
 * Set window icon
 */
void webview_set_icon(void* window_ptr, const char* icon_path) {
    GtkWindow* window = GTK_WINDOW(window_ptr);
    if (!window) return;
    
    GError* error = NULL;
    GdkPixbuf* icon = gdk_pixbuf_new_from_file(icon_path, &error);
    if (icon) {
        gtk_window_set_icon(window, icon);
        g_object_unref(icon);
    }
}

/**
 * Set minimum window size
 */
void webview_set_min_size(void* window_ptr, int width, int height) {
    GtkWindow* window = GTK_WINDOW(window_ptr);
    if (!window) return;
    
    GdkGeometry hints;
    hints.min_width = width;
    hints.min_height = height;
    gtk_window_set_geometry_hints(window, NULL, &hints, GDK_HINT_MIN_SIZE);
}

/**
 * Set frameless (borderless) window
 */
void webview_set_frameless(void* window_ptr, bool frameless) {
    GtkWindow* window = GTK_WINDOW(window_ptr);
    if (!window) return;
    
    gtk_window_set_decorated(window, !frameless);
}

/**
 * Toggle fullscreen
 */
void webview_toggle_fullscreen(void* window_ptr) {
    GtkWindow* window = GTK_WINDOW(window_ptr);
    if (!window) return;
    
    GdkWindow* gdk_window = gtk_widget_get_window(GTK_WIDGET(window));
    if (!gdk_window) return;
    
    GdkWindowState state = gdk_window_get_state(gdk_window);
    if (state & GDK_WINDOW_STATE_FULLSCREEN) {
        gtk_window_unfullscreen(window);
    } else {
        gtk_window_fullscreen(window);
    }
}

/**
 * Set always on top
 */
void webview_set_always_on_top(void* window_ptr, bool always_on_top) {
    GtkWindow* window = GTK_WINDOW(window_ptr);
    if (!window) return;
    
    gtk_window_set_keep_above(window, always_on_top);
}

} // extern "C"

