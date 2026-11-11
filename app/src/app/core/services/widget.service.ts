// Puente entre la app Angular y los widgets nativos Android.
// @capacitor/preferences escribe en SharedPreferences("CapacitorStorage")
// que los widgets Kotlin leen directamente.

import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { VerseOfTheDay } from '../../pages/home/models/verse-of-the-day.model';

export interface WidgetVerse {
  text: string;
  ref:  string;
}

const KEY_DAILY  = 'widget_daily_verse';
const KEY_PINNED = 'widget_pinned_verse';

@Injectable({ providedIn: 'root' })
export class WidgetService {

  // Llamar justo después de que VerseOfTheDayService.load() resuelva
  async syncDailyVerse(verse: VerseOfTheDay): Promise<void> {
    const data: WidgetVerse = {
      text: verse.text,
      ref:  verse.ref,
    };
    await Preferences.set({ key: KEY_DAILY, value: JSON.stringify(data) });
  }

  // Fijar versículo desde bookmarks o reader
  async setPinnedVerse(verse: WidgetVerse): Promise<void> {
    await Preferences.set({ key: KEY_PINNED, value: JSON.stringify(verse) });
  }

  async getPinnedVerse(): Promise<WidgetVerse | null> {
    const { value } = await Preferences.get({ key: KEY_PINNED });
    return value ? JSON.parse(value) : null;
  }

  async clearPinnedVerse(): Promise<void> {
    await Preferences.remove({ key: KEY_PINNED });
  }
}