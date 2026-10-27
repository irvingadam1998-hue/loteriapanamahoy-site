package pa.suertepanama.app

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.WorkManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DrawAlertsModule(private val appContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(appContext) {

  override fun getName() = "DrawAlerts"

  @ReactMethod
  fun schedule(drawIds: ReadableArray, promise: Promise) {
    try {
      val knownIds = (0 until drawIds.size()).mapNotNull { index ->
        drawIds.getString(index)?.takeIf { it.isNotBlank() }
      }.toSet()
      appContext.getSharedPreferences("draw_alerts", Context.MODE_PRIVATE)
        .edit()
        .putStringSet("known_published_draw_ids", knownIds)
        .apply()
      WorkManager.getInstance(appContext).enqueueUniquePeriodicWork(
        DrawNotificationWorker.WORK_NAME,
        ExistingPeriodicWorkPolicy.KEEP,
        DrawNotificationWorker.request(),
      )
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("ALERTS_SCHEDULE_FAILED", error)
    }
  }
}
