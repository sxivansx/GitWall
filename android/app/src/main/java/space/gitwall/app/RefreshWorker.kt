package space.gitwall.app

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

/**
 * Downloads the wallpaper and sets the chosen screens. Three things enqueue it:
 * the exact daily alarm, the user tapping the button, and the periodic
 * safety net. The periodic run steps aside when the alarm already did the job.
 */
class RefreshWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val store = SettingsStore(applicationContext)
        val settings = store.read()
        val source = inputData.getString(KEY_SOURCE) ?: SOURCE_MANUAL

        if (source == SOURCE_BACKUP) {
            val fresh = System.currentTimeMillis() - settings.lastSuccessAt < BACKUP_SKIP_WINDOW_MS
            if (fresh) return@withContext Result.success()
        }

        val prepared = prepareWallpaperUrl(settings.url, screenSize(applicationContext))
        if (prepared !is UrlCheck.Ok) {
            store.recordFailure("No valid wallpaper URL saved.")
            return@withContext Result.failure()
        }
        try {
            WallpaperApplier.apply(applicationContext, prepared.url, settings.lockScreen, settings.homeScreen)
            store.recordSuccess()
            Result.success()
        } catch (e: WallpaperException) {
            store.recordFailure(e.message ?: "Unknown error")
            // Network trouble is worth a few retries with backoff; a bad URL is not.
            val transient = e.message?.startsWith("Could not reach") == true || e.message?.contains("HTTP 5") == true
            if (transient && runAttemptCount < 5) Result.retry() else Result.failure()
        } catch (e: Exception) {
            store.recordFailure(e.message ?: e.javaClass.simpleName)
            Result.failure()
        }
    }

    companion object {
        const val KEY_SOURCE = "source"
        const val SOURCE_MANUAL = "manual"
        const val SOURCE_ALARM = "alarm"
        const val SOURCE_BACKUP = "backup"
        const val SOURCE_CATCHUP = "catchup"
        private val BACKUP_SKIP_WINDOW_MS = TimeUnit.HOURS.toMillis(20)
    }
}

object Scheduler {
    private const val DAILY_BACKUP = "gitwall-daily"
    private const val RUN = "gitwall-now"
    private val STALE_MS = TimeUnit.HOURS.toMillis(26)

    private val network = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    /**
     * Arms everything that keeps the wallpaper fresh:
     *  1. An exact alarm at the chosen time, which fires on the minute even in
     *     Doze and re-arms itself for the next day (see [AlarmReceiver]).
     *  2. A 24h periodic job as a safety net in case the alarm is lost, which
     *     skips itself when the alarm already refreshed within 20 hours.
     */
    fun scheduleDaily(context: Context, hour: Int, minute: Int) {
        DailyAlarm.arm(context, hour, minute)

        val backup = PeriodicWorkRequestBuilder<RefreshWorker>(24, TimeUnit.HOURS, 2, TimeUnit.HOURS)
            .setConstraints(network)
            .setInitialDelay(DailyAlarm.millisUntil(hour, minute) + TimeUnit.HOURS.toMillis(2), TimeUnit.MILLISECONDS)
            .setInputData(workDataOf(RefreshWorker.KEY_SOURCE to RefreshWorker.SOURCE_BACKUP))
            .build()
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(DAILY_BACKUP, ExistingPeriodicWorkPolicy.CANCEL_AND_REENQUEUE, backup)
    }

    fun cancelDaily(context: Context) {
        DailyAlarm.cancel(context)
        WorkManager.getInstance(context).cancelUniqueWork(DAILY_BACKUP)
    }

    /** Applies the wallpaper right away in the background using the saved URL. */
    fun runNow(context: Context, source: String = RefreshWorker.SOURCE_MANUAL) {
        val request = OneTimeWorkRequestBuilder<RefreshWorker>()
            .setConstraints(network)
            .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .setInputData(workDataOf(RefreshWorker.KEY_SOURCE to source))
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(RUN, ExistingWorkPolicy.REPLACE, request)
    }

    /**
     * Called when the app opens or the phone boots. Always re-arms the alarm,
     * because a reboot or a force-stop silently drops it and arming is
     * idempotent. If a refresh was missed (phone off, no network, aggressive
     * battery saver) it catches up now.
     */
    fun ensureHealthy(context: Context) {
        val settings = SettingsStore(context).read()
        if (settings.url.isBlank()) return
        DailyAlarm.arm(context, settings.refreshHour, settings.refreshMinute)
        if (System.currentTimeMillis() - settings.lastSuccessAt > STALE_MS) {
            runNow(context, RefreshWorker.SOURCE_CATCHUP)
        }
    }
}
