package com.rubio.bibliapp

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.util.Log
import android.widget.RemoteViews
import org.json.JSONObject

class DailyVerseWidget : AppWidgetProvider() {

  // Called once when the first instance of this widget is added.
  // Compute today's verse immediately (assets-based) and start the nightly alarm chain.
  override fun onEnabled(context: Context) {
    super.onEnabled(context)
    Thread { WidgetUpdateReceiver.computeAndCacheVerse(context) }.start()
    WidgetUpdateReceiver.scheduleMidnightAlarm(context)
  }

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    for (widgetId in appWidgetIds) {
      updateWidget(context, appWidgetManager, widgetId)
    }
  }

  companion object {
    fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int) {
      val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)

      // @capacitor/preferences stores keys WITHOUT the "CapacitorStorage." prefix
      val raw  = prefs.getString("widget_daily_verse", null)
      if (BuildConfig.DEBUG) Log.d("BibliWidget", "DailyVerse raw=$raw")

      val text = if (raw != null) runCatching { JSONObject(raw).getString("text") }.getOrNull() else null
      val ref  = if (raw != null) runCatching { JSONObject(raw).getString("ref")  }.getOrNull() else null

      val views = RemoteViews(context.packageName, R.layout.widget_verse)
      views.setTextViewText(R.id.widget_verse_text, text ?: "Abre la app para cargar el versículo del día")
      views.setTextViewText(R.id.widget_verse_ref,  ref  ?: "")

      appWidgetManager.updateAppWidget(widgetId, views)
    }
  }
}
