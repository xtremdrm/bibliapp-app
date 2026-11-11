package com.rubio.bibliapp

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

class WidgetUpdateReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (BuildConfig.DEBUG) Log.d("BibliWidget", "WidgetUpdateReceiver action=${intent.action}")

        // Only act on the actions this receiver is meant to handle. Because the
        // component is exported, any app could send it an explicit intent; gating
        // on a known action set prevents unexpected work from arbitrary callers.
        val action = intent.action
        val allowed = action == null || // null = our own midnight PendingIntent
            action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == AppWidgetManager.ACTION_APPWIDGET_UPDATE
        if (!allowed) return

        // goAsync() gives up to ~10 s for file I/O without ANR
        val pending = goAsync()
        Thread {
            try {
                computeAndCacheVerse(context)

                val awm = AppWidgetManager.getInstance(context)

                val dailyIds = awm.getAppWidgetIds(
                    ComponentName(context, DailyVerseWidget::class.java)
                )
                for (id in dailyIds) DailyVerseWidget.updateWidget(context, awm, id)

                val pinnedIds = awm.getAppWidgetIds(
                    ComponentName(context, PinnedVerseWidget::class.java)
                )
                for (id in pinnedIds) PinnedVerseWidget.updateWidget(context, awm, id)

            } catch (e: Exception) {
                Log.e("BibliWidget", "WidgetUpdateReceiver error: ${e.message}")
            } finally {
                // Always reschedule next midnight alarm (idempotent)
                scheduleMidnightAlarm(context)
                pending.finish()
            }
        }.start()
    }

    companion object {

        /**
         * Schedule a one-shot alarm at 00:01 tomorrow.
         * After firing, onReceive calls this again -> self-perpetuating daily chain.
         */
        fun scheduleMidnightAlarm(context: Context) {
            val midnight = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, 1)
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 1)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }.timeInMillis

            val pi = PendingIntent.getBroadcast(
                context, 42,
                Intent(context, WidgetUpdateReceiver::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
                    // No exact-alarm permission: fire within a 10-minute window of midnight
                    am.setWindow(AlarmManager.RTC_WAKEUP, midnight, 10 * 60 * 1000L, pi)
                } else {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, midnight, pi)
                }
                if (BuildConfig.DEBUG) Log.d("BibliWidget", "Midnight alarm scheduled")
            } catch (e: SecurityException) {
                Log.w("BibliWidget", "Exact alarm denied, using inexact: ${e.message}")
                am.set(AlarmManager.RTC_WAKEUP, midnight, pi)
            }
        }

        /**
         * Compute today's verse from bundled assets using the same deterministic
         * algorithm as VerseOfTheDayService.ts:
         *   dayIndex = floor(epochMs / 86400000)
         *   ref = verses[dayIndex % verses.length]
         *
         * Writes the result to SharedPreferences("CapacitorStorage") under
         * the key "widget_daily_verse" so DailyVerseWidget can render it.
         *
         * Returns true on success.
         */
        fun computeAndCacheVerse(context: Context): Boolean {
            return try {
                val assets = context.assets

                // 1. Load verse index
                val versesRaw = assets.open("public/assets/verses/verses.json")
                    .bufferedReader().use { it.readText() }
                val versesArray = JSONArray(versesRaw)
                if (versesArray.length() == 0) return false

                val dayIndex = (System.currentTimeMillis() / 86400000L).toInt()
                val ref      = versesArray.getJSONObject(dayIndex % versesArray.length())
                val bookId   = ref.getInt("bookId")
                val chapter  = ref.getInt("chapter")
                val verseNum = ref.getInt("verse")

                // 2. Book name
                val booksRaw = assets.open("public/assets/bible/books.json")
                    .bufferedReader().use { it.readText() }
                val booksArray = JSONArray(booksRaw)
                var bookName = ""
                for (i in 0 until booksArray.length()) {
                    val b = booksArray.getJSONObject(i)
                    if (b.getInt("id") == bookId) { bookName = b.getString("name"); break }
                }

                // 3. Verse text  (bible_N.json -> { "chapter": [{v:N, t:"..."}] })
                val bibleRaw = assets.open("public/assets/bible/bible_${bookId}.json")
                    .bufferedReader().use { it.readText() }
                val chapterArr = JSONObject(bibleRaw).optJSONArray(chapter.toString())
                    ?: return false

                var text = ""
                for (i in 0 until chapterArr.length()) {
                    val v = chapterArr.getJSONObject(i)
                    if (v.getInt("v") == verseNum) { text = v.getString("t"); break }
                }
                if (text.isEmpty()) return false

                // 4. Write to SharedPreferences
                val payload = JSONObject().apply {
                    put("text", text)
                    put("ref", "$bookName $chapter, $verseNum")
                }
                context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
                    .edit()
                    .putString("widget_daily_verse", payload.toString())
                    .apply()

                if (BuildConfig.DEBUG) Log.d("BibliWidget", "Verse cached: $bookName $chapter:$verseNum")
                true
            } catch (e: Exception) {
                Log.e("BibliWidget", "computeAndCacheVerse failed: ${e.message}")
                false
            }
        }
    }
}
