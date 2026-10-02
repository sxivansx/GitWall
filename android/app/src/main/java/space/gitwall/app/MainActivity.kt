package space.gitwall.app

import android.app.TimePickerDialog
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings as AndroidSettings
import android.text.format.DateFormat
import android.text.format.DateUtils
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.work.WorkInfo
import androidx.work.WorkManager
import kotlinx.coroutines.flow.map
import java.util.Calendar

// Palette mirrors the website: near-black canvas, GitHub green accent.
private val Green = Color(0xFF39D353)
private val Ink = Color(0xFF0A0A0A)
private val Panel = Color(0xFF121212)
private val PanelRaised = Color(0xFF181818)
private val Line = Color(0xFF262626)
private val TextPrimary = Color(0xFFF2F2F2)
private val TextMuted = Color(0xFF8A8A8A)
private val TextDim = Color(0xFF5A5A5A)
private val Danger = Color(0xFFF87171)
private val Amber = Color(0xFFF5C451)

private enum class RunState { IDLE, WAITING_NETWORK, RUNNING }

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

private fun isBatteryUnrestricted(context: Context): Boolean {
    val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    return pm.isIgnoringBatteryOptimizations(context.packageName)
}

@Composable
private fun Screen(incomingUrl: String?, onIncomingConsumed: () -> Unit) {
    val context = LocalContext.current
    val store = remember { SettingsStore(context) }
    val settings by store.flow().collectAsStateWithLifecycle(initialValue = store.read())
    val runState by remember {
        WorkManager.getInstance(context).getWorkInfosForUniqueWorkFlow("gitwall-now").map { list ->
            when {
                list.any { it.state == WorkInfo.State.RUNNING } -> RunState.RUNNING
                // Enqueued but not running means the network constraint is unmet.
                list.any { it.state == WorkInfo.State.ENQUEUED } -> RunState.WAITING_NETWORK
                else -> RunState.IDLE
            }
        }
    }.collectAsState(initial = RunState.IDLE)

    var url by remember { mutableStateOf(settings.url) }
    var message by remember { mutableStateOf<String?>(null) }
    var batteryOk by remember { mutableStateOf(isBatteryUnrestricted(context)) }
    val clipboard = LocalClipboardManager.current
    val size = remember { screenSize(context) }
    val hasUnsavedUrl = settings.url.isNotBlank() && url.trim() != settings.url

    // On every return to the screen: re-read the battery setting (the user may
    // have just changed it in Settings) and catch up on a missed refresh.
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                batteryOk = isBatteryUnrestricted(context)
                Scheduler.ensureHealthy(context)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // A URL handed over by the website replaces whatever is in the field.
    LaunchedEffect(incomingUrl) {
        if (incomingUrl != null) {
            url = incomingUrl
            message = null
            onIncomingConsumed()
        }
    }

    fun apply() {
        when (val check = prepareWallpaperUrl(url, size)) {
            is UrlCheck.Invalid -> message = check.reason
            is UrlCheck.Ok -> {
                message = null
                store.saveUrl(url)
                Scheduler.scheduleDaily(context, settings.refreshHour, settings.refreshMinute)
                Scheduler.runNow(context)
            }
        }
    }

    fun paste() {
        val text = clipboard.getText()?.text?.trim()
        if (text.isNullOrEmpty()) {
            message = "Clipboard is empty. Copy the URL from gitwall.space first."
        } else {
            url = text
            message = null
        }
    }

    fun pickTime() {
        TimePickerDialog(
            context,
            { _, hour, minute ->
                store.saveRefreshTime(hour, minute)
                if (settings.url.isNotBlank()) Scheduler.scheduleDaily(context, hour, minute)
            },
            settings.refreshHour,
            settings.refreshMinute,
            DateFormat.is24HourFormat(context),
        ).show()
    }

    fun requestUnrestrictedBattery() {
        val direct = Intent(AndroidSettings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:${context.packageName}"))
        runCatching { context.startActivity(direct) }
            .onFailure { runCatching { context.startActivity(Intent(AndroidSettings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)) } }
    }

    Column(
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 28.dp, bottom = 32.dp),
    ) {
        Header()

        Spacer(Modifier.height(28.dp))
        Card {
            Label("Wallpaper URL")
            Spacer(Modifier.height(10.dp))
            UrlField(url, onChange = { url = it; message = null })
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                LinkButton("Paste from clipboard", onClick = ::paste)
                if (hasUnsavedUrl) {
                    Spacer(Modifier.width(12.dp))
                    Text("New URL not applied yet", color = Amber, fontSize = 12.sp)
                }
            }
            message?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = Danger, fontSize = 13.sp, lineHeight = 18.sp)
            }
        }

        Spacer(Modifier.height(14.dp))
        Button(
            onClick = ::apply,
            modifier = Modifier.fillMaxWidth().height(54.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Ink),
        ) {
            when (runState) {
                RunState.RUNNING -> {
                    CircularProgressIndicator(Modifier.size(18.dp), color = Ink, strokeWidth = 2.dp)
                    Spacer(Modifier.width(10.dp))
                    Text("Setting wallpaper", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                RunState.WAITING_NETWORK -> Text("Waiting for internet", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                RunState.IDLE -> Text(
                    if (settings.lastSuccessAt > 0L) "Update lock screen now" else "Set lock screen wallpaper",
                    fontWeight = FontWeight.Bold, fontSize = 15.sp,
                )
            }
        }

        Spacer(Modifier.height(14.dp))
        Card {
            Label("Schedule")
            Spacer(Modifier.height(6.dp))
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable(onClick = ::pickTime).padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Refresh every day at", color = TextPrimary, fontSize = 14.sp)
                Text(
                    formatTime(context, settings.refreshHour, settings.refreshMinute),
                    color = Green, fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                )
            }
            Divider()
            Row(
                Modifier.fillMaxWidth().padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Background refresh", color = TextPrimary, fontSize = 14.sp)
                    Text(
                        if (batteryOk) "Allowed. The refresh can run while the phone sleeps."
                        else "Restricted. Android may delay the refresh for hours.",
                        color = if (batteryOk) TextMuted else Amber, fontSize = 12.sp, lineHeight = 16.sp,
                    )
                }
                Spacer(Modifier.width(12.dp))
                if (batteryOk) Dot(Green) else LinkButton("Allow", onClick = ::requestUnrestrictedBattery, color = Amber)
            }
        }

        Spacer(Modifier.height(14.dp))
        StatusCard(settings, runState, size)
    }
}

