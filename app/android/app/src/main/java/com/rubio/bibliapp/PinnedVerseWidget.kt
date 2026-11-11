package com.rubio.bibliapp

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.util.Log
import android.widget.RemoteViews
import org.json.JSONObject

class PinnedVerseWidget : AppWidgetProvider() {

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
      val raw  = prefs.getString("widget_pinned_verse", null)
      Log.d("BibliWidget", "PinnedVerse raw=$raw")

      val text = if (raw != null) runCatching { JSONObject(raw).getString("text") }.getOrNull() else null
      val ref  = if (raw != null) runCatching { JSONObject(raw).getString("ref")  }.getOrNull() else null

      val views = RemoteViews(context.packageName, R.layout.widget_verse_pinned)
      views.setTextViewText(R.id.widget_verse_text, text ?: "Pulsa ★ en un versículo para fijarlo aquí")
      views.setTextViewText(R.id.widget_verse_ref,  ref  ?: "")

      appWidgetManager.updateAppWidget(widgetId, views)
    }
  }
}
