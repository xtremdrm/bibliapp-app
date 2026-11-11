import { Injectable, signal } from '@angular/core';
import { BibleService } from '../../features/bible/services/bible.service';
import {
  VerseReference,
  VerseOfTheDay,
} from '../../pages/home/models/verse-of-the-day.model';
import { buildPassages, passageRef } from '../../shared/bible/passage';

@Injectable({
  providedIn: 'root',
})
export class VerseOfTheDayService {
  verse = signal<VerseOfTheDay | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private bibleService: BibleService) {}

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const utcDate = await this.getUtcDate();
      const dayIndex = this.getDayIndex(utcDate);
      const dataset = await this.loadDataset();

      if (!dataset.length) {
        throw new Error('El dataset de versículos está vacío');
      }

      const ref = dataset[dayIndex % dataset.length];

      const book = await this.bibleService.getBook(ref.bookId);
      if (!book) {
        throw new Error(`No se encontró el libro con id ${ref.bookId}`);
      }

      const verses = await this.bibleService.getVerses(ref.bookId, ref.chapter);
      if (!verses.length) {
        throw new Error(
          `No se encontraron versículos para ${book.name} ${ref.chapter}`
        );
      }

      // Complete the sentence (and join the next listed verses of the chapter).
      const picked = dataset
        .filter((d) => d.bookId === ref.bookId && d.chapter === ref.chapter
          && d.verse >= ref.verse && d.verse <= ref.verse + 1)
        .map((d) => Number(d.verse));
      const passage = buildPassages(verses, picked)
        .find((p) => p.start <= ref.verse && p.end >= ref.verse);
      if (!passage) {
        throw new Error(
          `No se encontró el versículo ${ref.verse} en ${book.name} ${ref.chapter}`
        );
      }

      const text = passage.text;
      if (!text) {
        throw new Error(
          `El versículo ${book.name} ${ref.chapter}:${ref.verse} está vacío`
        );
      }

      this.verse.set({
        id: ref.id,
        bookId: ref.bookId,
        bookName: book.name,
        chapter: ref.chapter,
        verse: passage.start,
        verseEnd: passage.end,
        ref: passageRef(book.name, ref.chapter, passage),
        text,
        utcDate,
        dayIndex,
      });
    } catch (e) {
      console.error('VerseOfTheDay error', e);
      this.error.set('No se pudo cargar el versículo del día');
      this.verse.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async reload(): Promise<void> {
    await this.load();
  }

  private async loadDataset(): Promise<VerseReference[]> {
    const url = new URL('assets/verses/verses.json', document.baseURI).toString();
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`No se pudo cargar verses.json (${res.status})`);
    }

    const data = (await res.json()) as unknown;

    if (!Array.isArray(data)) {
      throw new Error('verses.json no contiene un array válido');
    }

    return data as VerseReference[];
  }

  private async getUtcDate(): Promise<string> {
    try {
      const res = await fetch(
        'https://www.timeapi.io/api/Time/current/zone?timeZone=UTC',
        { cache: 'no-store' }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const year = Number(data.year);
      const month = String(Number(data.month)).padStart(2, '0');
      const day = String(Number(data.day)).padStart(2, '0');

      if (!year || !month || !day) {
        throw new Error('Respuesta inválida del servicio horario');
      }

      return `${year}-${month}-${day}`;
    } catch {
      const d = new Date();
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }
  }

  private getDayIndex(date: string): number {
    const d = new Date(`${date}T00:00:00Z`);
    return Math.floor(d.getTime() / 86400000);
  }
}