@Composable
private fun Header() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Mark()
        Spacer(Modifier.width(12.dp))
        Column {
            Text("GitWall", color = TextPrimary, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = (-0.5).sp)
            Text("Your contribution graph, on your lock screen.", color = TextMuted, fontSize = 13.sp)
        }
    }
}

/** The four-cell GitWall mark, laid out like the website favicon. */
@Composable
private fun Mark() {
    Canvas(Modifier.size(40.dp).background(Color(0xFF0D1117), RoundedCornerShape(10.dp))) {
        val gap = size.width * 0.07f
        val cell = (size.width - gap * 3) / 2
        val r = CornerRadius(cell * 0.18f)
        val dark = Color(0xFF1F2630)
        fun cellAt(col: Int, row: Int, color: Color) = drawRoundRect(
            color, Offset(gap + col * (cell + gap), gap + row * (cell + gap)), Size(cell, cell), r,
        )
        cellAt(0, 0, dark); cellAt(1, 0, Green); cellAt(0, 1, Green); cellAt(1, 1, dark)
    }
}

@Composable
private fun Card(content: @Composable () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .background(Panel, RoundedCornerShape(16.dp))
            .border(1.dp, Line, RoundedCornerShape(16.dp))
            .padding(16.dp),
    ) { content() }
}

