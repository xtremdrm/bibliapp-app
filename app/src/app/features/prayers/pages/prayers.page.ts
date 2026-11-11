import { Component, ElementRef, OnInit, ViewChild, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';

import { PrayersService, PrayerItem, PrayerCategory } from '../services/prayers.service';
import { artSrc, getArtwork } from '../../../shared/art/art-catalog';

type UiGroup = { id: string; title: string; items: PrayerItem[] };
type MysteryKey = 'gozosos' | 'dolorosos' | 'gloriosos' | 'luminosos';

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const MYSTERY_TITLES: Record<MysteryKey, string> = {
  gozosos:   'Misterios gozosos',
  dolorosos: 'Misterios dolorosos',
  gloriosos: 'Misterios gloriosos',
  luminosos: 'Misterios luminosos',
};

// Index 0 = Sunday
const SET_BY_DAY: MysteryKey[] = ['gloriosos', 'gozosos', 'dolorosos', 'gloriosos', 'luminosos', 'dolorosos', 'gozosos'];

@Component({
  standalone: true,
  selector: 'app-prayers',
  imports: [NgFor, NgIf, RouterLink, IonContent, IonIcon],
  templateUrl: './prayers.page.html',
  styleUrls: ['./prayers.page.scss'],
})
export class PrayersPage implements OnInit {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  query            = signal('');
  activeCategoryId = signal<string | null>(null);
  categories       = signal<PrayerCategory[]>([]);
  items            = signal<PrayerItem[]>([]);
  searchOpen       = signal(false);

  private readonly today = new Date().getDay();
  readonly weekday = WEEKDAYS[this.today];
  readonly todaysMysteries = MYSTERY_TITLES[SET_BY_DAY[this.today]];
  readonly rosaryArt = getArtwork('murillo-virgen-nino');
  readonly rosaryArtSrc = artSrc('murillo-virgen-nino');

  constructor(public prayers: PrayersService) {}

  async ngOnInit() {
    this.categories.set(await this.prayers.getCategories());
    this.items.set(await this.prayers.getPrayers());
  }

  clearCategory()          { this.activeCategoryId.set(null); }
  isCatActive(id: string)  { return this.activeCategoryId() === id; }
  toggleCategory(id: string) {
    this.activeCategoryId.update(curr => (curr === id ? null : id));
  }
  onSearchInput(ev: Event) { this.query.set((ev.target as HTMLInputElement | null)?.value ?? ''); }

  toggleSearch() {
    if (this.searchOpen()) {
      this.searchOpen.set(false);
      this.query.set('');
      return;
    }
    this.searchOpen.set(true);
    setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
  }

  preview(p: PrayerItem): string {
    return p.short || p.body?.find(l => l.trim()) || p.lines?.[0]?.text || '';
  }

  grouped = computed<UiGroup[]>(() => {
    const q   = this.query().toLowerCase().trim();
    const cat = this.activeCategoryId();

    let list = this.items();
    if (q)   list = list.filter(p => (p.title ?? '').toLowerCase().includes(q) || (p.short ?? '').toLowerCase().includes(q));
    if (cat) list = list.filter(p => p.categoryId === cat);

    const cats = this.categories();
    const byCat = new Map<string, PrayerItem[]>();
    for (const p of list) {
      const arr = byCat.get(p.categoryId) ?? [];
      arr.push(p);
      byCat.set(p.categoryId, arr);
    }

    const out: UiGroup[] = [];
    for (const c of cats) {
      const items = byCat.get(c.id);
      if (items?.length) out.push({ id: c.id, title: c.title, items });
    }
    for (const [id, items] of byCat.entries()) {
      if (!cats.find(c => c.id === id)) out.push({ id, title: 'Otros', items });
    }
    return out;
  });
}
