package space.gitwall.app

import android.app.WallpaperManager
import android.content.Context
import android.graphics.BitmapFactory
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

class WallpaperException(message: String) : Exception(message)

/**
 * Downloads the PNG into memory and hands it to WallpaperManager for the lock
 * screen, the home screen, or both. Nothing is written to shared storage, so it
 * does not matter how a manufacturer stores or copies wallpapers internally.
 */
object WallpaperApplier {
    private const val MAX_BYTES = 40L * 1024 * 1024

    fun apply(context: Context, url: String, lockScreen: Boolean, homeScreen: Boolean) {
        var flags = 0
        if (lockScreen) flags = flags or WallpaperManager.FLAG_LOCK
        if (homeScreen) flags = flags or WallpaperManager.FLAG_SYSTEM
        if (flags == 0) throw WallpaperException("Choose at least one screen to set.")

        val bytes = download(url)
        val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            ?: throw WallpaperException("The server did not return an image.")

        val manager = WallpaperManager.getInstance(context)
        if (!manager.isSetWallpaperAllowed) {
            throw WallpaperException("This device or profile does not allow apps to change the wallpaper.")
        }
        try {
            manager.setBitmap(bitmap, null, true, flags)
        } catch (e: IOException) {
            throw WallpaperException("Android refused the wallpaper: ${e.message ?: "unknown error"}")
        } finally {
            bitmap.recycle()
        }
    }

    private fun download(url: String): ByteArray {
        var current = url
        // Follow redirects by hand so cross-host hops work too.
        repeat(5) {
            val conn = (URL(current).openConnection() as HttpURLConnection).apply {
                connectTimeout = 20_000
                readTimeout = 60_000
                instanceFollowRedirects = false
                setRequestProperty("User-Agent", "GitWall-Android/1.0")
                setRequestProperty("Accept", "image/png,image/*")
            }
            try {
                val code = conn.responseCode
                if (code in 300..399) {
                    val location = conn.getHeaderField("Location")
                        ?: throw WallpaperException("Redirect without a location.")
                    current = URL(URL(current), location).toString()
                    return@repeat
                }
                if (code != HttpURLConnection.HTTP_OK) {
                    throw WallpaperException(readServerError(conn, code))
                }
                val type = conn.contentType ?: ""
                if (!type.startsWith("image/")) {
                    throw WallpaperException("The URL returned $type instead of an image.")
                }
                if (conn.contentLengthLong > MAX_BYTES) {
                    throw WallpaperException("The image is too large to set as a wallpaper.")
                }
                return conn.inputStream.use { it.readBytes() }
            } catch (e: IOException) {
                throw WallpaperException("Could not reach the server: ${e.message ?: "network error"}")
            } finally {
                conn.disconnect()
            }
        }
        throw WallpaperException("Too many redirects.")
    }

    /** The GitWall API returns {"error": "..."}; surface that text when present. */
    private fun readServerError(conn: HttpURLConnection, code: Int): String {
        val body = runCatching { conn.errorStream?.bufferedReader()?.use { it.readText() } }.getOrNull() ?: ""
        val match = Regex("\"error\"\\s*:\\s*\"([^\"]+)\"").find(body)
        return match?.groupValues?.get(1) ?: "Server responded with HTTP $code."
    }
}
