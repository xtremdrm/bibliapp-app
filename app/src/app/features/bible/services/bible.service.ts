import { Injectable } from '@angular/core';
import { BibleBook, BibleVerse } from '../models/bible.models';

type ChapterData = Record<string, BibleVerse[]>;

@Injectable({ providedIn: 'root' })
export class BibleService {
  private books: BibleBook[] = [];
  private bookCache   = new Map<number, ChapterData>();
  private loadingBook = new Map<number, Promise<ChapterData>>();
  private booksPromise?: Promise<BibleBook[]>;

  private assetUrl(path: string): string {
    return new URL(path, document.baseURI).toString();
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const url = this.assetUrl(path);
    const res = await fetch(url, { cache: 'force-cache' });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `BibleService: no se pudo cargar ${path} ` +
        `(${res.status} ${res.statusText}). URL: ${url}. ` +
        `Body(200): ${body.slice(0, 200)}`
      );
    }

    return (await res.json()) as T;
  }

  // Libros

  async getBooks(): Promise<BibleBook[]> {
    if (this.books.length) return this.books;
    if (this.booksPromise)  return this.booksPromise;

    this.booksPromise = this.fetchJson<BibleBook[]>('assets/bible/books.json')
      .then(data => { this.books = data; return data; })
      .finally(() => { this.booksPromise = undefined; });

    return this.booksPromise;
  }

  async getBook(bookId: number): Promise<BibleBook | undefined> {
    const books = await this.getBooks();
    return books.find(b => b.id === bookId);
  }

  // Datos de capítulos (caché)

  private async loadBookData(bookId: number): Promise<ChapterData> {
    if (this.bookCache.has(bookId))   return this.bookCache.get(bookId)!;
    if (this.loadingBook.has(bookId)) return this.loadingBook.get(bookId)!;

    const p = this.fetchJson<ChapterData>(`assets/bible/bible_${bookId}.json`)
      .then(d => { this.bookCache.set(bookId, d); return d; })
      .finally(() => { this.loadingBook.delete(bookId); });

    this.loadingBook.set(bookId, p);
    return p;
  }

  // API pública

  /**
   * Devuelve los números de capítulo disponibles para un libro,
   * tal como están en el JSON descargado de la CEE.
   * Los Salmos tienen 148 entradas (la CEE fusiona Sal 9+10 y Sal 114+115).
   */
  async getChapters(bookId: number): Promise<number[]> {
    const data = await this.loadBookData(bookId);
    return Object.keys(data)
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
  }

  /**
   * Devuelve los versículos de un capítulo concreto.
   * El número de capítulo debe corresponderse con las claves del JSON
   * (es decir, la numeración propia de la CEE).
   */
  async getVerses(bookId: number, chapter: number): Promise<BibleVerse[]> {
    const data = await this.loadBookData(bookId);
    return data[String(chapter)] ?? [];
  }
}