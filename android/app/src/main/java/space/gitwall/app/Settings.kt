package space.gitwall.app

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

data class Settings(
    val url: String = "",
    /** Daily refresh time, local clock. */
    val refreshHour: Int = 6,
    val refreshMinute: Int = 0,
    val lastSuccessAt: Long = 0L,
    val lastAttemptAt: Long = 0L,
    val lastError: String? = null,
    /** Epoch millis of the next scheduled exact alarm, 0 when none is set. */
    val nextRunAt: Long = 0L,
)

/** One small SharedPreferences file; a listener-backed Flow keeps the UI in sync with the worker. */
class SettingsStore(context: Context) {
    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences("gitwall", Context.MODE_PRIVATE)

    fun read(): Settings = Settings(
        url = prefs.getString(KEY_URL, "") ?: "",
        refreshHour = prefs.getInt(KEY_HOUR, 6),
        refreshMinute = prefs.getInt(KEY_MINUTE, 0),
        lastSuccessAt = prefs.getLong(KEY_LAST_SUCCESS, 0L),
        lastAttemptAt = prefs.getLong(KEY_LAST_ATTEMPT, 0L),
        lastError = prefs.getString(KEY_LAST_ERROR, null),
        nextRunAt = prefs.getLong(KEY_NEXT_RUN, 0L),
    )

    fun flow(): Flow<Settings> = callbackFlow {
        trySend(read())
        val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ -> trySend(read()) }
        prefs.registerOnSharedPreferenceChangeListener(listener)
        awaitClose { prefs.unregisterOnSharedPreferenceChangeListener(listener) }
    }

    fun saveUrl(url: String) {
        prefs.edit().putString(KEY_URL, url.trim()).apply()
    }

    fun saveRefreshTime(hour: Int, minute: Int) {
        prefs.edit().putInt(KEY_HOUR, hour.coerceIn(0, 23)).putInt(KEY_MINUTE, minute.coerceIn(0, 59)).apply()
    }

    fun saveNextRun(at: Long) {
        prefs.edit().putLong(KEY_NEXT_RUN, at).apply()
    }

    fun recordSuccess() {
        val now = System.currentTimeMillis()
        prefs.edit().putLong(KEY_LAST_SUCCESS, now).putLong(KEY_LAST_ATTEMPT, now).remove(KEY_LAST_ERROR).apply()
    }

    fun recordFailure(message: String) {
        prefs.edit().putLong(KEY_LAST_ATTEMPT, System.currentTimeMillis()).putString(KEY_LAST_ERROR, message).apply()
    }

    private companion object {
        const val KEY_URL = "url"
        const val KEY_HOUR = "refresh_hour"
        const val KEY_MINUTE = "refresh_minute"
        const val KEY_LAST_SUCCESS = "last_success"
        const val KEY_LAST_ATTEMPT = "last_attempt"
        const val KEY_LAST_ERROR = "last_error"
        const val KEY_NEXT_RUN = "next_run"
    }
}
