import { Injectable, inject } from '@angular/core';
import { BibleService } from '../../bible/services/bible.service';
import { Mood } from '../models/moods.model';
import { MoodVerse } from '../models/mood-verse.model';
import { buildPassages, passageRef } from '../../../shared/bible/passage';

type VerseDatasetItem = {
  id: number;
  bookId: number;
  chapter: number;
  verse: number;
  moods?: string[];
  featured?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class MoodsService {
  private readonly bibleService = inject(BibleService);

  private moodsCache: Mood[] | null = null;
  private versesDatasetCache: VerseDatasetItem[] | null = null;
  private resolvedCache = new Map<string, MoodVerse[]>();

  async getMoods(): Promise<Mood[]> {
    if (this.moodsCache) return this.moodsCache;

    const url = new URL('assets/moods/moods.json', document.baseURI);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('No se pudo cargar assets/moods/moods.json');
    }

    const data = (await response.json()) as Mood[];
    this.moodsCache = data;
    return data;
  }

  async getMoodById(moodId: string): Promise<Mood | null> {
    const moods = await this.getMoods();
    const normalizedMoodId = this.normalizeMoodId(moodId);

    return moods.find((m) => this.normalizeMoodId(m.id) === normalizedMoodId) ?? null;
  }

  async getMoodVerses(moodId: string): Promise<MoodVerse[]> {
    const normalizedMoodId = this.normalizeMoodId(moodId);

    if (this.resolvedCache.has(normalizedMoodId)) {
      return this.resolvedCache.get(normalizedMoodId)!;
    }

    const dataset = await this.getVersesDataset();

    const candidates = dataset.filter((item) => {
      const itemMoods = (item.moods ?? []).map((m) => this.normalizeMoodId(m));
      return itemMoods.includes(normalizedMoodId);
    });

    // Group by chapter so consecutive verses become one passage.
    const byChapter = new Map<string, VerseDatasetItem[]>();
    for (const item of candidates) {
      const key = `${item.bookId}|${item.chapter}`;
      byChapter.set(key, [...(byChapter.get(key) ?? []), item]);
    }

    const resolved: MoodVerse[] = [];

    for (const items of byChapter.values()) {
      const { bookId, chapter } = items[0];
      try {
        const book = await this.bibleService.getBook(bookId);
        const chapterVerses = await this.bibleService.getVerses(bookId, chapter);
        const bookName = (book?.name ?? `Libro ${bookId}`).trim();

        for (const passage of buildPassages(chapterVerses, items.map(i => Number(i.verse)))) {
          const inside = items.filter(i => i.verse >= passage.start && i.verse <= passage.end);
          if (!inside.length) continue;
          resolved.push({
            id: inside[0].id,
            ref: passageRef(bookName, chapter, passage),
            text: passage.text,
            moodIds: [...new Set(inside.flatMap(i => i.moods ?? []))],
            featured: inside.some(i => !!i.featured),
            bookId,
            chapter,
            verse: passage.start,
            verseEnd: passage.end,
          });
        }
      } catch (error) {
        console.error('[MoodsService] Error resolviendo capítulo', bookId, chapter, error);
      }
    }

    this.resolvedCache.set(normalizedMoodId, resolved);
    return resolved;
  }

  async getDailyMoodVerses(
    moodId: string,
    limit = 10,
    date = new Date(),
  ): Promise<MoodVerse[]> {
    const all = await this.getMoodVerses(moodId);

    if (all.length <= limit) {
      return all;
    }

    const dateKey = this.getLocalDateKey(date);
    const normalizedMoodId = this.normalizeMoodId(moodId);

    const shuffled = [...all].sort((a, b) => {
      const ha = this.hash(`${normalizedMoodId}|${dateKey}|${a.id}`);
      const hb = this.hash(`${normalizedMoodId}|${dateKey}|${b.id}`);
      return ha - hb;
    });

    return shuffled.slice(0, limit);
  }

  getNextLocalMidnightDelayMs(now = new Date()): number {
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next.getTime() - now.getTime();
  }

  getLocalDateKey(date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private async getVersesDataset(): Promise<VerseDatasetItem[]> {
    if (this.versesDatasetCache) return this.versesDatasetCache;

    const url = new URL('assets/verses/verses.json', document.baseURI);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('No se pudo cargar assets/verses/verses.json');
    }

    const data = (await response.json()) as VerseDatasetItem[];
    this.versesDatasetCache = data;
    return data;
  }

  private normalizeMoodId(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }


  private hash(input: string): number {
    let hash = 0;

    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }

    return Math.abs(hash);
  }
}