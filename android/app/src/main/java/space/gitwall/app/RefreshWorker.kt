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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Calendar
import java.util.concurrent.TimeUnit

class RefreshWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val store = SettingsStore(applicationContext)
        val prepared = prepareWallpaperUrl(store.read().url, screenSize(applicationContext))
        if (prepared !is UrlCheck.Ok) {
            store.recordFailure("No valid wallpaper URL saved.")
            return@withContext Result.failure()
        }
        try {
            WallpaperApplier.applyLockScreen(applicationContext, prepared.url)
            store.recordSuccess()
            Result.success()
        } catch (e: WallpaperException) {
            store.recordFailure(e.message ?: "Unknown error")
            // Network trouble is worth a retry with backoff; a bad URL is not.
            if (runAttemptCount < 3 && e.message?.startsWith("Could not reach") == true) Result.retry() else Result.failure()
        } catch (e: Exception) {
            store.recordFailure(e.message ?: e.javaClass.simpleName)
            Result.failure()
        }
    }
}

object Scheduler {
    private const val DAILY = "gitwall-daily"
    private const val NOW = "gitwall-now"

    private val network = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    /**
     * WorkManager cannot promise an exact minute. Anchoring the first run at
     * the chosen time and repeating every 24h lands within the flex window on
     * every device and survives reboots without a boot receiver. Re-enqueueing
     * resets the anchor, which is what a changed time needs.
     */
    fun scheduleDaily(context: Context, hour: Int, minute: Int) {
        val request = PeriodicWorkRequestBuilder<RefreshWorker>(24, TimeUnit.HOURS, 30, TimeUnit.MINUTES)
            .setConstraints(network)
            .setInitialDelay(millisUntil(hour, minute), TimeUnit.MILLISECONDS)
            .build()
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(DAILY, ExistingPeriodicWorkPolicy.CANCEL_AND_REENQUEUE, request)
    }

    fun cancelDaily(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(DAILY)
    }

    /** Applies the wallpaper right away, in the background, using the saved URL. */
    fun runNow(context: Context) {
        val request = OneTimeWorkRequestBuilder<RefreshWorker>()
            .setConstraints(network)
            .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(NOW, ExistingWorkPolicy.REPLACE, request)
    }

    private fun millisUntil(hour: Int, minute: Int): Long {
        val now = Calendar.getInstance()
        val next = (now.clone() as Calendar).apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (!after(now)) add(Calendar.DAY_OF_YEAR, 1)
        }
        return next.timeInMillis - now.timeInMillis
    }
}
