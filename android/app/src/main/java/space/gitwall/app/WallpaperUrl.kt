package space.gitwall.app

import android.content.Context
import android.graphics.Point
import android.net.Uri
import android.os.Build
import android.view.WindowManager

data class ScreenSize(val width: Int, val height: Int)

/** Physical portrait resolution of the display, which is what the lock screen wallpaper should fill. */
fun screenSize(context: Context): ScreenSize {
    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val (w, h) = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val bounds = wm.maximumWindowMetrics.bounds
        bounds.width() to bounds.height()
    } else {
        val p = Point()
        @Suppress("DEPRECATION")
        wm.defaultDisplay.getRealSize(p)
        p.x to p.y
    }
    return ScreenSize(minOf(w, h), maxOf(w, h))
}

sealed class UrlCheck {
    data class Ok(val url: String) : UrlCheck()
    data class Invalid(val reason: String) : UrlCheck()
}

/**
 * Validates the URL copied from the website and fills in this phone's real
 * resolution when the URL has no width/height. A URL that already carries a
 * size is left untouched.
 */
fun prepareWallpaperUrl(raw: String, size: ScreenSize): UrlCheck {
    val text = raw.trim()
    if (text.isEmpty()) return UrlCheck.Invalid("Paste your wallpaper URL from gitwall.space.")
    val uri = runCatching { Uri.parse(text) }.getOrNull()
        ?: return UrlCheck.Invalid("That does not look like a URL.")
    val scheme = uri.scheme?.lowercase()
    if (scheme != "https" && scheme != "http") return UrlCheck.Invalid("The URL must start with https://")
    if (uri.host.isNullOrBlank()) return UrlCheck.Invalid("The URL is missing a host.")
    if (uri.getQueryParameter("user").isNullOrBlank()) {
        return UrlCheck.Invalid("The URL has no GitHub username. Copy it again from the website.")
    }

    val hasSize = !uri.getQueryParameter("width").isNullOrBlank() && !uri.getQueryParameter("height").isNullOrBlank()
    if (hasSize) return UrlCheck.Ok(text)

    val builder = uri.buildUpon().clearQuery()
    for (name in uri.queryParameterNames) {
        // `device` picks an iPhone canvas on the server; drop it once an explicit size is set.
        if (name == "device") continue
        for (value in uri.getQueryParameters(name)) builder.appendQueryParameter(name, value)
    }
    builder.appendQueryParameter("width", size.width.toString())
    builder.appendQueryParameter("height", size.height.toString())
    return UrlCheck.Ok(builder.build().toString())
}

/** Wallpaper URL from a gitwall://setup?url=... deep link or from shared text. */
fun extractWallpaperUrl(data: Uri?, sharedText: String?): String? {
    data?.getQueryParameter("url")?.takeIf { it.isNotBlank() }?.let { return it }
    val text = sharedText?.trim() ?: return null
    return Regex("https?://\\S+").find(text)?.value
}