@Composable
private fun Label(text: String) {
    Text(text.uppercase(), color = TextDim, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.4.sp)
}

@Composable
private fun Divider() {
    Box(Modifier.fillMaxWidth().height(1.dp).background(Line))
}

@Composable
private fun Dot(color: Color) {
    Box(Modifier.size(10.dp).clip(CircleShape).background(color))
}

@Composable
private fun LinkButton(text: String, onClick: () -> Unit, color: Color = Green) {
    Text(
        text,
        color = color,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.clip(RoundedCornerShape(6.dp)).clickable(onClick = onClick).padding(horizontal = 4.dp, vertical = 4.dp),
    )
}

@Composable
private fun UrlField(value: String, onChange: (String) -> Unit) {
    Box(
        Modifier
            .fillMaxWidth()
            .background(PanelRaised, RoundedCornerShape(12.dp))
            .border(1.dp, Line, RoundedCornerShape(12.dp))
            .padding(horizontal = 14.dp, vertical = 12.dp),
    ) {
        if (value.isEmpty()) {
            Text("https://gitwall.space/api/wallpaper?user=…", color = TextDim, fontSize = 13.sp, fontFamily = FontFamily.Monospace)
        }
        BasicTextField(
            value = value,
            onValueChange = onChange,
            textStyle = TextStyle(color = Green, fontSize = 13.sp, fontFamily = FontFamily.Monospace, lineHeight = 19.sp),
            cursorBrush = SolidColor(Green),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
            minLines = 2,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun StatusCard(settings: Settings, runState: RunState, size: ScreenSize) {
    val context = LocalContext.current
    val (tone, headline) = when {
        runState == RunState.RUNNING -> Green to "Setting your lock screen…"
        runState == RunState.WAITING_NETWORK -> Amber to "Waiting for an internet connection."
        settings.lastError != null -> Danger to "Last attempt failed"
        settings.lastSuccessAt > 0L -> Green to "Lock screen updated " + relative(settings.lastSuccessAt)
        else -> TextMuted to "Not set yet"
    }
    Card {
        Label("Status")
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Dot(tone)
            Spacer(Modifier.width(10.dp))
            Text(headline, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
        }
        if (settings.lastError != null && runState == RunState.IDLE) {
            Spacer(Modifier.height(6.dp))
            Text(
                relative(settings.lastAttemptAt).replaceFirstChar { it.uppercase() } + ": " + settings.lastError,
                color = Danger, fontSize = 13.sp, lineHeight = 18.sp, modifier = Modifier.padding(start = 20.dp),
            )
        }
        Spacer(Modifier.height(12.dp))
        Divider()
        Spacer(Modifier.height(10.dp))
        InfoRow("Next refresh", if (settings.nextRunAt > 0L) formatWhen(context, settings.nextRunAt) else "Not scheduled")
        Spacer(Modifier.height(6.dp))
        InfoRow("Screen size", "${size.width} × ${size.height}")
    }
}

@Composable
private fun InfoRow(key: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(key, color = TextMuted, fontSize = 13.sp)
        Text(value, color = TextPrimary, fontSize = 13.sp)
    }
}

private fun relative(at: Long): String {
    if (System.currentTimeMillis() - at < DateUtils.MINUTE_IN_MILLIS) return "just now"
    return DateUtils.getRelativeTimeSpanString(at).toString().lowercase()
}

private fun formatTime(context: Context, hour: Int, minute: Int): String {
    val cal = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, hour)
        set(Calendar.MINUTE, minute)
    }
    return DateFormat.getTimeFormat(context).format(cal.time)
}

private fun formatWhen(context: Context, at: Long): String =
    DateUtils.formatDateTime(context, at, DateUtils.FORMAT_SHOW_TIME or DateUtils.FORMAT_SHOW_DATE or DateUtils.FORMAT_ABBREV_ALL)
