package space.gitwall.app

import android.app.TimePickerDialog
import android.content.Intent
import android.os.Bundle
import android.text.format.DateFormat
import android.text.format.DateUtils
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.work.WorkInfo
import androidx.work.WorkManager
import kotlinx.coroutines.flow.map
import java.util.Calendar

private val Green = Color(0xFF39D353)
private val Ink = Color(0xFF0A0A0A)
private val Panel = Color(0xFF141414)
private val Line = Color(0xFF2A2A2A)
private val Muted = Color(0xFF8B8B8B)
private val Danger = Color(0xFFF87171)

class MainActivity : ComponentActivity() {
    private val incomingUrl = mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        incomingUrl.value = urlFrom(intent)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme(primary = Green, background = Ink, surface = Ink)) {
                Surface(Modifier.fillMaxSize(), color = Ink) {
                    Screen(incomingUrl.value) { incomingUrl.value = null }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        urlFrom(intent)?.let { incomingUrl.value = it }
    }

    private fun urlFrom(intent: Intent?): String? =
        extractWallpaperUrl(intent?.data, intent?.getStringExtra(Intent.EXTRA_TEXT))
}

@Composable
private fun Screen(incomingUrl: String?, onIncomingConsumed: () -> Unit) {
    val context = LocalContext.current
    val store = remember { SettingsStore(context) }
    val settings by store.flow().collectAsStateWithLifecycle(initialValue = store.read())
    val running by remember {
        WorkManager.getInstance(context).getWorkInfosForUniqueWorkFlow("gitwall-now")
            .map { list -> list.any { it.state == WorkInfo.State.RUNNING || it.state == WorkInfo.State.ENQUEUED } }
    }.collectAsState(initial = false)

    var url by remember { mutableStateOf(settings.url) }
    var validation by remember { mutableStateOf<String?>(null) }
    val clipboard = LocalClipboardManager.current
    val size = remember { screenSize(context) }

    // A URL handed over by the website replaces whatever is in the field.
    LaunchedEffect(incomingUrl) {
        if (incomingUrl != null) {
            url = incomingUrl
            validation = null
            onIncomingConsumed()
        }
    }

    fun apply() {
        when (val check = prepareWallpaperUrl(url, size)) {
            is UrlCheck.Invalid -> validation = check.reason
            is UrlCheck.Ok -> {
                validation = null
                store.saveUrl(url)
                Scheduler.scheduleDaily(context, settings.refreshHour, settings.refreshMinute)
                Scheduler.runNow(context)
            }
        }
    }

    fun pickTime() {
        TimePickerDialog(
            context,
            { _, hour, minute ->
                store.saveRefreshTime(hour, minute)
                // Only re-anchor the schedule when a wallpaper is already set up.
                if (settings.url.isNotBlank()) Scheduler.scheduleDaily(context, hour, minute)
            },
            settings.refreshHour,
            settings.refreshMinute,
            DateFormat.is24HourFormat(context),
        ).show()
    }

    Column(
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 32.dp),
    ) {
        Text("GitWall", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = (-0.5).sp)
        Spacer(Modifier.height(6.dp))
        Text(
            "Paste the wallpaper URL from gitwall.space. The app sets it as your lock screen now and refreshes it every day.",
            color = Muted, fontSize = 14.sp, lineHeight = 20.sp,
        )

        Spacer(Modifier.height(28.dp))
        Text("WALLPAPER URL", color = Muted, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.5.sp)
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = url,
            onValueChange = { url = it; validation = null },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("https://gitwall.space/api/wallpaper?user=...", color = Color(0xFF555555)) },
            singleLine = false,
            minLines = 2,
            isError = validation != null,
            supportingText = validation?.let { { Text(it, color = Danger) } },
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = Panel, unfocusedContainerColor = Panel,
                focusedBorderColor = Color(0xFF4A4A4A), unfocusedBorderColor = Line,
                focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                cursorColor = Green,
            ),
        )
        TextButton(onClick = { clipboard.getText()?.text?.let { url = it.trim(); validation = null } }) {
            Text("Paste from clipboard", color = Green, fontSize = 13.sp)
        }

        Spacer(Modifier.height(20.dp))
        Button(
            onClick = ::apply,
            enabled = !running,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Ink, disabledContainerColor = Color(0xFF333333)),
        ) {
            if (running) CircularProgressIndicator(Modifier.height(18.dp), color = Ink, strokeWidth = 2.dp)
            else Text("Set lock screen wallpaper", fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }

        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Refresh every day at", color = Muted, fontSize = 13.sp)
            TextButton(onClick = ::pickTime, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)) {
                Text(formatTime(context, settings.refreshHour, settings.refreshMinute), color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(Modifier.height(16.dp))
        Status(settings, size)
    }
}

private fun formatTime(context: android.content.Context, hour: Int, minute: Int): String {
    val cal = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, hour)
        set(Calendar.MINUTE, minute)
    }
    return DateFormat.getTimeFormat(context).format(cal.time)
}

@Composable
private fun Status(settings: Settings, size: ScreenSize) {
    val context = LocalContext.current
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        when {
            settings.lastError != null -> Text(settings.lastError, color = Danger, fontSize = 13.sp, lineHeight = 18.sp)
            settings.lastSuccessAt > 0L -> Text(
                "Lock screen updated " + DateUtils.getRelativeTimeSpanString(settings.lastSuccessAt).toString().lowercase() +
                    ". Next refresh around " + formatTime(context, settings.refreshHour, settings.refreshMinute) + ".",
                color = Green, fontSize = 13.sp, lineHeight = 18.sp,
            )
            else -> Text("Not set yet.", color = Muted, fontSize = 13.sp)
        }
        Text("This phone renders at ${size.width} x ${size.height}.", color = Color(0xFF555555), fontSize = 12.sp)
    }
}
