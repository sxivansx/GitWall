package space.gitwall.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

/**
 * One exact alarm per day at the user's chosen time. Exact alarms fire within
 * a minute even while the phone sleeps, unlike WorkManager's batched jobs that
 * Android may hold back for hours overnight. The alarm only enqueues the
 * worker; the download itself runs under WorkManager with its retries.
 */
object DailyAlarm {
    private const val REQUEST_CODE = 1001

    fun arm(context: Context, hour: Int, minute: Int) {
        val at = System.currentTimeMillis() + millisUntil(hour, minute)
        val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pending = pendingIntent(context)
        val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
        if (exact) {
            alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending)
        } else {
            // Exact alarms were revoked by the user; land as close as Android allows.
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending)
        }
        SettingsStore(context).saveNextRun(at)
    }

    fun cancel(context: Context) {
        val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarms.cancel(pendingIntent(context))
        SettingsStore(context).saveNextRun(0L)
    }

    fun millisUntil(hour: Int, minute: Int): Long {
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

    private fun pendingIntent(context: Context): PendingIntent =
        PendingIntent.getBroadcast(
            context,
            REQUEST_CODE,
            Intent(context, AlarmReceiver::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
}

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val settings = SettingsStore(context).read()
        if (settings.url.isBlank()) return
        // Re-arm first so a crash in the refresh can never lose tomorrow's alarm.
        DailyAlarm.arm(context, settings.refreshHour, settings.refreshMinute)
        Scheduler.runNow(context, RefreshWorker.SOURCE_ALARM)
    }
}

/** Alarms are cleared on reboot and can drift on clock or zone changes; re-arm and catch up. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED -> {
                val settings = SettingsStore(context).read()
                if (settings.url.isBlank()) return
                DailyAlarm.arm(context, settings.refreshHour, settings.refreshMinute)
                Scheduler.ensureHealthy(context)
            }
        }
    }
}
