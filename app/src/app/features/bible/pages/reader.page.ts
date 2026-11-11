import { Component, OnInit, signal, ViewChild, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonBackButton, IonButtons, IonSpinner, IonIcon, IonToast,
} from '@ionic/angular/standalone';

import { BibleService } from '../services/bible.service';
import { BibleBook, BibleVerse } from '../models/bible.models';
import { VerseShareService } from '../../../core/services/verse-share.service';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { formatRef } from '../../../shared/verse-image/verse-styles';

const FONT_KEY = 'bibliapp.readerFont';

@Component({
  standalone: true,
  selector: 'app-reader',
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonBackButton, IonButtons, IonSpinner, IonIcon, IonToast,
  ],
  templateUrl: './reader.page.html',
  styleUrls: ['./reader.page.scss'],
})
export class ReaderPage implements OnInit {
  @ViewChild(IonContent) content?: IonContent;

  readonly shareService    = inject(VerseShareService);
  readonly bookmarkService = inject(BookmarkService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private bible  = inject(BibleService);

  book             = signal<BibleBook | undefined>(undefined);
  chapter          = signal(1);
  verses           = signal<BibleVerse[]>([]);
  loading          = signal(true);
  totalChapters    = signal(0);
  fontSize         = signal(this.loadFontSize());
  selected         = signal<ReadonlySet<number>>(new Set());
  highlightedVerse = signal<number | null>(null);
  dockVisible      = signal(true);
  typeOpen         = signal(false);

  toastOpen    = signal(false);
  toastMessage = signal('');

  canPrev = computed(() => this.chapter() > 1);
  canNext = computed(() => this.chapter() < this.totalChapters());

  selectedList = computed(() => [...this.selected()].sort((a, b) => a - b));
  selectionCount = computed(() => this.selected().size);

  selectionRef = computed(() => {
    const b = this.book();
    return b ? formatRef(b.name, this.chapter(), this.selectedList()) : '';
  });

  selectionText = computed(() => {
    const set = this.selected();
    return this.verses().filter(v => set.has(v.v)).map(v => v.t.trim()).join(' ');
  });

  allSelectedBookmarked = computed(() => {
    const b = this.book();
    const list = this.selectedList();
    if (!b || !list.length) return false;
    // Read bookmarks() so the computed re-runs when they change.
    this.bookmarkService.bookmarks();
    return list.every(v => this.bookmarkService.isBookmarked(b.id, this.chapter(), v));
  });

  bookmarkedSet = computed(() => {
    const b = this.book();
    const ch = this.chapter();
    const set = new Set<number>();
    if (!b) return set;
    for (const bm of this.bookmarkService.bookmarks()) {
      if (bm.bookId === b.id && bm.chapter === ch) set.add(bm.verse);
    }
    return set;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(async (pm) => {
      const bookId      = Number(pm.get('bookId')  ?? '0');
      const chapter     = Number(pm.get('chapter') ?? '1');
      const targetVerse = Number(this.route.snapshot.queryParamMap.get('verse') ?? '0') || null;

      this.chapter.set(chapter);
      this.loading.set(true);
      this.selected.set(new Set());
      this.highlightedVerse.set(null);

      const book = await this.bible.getBook(bookId);
      this.book.set(book);

      if (book) {
        try {
          localStorage.setItem('bibliapp.lastRead', JSON.stringify({
            bookId, bookName: book.name, bookAbbr: book.abbr, chapter,
          }));
        } catch {}
      }

      const chapters = await this.bible.getChapters(bookId);
      this.totalChapters.set(chapters.length);
      this.verses.set(await this.bible.getVerses(bookId, chapter));

      this.loading.set(false);
      this.dockVisible.set(true);

      if (targetVerse) {
        this.highlightedVerse.set(targetVerse);
        setTimeout(() => {
          this.scrollToVerse(targetVerse);
          setTimeout(() => this.highlightedVerse.set(null), 3000);
        }, 400);
      } else {
        requestAnimationFrame(() => this.content?.scrollToTop(0));
      }
    });
  }

  private scrollToVerse(verseNum: number) {
    document.getElementById(`verse-${verseNum}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Interaction

  onContentTap(ev: MouseEvent) {
    const target = ev.target as HTMLElement | null;
    if (!target || target.closest('button, a, .v, .dock, .sel-sheet, .type-row')) return;
    if (this.selectionCount()) return;
    this.dockVisible.update(v => !v);
  }

  toggleVerse(v: number, ev?: Event) {
    ev?.stopPropagation();
    this.selected.update(cur => {
      const next = new Set(cur);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });
  }

  onVerseKey(v: number, ev: KeyboardEvent) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.toggleVerse(v);
    }
  }

  clearSelection() {
    this.selected.set(new Set());
  }

  async goChapter(delta: number) {
    const b = this.book();
    if (!b) return;
    const next = this.chapter() + delta;
    if (next < 1 || next > this.totalChapters()) return;
    this.router.navigate(['/tabs/bible/book', b.id, 'chapter', next], { replaceUrl: true });
  }

  // Selection actions

  async copySelected() {
    if (!this.selectionCount()) return;
    await this.shareService.copy(`${this.selectionText()}\n\n${this.selectionRef()}`);
    this.showToast('Copiado');
    this.clearSelection();
  }

  toggleBookmarks() {
    const b = this.book();
    if (!b) return;
    const ch = this.chapter();
    if (this.allSelectedBookmarked()) {
      for (const v of this.selectedList()) this.bookmarkService.remove(b.id, ch, v);
      this.showToast(this.selectionCount() > 1 ? 'Versículos quitados' : 'Versículo quitado');
    } else {
      for (const v of this.selectedList()) {
        if (this.bookmarkService.isBookmarked(b.id, ch, v)) continue;
        const verse = this.verses().find(x => x.v === v);
        if (!verse) continue;
        this.bookmarkService.toggle({ bookId: b.id, bookName: b.name, bookAbbr: b.abbr, chapter: ch, verse: v, text: verse.t });
      }
      this.showToast(this.selectionCount() > 1 ? 'Versículos guardados' : 'Versículo guardado');
    }
  }

  openEditor() {
    if (!this.selectionCount()) return;
    this.router.navigate(['/verse-editor'], {
      queryParams: { text: this.selectionText(), ref: this.selectionRef() },
    });
    this.clearSelection();
  }

  async shareSelected() {
    if (!this.selectionCount()) return;
    const r = await this.shareService.shareText({ text: this.selectionText(), ref: this.selectionRef() });
    if (r === 'copied') this.showToast('Copiado');
  }

  // Type size

  incFont() { this.setFont(this.fontSize() + 1); }
  decFont() { this.setFont(this.fontSize() - 1); }

  private setFont(px: number) {
    const v = Math.max(16, Math.min(28, px));
    this.fontSize.set(v);
    try { localStorage.setItem(FONT_KEY, String(v)); } catch {}
  }

  private loadFontSize(): number {
    try {
      const v = Number(localStorage.getItem(FONT_KEY));
      if (v >= 16 && v <= 28) return v;
    } catch {}
    return 20;
  }

  goToBookIndex() { this.router.navigate(['/tabs/bible'], { replaceUrl: true }); }

  openLegal() { this.router.navigate(['/legal']); }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    this.toastOpen.set(true);
  }
}
