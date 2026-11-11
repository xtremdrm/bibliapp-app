import { Injectable, signal, computed } from '@angular/core';

export interface Bookmark {
  bookId:   number;
  bookName: string;
  bookAbbr: string;
  chapter:  number;
  verse:    number;
  text:     string;
  savedAt:  number; // timestamp
}

const STORAGE_KEY = 'bibliapp.bookmarks';

@Injectable({ providedIn: 'root' })
export class BookmarkService {

  private _bookmarks = signal<Bookmark[]>(this.load());

  readonly bookmarks = computed(() => this._bookmarks());

  readonly count = computed(() => this._bookmarks().length);

  // API pública

  isBookmarked(bookId: number, chapter: number, verse: number): boolean {
    return this._bookmarks().some(
      b => b.bookId === bookId && b.chapter === chapter && b.verse === verse
    );
  }

  toggle(bookmark: Omit<Bookmark, 'savedAt'>): boolean {
    const existing = this._bookmarks().find(
      b => b.bookId === bookmark.bookId && b.chapter === bookmark.chapter && b.verse === bookmark.verse
    );

    if (existing) {
      this._bookmarks.update(list => list.filter(b => b !== existing));
      this.persist();
      return false; // eliminado
    } else {
      this._bookmarks.update(list => [{ ...bookmark, savedAt: Date.now() }, ...list]);
      this.persist();
      return true; // añadido
    }
  }

  remove(bookId: number, chapter: number, verse: number): void {
    this._bookmarks.update(list =>
      list.filter(b => !(b.bookId === bookId && b.chapter === chapter && b.verse === verse))
    );
    this.persist();
  }

  clear(): void {
    this._bookmarks.set([]);
    this.persist();
  }

  // Persistencia

  private load(): Bookmark[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._bookmarks()));
    } catch {}
  }
}