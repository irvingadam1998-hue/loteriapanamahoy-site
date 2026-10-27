package pa.suertepanama.app

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.app.PendingIntent
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequest
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkerParameters
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

class DrawNotificationWorker(context: Context, params: WorkerParameters) :
  CoroutineWorker(context, params) {

  override suspend fun doWork(): Result {
    val connection = (URL(API_URL).openConnection() as HttpURLConnection).apply {
      connectTimeout = 10_000
      readTimeout = 10_000
      requestMethod = "GET"
      setRequestProperty("Accept", "application/json")
    }

    return try {
      if (connection.responseCode !in 200..299) return Result.retry()
      val payload = connection.inputStream.bufferedReader().use { it.readText() }
      val draws = JSONArray(payload)
      val preferences = applicationContext.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
      val known = preferences.getStringSet(KNOWN_IDS, null)
      val currentIds = mutableSetOf<String>()
      val newDraws = mutableListOf<org.json.JSONObject>()

      for (index in 0 until draws.length()) {
        val draw = draws.optJSONObject(index) ?: continue
        val id = draw.optString("id")
        if (id.isBlank()) continue
        currentIds.add(id)
        if (known != null && id !in known) newDraws.add(draw)
      }

      // The app saves the visible result IDs at activation, so old results are skipped.
      if (known != null && newDraws.isNotEmpty() && !notifyResults(newDraws)) {
        return Result.success()
      }
      preferences.edit().putStringSet(KNOWN_IDS, currentIds).apply()
      Result.success()
    } catch (_: Exception) {
      Result.retry()
    } finally {
      connection.disconnect()
    }
  }

  private fun notifyResults(draws: List<org.json.JSONObject>): Boolean {
    if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(
        applicationContext,
        Manifest.permission.POST_NOTIFICATIONS,
      ) != PackageManager.PERMISSION_GRANTED
    ) return false

    val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Resultados nuevos", NotificationManager.IMPORTANCE_DEFAULT),
      )
    }

    val newest = draws.first()
    val title = newest.optString("title").ifBlank { "Nuevo resultado de lotería" }
    val number = newest.optString("number")
    val first = newest.optString("first")
    val second = newest.optString("second")
    val third = newest.optString("third")
    val body = "Sorteo N.º $number · 1.º $first · 2.º $second · 3.º $third"
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(applicationContext, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(applicationContext)
    }
    val openApp = PendingIntent.getActivity(
      applicationContext,
      0,
      Intent(applicationContext, MainActivity::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    manager.notify(
      NOTIFICATION_ID,
      builder
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentTitle(title)
        .setContentText(body)
        .setContentIntent(openApp)
        .setStyle(Notification.BigTextStyle().bigText(body))
        .setAutoCancel(true)
        .build(),
    )
    return true
  }

  companion object {
    const val WORK_NAME = "published-lottery-results"
    private const val API_URL = "https://loteriapanamahoy.site/api/draws"
    private const val PREFERENCES = "draw_alerts"
    private const val KNOWN_IDS = "known_published_draw_ids"
    private const val CHANNEL_ID = "lottery_results"
    private const val NOTIFICATION_ID = 4107

    fun request(): PeriodicWorkRequest = PeriodicWorkRequestBuilder<DrawNotificationWorker>(
      15,
      TimeUnit.MINUTES,
    ).setConstraints(
      Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build(),
    ).build()
  }
}
