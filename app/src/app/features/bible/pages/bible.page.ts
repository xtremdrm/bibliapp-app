import { Component, OnDestroy, OnInit, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { IonContent, IonIcon, IonSpinner, IonToast } from '@ionic/angular/standalone';

import { BibleService } from '../services/bible.service';
import { BibleBook } from '../models/bible.models';
import { BIBLE_SECTIONS } from '../data/bible-sections';
import { BookmarkService, Bookmark } from '../../../core/services/bookmark.service';
import { WidgetService } from '../../../core/services/widget.service';

type UiSection = { id: string; title: string; books: BibleBook[] };
type MainTab = 'AT' | 'NT' | 'saved';

@Component({
  standalone: true,
  selector: 'app-bible',
  imports: [
    NgFor, NgIf, NgTemplateOutlet, RouterLink,
    IonContent, IonIcon, IonSpinner, IonToast,
  ],
  templateUrl: './bible.page.html',
  styleUrls: ['./bible.page.scss'],
})
export class BiblePage implements OnInit, OnDestroy {
  private readonly bookmarkService = inject(BookmarkService);
  private readonly widgetService   = inject(WidgetService);

  tab = signal<MainTab>('AT');
  q = signal('');
  books = signal<BibleBook[]>([]);
  loading = signal(true);

  expandedBookId  = signal<number | null>(null);
  chaptersMap     = signal<Record<number, number[]>>({});
  loadingChapters = signal<number | null>(null);

  toastOpen    = false;
  toastMessage = '';

  isSearching = computed(() => this.q().trim().length > 0);
  bookmarks   = computed(() => this.bookmarkService.bookmarks());

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private bible: BibleService, private router: Router) {}

  async ngOnInit() {
    this.books.set(await this.bible.getBooks());
    this.loading.set(false);
  }

  filteredBooks = computed(() => {
    const query = this.q().toLowerCase().trim();
    const all = this.books();
    if (query) {
      return all.filter(b =>
        b.name.toLowerCase().includes(query) ||
        b.abbr.toLowerCase().includes(query)
      );
    }
    return all.filter(b => b.testament === this.tab());
  });

  sectionedBooks = computed<UiSection[]>(() => {
    if (this.isSearching()) return [];
    const testament = this.tab() as 'AT' | 'NT';
    if (this.tab() === 'saved') return [];

    const byId = new Map(this.books().map(b => [b.id, b]));
    const used = new Set<number>();
    const sections: UiSection[] = [];

    for (const s of BIBLE_SECTIONS.filter(x => x.testament === testament)) {
      const books = s.bookIds
        .map(id => byId.get(id))
        .filter((b): b is BibleBook => !!b);
      books.forEach(b => used.add(b.id));
      if (books.length) sections.push({ id: s.id, title: s.title, books });
    }

    const leftovers = this.books()
      .filter(b => b.testament === testament && !used.has(b.id))
      .sort((a, b) => a.id - b.id);
    if (leftovers.length) sections.push({ id: 'otros', title: 'Otros', books: leftovers });

    return sections;
  });

  setTab(t: MainTab) {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.tab.set(t);
    this.q.set('');
    this.expandedBookId.set(null);
  }

  async toggleBook(book: BibleBook) {
    if (this.expandedBookId() === book.id) { this.expandedBookId.set(null); return; }
    this.expandedBookId.set(book.id);
    if (!this.chaptersMap()[book.id]) {
      this.loadingChapters.set(book.id);
      const chapters = await this.bible.getChapters(book.id);
      this.chaptersMap.update(m => ({ ...m, [book.id]: chapters }));
      this.loadingChapters.set(null);
    }
  }

  openChapter(bookId: number, chapter: number) {
    this.router.navigate(['/tabs/bible/book', bookId, 'chapter', chapter]);
  }

  openBookmark(b: Bookmark) {
    this.router.navigate(
      ['/tabs/bible/book', b.bookId, 'chapter', b.chapter],
      { queryParams: { verse: b.verse } }
    );
  }

  removeBookmark(b: Bookmark, ev: Event) {
    ev.stopPropagation();
    this.bookmarkService.remove(b.bookId, b.chapter, b.verse);
  }

  async pinToWidget(b: Bookmark, ev: Event) {
    ev.stopPropagation();
    await this.widgetService.setPinnedVerse({
      text: b.text,
      ref:  `${b.bookName} ${b.chapter}, ${b.verse}`,
    });
    this.toastMessage = 'Versículo fijado en el widget';
    this.toastOpen = true;
  }

  onSearch(ev: Event) {
    const value = (ev.target as HTMLInputElement | null)?.value ?? '';
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.q.set(value);
      this.expandedBookId.set(null);
    }, 150);
  }

  ngOnDestroy() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  trackBySection = (_: number, s: UiSection) => s.id;
  trackByBook    = (_: number, b: BibleBook)  => b.id;
  trackByBm      = (_: number, b: Bookmark)   => `${b.bookId}-${b.chapter}-${b.verse}`;
}