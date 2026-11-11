import { Component, OnInit, inject, signal } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonToast, IonSpinner } from '@ionic/angular/standalone';

import { VerseOfTheDayService } from '../../core/services/verse-of-the-day.service';
import { VerseShareService } from '../../core/services/verse-share.service';
import { WidgetService } from '../../core/services/widget.service';
import { LiturgicalCalendarService, LiturgicalDay } from '../../core/services/liturgical-calendar.service';
import { PrayersService } from '../../features/prayers/services/prayers.service';
import { photoSrc } from '../../shared/art/photo-catalog';

// The user's own photos (assets/photos/verse-1..20) rotate as the verse background, one per day.
const VERSE_PHOTO_COUNT = 20;

const LAST_READ_KEY = 'bibliapp.lastRead';
const WEEK_KEY      = 'bibliapp.weekChallenge';

interface LastRead { bookId: number; bookName: string; bookAbbr: string; chapter: number; }
interface SuggestedPrayer { id: string; title: string; }
interface WeekChallenge { bookId: number; bookName: string; chapter: number; label: string; }

const WEEKLY_CHALLENGES: WeekChallenge[] = [
  { bookId: 21, bookName: 'Salmos',  chapter: 23,  label: 'El Buen Pastor' },
  { bookId: 21, bookName: 'Salmos',  chapter: 91,  label: 'Bajo su abrigo' },
  { bookId:  1, bookName: 'Génesis', chapter:  1,  label: 'La creación' },
  { bookId: 21, bookName: 'Salmos',  chapter: 139, label: 'Señor, tú me sondeas' },
  { bookId: 21, bookName: 'Salmos',  chapter: 51,  label: 'Miserere' },
  { bookId: 21, bookName: 'Salmos',  chapter: 27,  label: 'El Señor es mi luz' },
  { bookId:  1, bookName: 'Génesis', chapter: 22,  label: 'El sacrificio de Isaac' },
  { bookId: 21, bookName: 'Salmos',  chapter: 46,  label: 'Dios es nuestro refugio' },
  { bookId: 21, bookName: 'Salmos',  chapter: 121, label: 'El guardián de Israel' },
  { bookId: 21, bookName: 'Salmos',  chapter: 103, label: 'Bendice, alma mía, al Señor' },
  { bookId:  1, bookName: 'Génesis', chapter: 12,  label: 'Vocación de Abrán' },
  { bookId: 21, bookName: 'Salmos',  chapter:  1,  label: 'Los dos caminos' },
];

// Sunday first, matching Date.getDay()
const MYSTERIES_BY_DAY = [
  'Misterios gloriosos', 'Misterios gozosos', 'Misterios dolorosos', 'Misterios gloriosos',
  'Misterios luminosos', 'Misterios dolorosos', 'Misterios gozosos',
];

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [IonContent, IonIcon, IonToast, IonSpinner, RouterLink],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, ViewWillEnter {
  private router         = inject(Router);
  private shareService   = inject(VerseShareService);
  readonly verseService  = inject(VerseOfTheDayService);
  private widgetService  = inject(WidgetService);
  private liturgical     = inject(LiturgicalCalendarService);
  private prayersService = inject(PrayersService);

  readonly today = new Date();
  readonly versePhotoId = dailyPhotoId(this.today);
  readonly versePhotoSrc = photoSrc(this.versePhotoId);
  liturgicalDay!: LiturgicalDay;

  lastRead        = signal<LastRead | null>(null);
  suggestedPrayer = signal<SuggestedPrayer | null>(null);
  weekChallenge   = signal<WeekChallenge | null>(null);
  weekDaysRead    = signal(0);

  toastOpen    = signal(false);
  toastMessage = signal('');

  ngOnInit(): void {
    this.verseService.load().then(() => {
      const v = this.verseService.verse();
      if (v) this.widgetService.syncDailyVerse(v);
    });

    this.liturgicalDay = this.liturgical.getDay();
    this.loadSuggestedPrayer();
    this.loadWeekChallenge();
  }

  ionViewWillEnter(): void {
    this.loadLastRead();
  }

  // Header

  get dayNumber(): number { return this.today.getDate(); }

  get weekday(): string {
    return this.today.toLocaleDateString('es-ES', { weekday: 'long' });
  }

  get monthLabel(): string {
    const m = this.today.toLocaleDateString('es-ES', { month: 'long' });
    return m.charAt(0).toUpperCase() + m.slice(1);
  }

  get seasonLine(): string {
    const d = this.liturgicalDay;
    if (!d) return this.monthLabel;
    const season = d.isFeast && d.feastLabel ? d.feastLabel : d.shortDesc;
    return `${this.monthLabel} · ${season}`;
  }

  get rosaryMysteries(): string { return MYSTERIES_BY_DAY[this.today.getDay()]; }

  get prayerMoment(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Oración de la mañana';
    if (h < 15) return 'Mediodía';
    if (h < 20) return 'Oración de la tarde';
    return 'Oración de la noche';
  }

  // Verse

  get verseText(): string { return this.verseService.verse()?.text?.trim() ?? ''; }

  get verseRef(): string {
    const v = this.verseService.verse();
    return v?.ref ?? '';
  }

  async shareVerse(): Promise<void> {
    if (!this.verseText) return;
    const r = await this.shareService.shareText({ text: this.verseText, ref: this.verseRef });
    if (r === 'copied') this.showToast('Copiado');
  }

  async copyVerse(): Promise<void> {
    if (!this.verseText) return;
    await this.shareService.copy(`${this.verseText}\n\n${this.verseRef}`);
    this.showToast('Copiado');
  }

  openEditor(): void {
    if (!this.verseText) return;
    this.router.navigate(['/verse-editor'], { queryParams: { text: this.verseText, ref: this.verseRef, photo: this.versePhotoId } });
  }

  goToVerse(): void {
    const v = this.verseService.verse();
    if (!v?.bookId || !v?.chapter) return;
    this.router.navigate(['/tabs/bible/book', v.bookId, 'chapter', v.chapter], { queryParams: { verse: v.verse } });
  }

  // Index rows

  private loadLastRead(): void {
    try {
      const raw = localStorage.getItem(LAST_READ_KEY);
      if (raw) this.lastRead.set(JSON.parse(raw));
    } catch {}
  }

  private async loadSuggestedPrayer(): Promise<void> {
    try {
      const h = new Date().getHours();
      const catId = h < 12 ? 'manana' : h < 15 ? 'angelus' : h < 20 ? 'maria' : 'noche';
      const items = await this.prayersService.getPrayers();
      const match = items.find(p => p.categoryId === catId);
      if (match) this.suggestedPrayer.set({ id: match.id, title: match.title });
    } catch {}
  }

  private getWeekKey(): string {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  }

  private loadWeekChallenge(): void {
    const weekKey = this.getWeekKey();
    const weekNum = parseInt(weekKey.split('-W')[1] ?? '1', 10);
    this.weekChallenge.set(WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length]);
    try {
      const raw = localStorage.getItem(WEEK_KEY);
      const data = raw ? JSON.parse(raw) : null;
      this.weekDaysRead.set(data?.weekKey === weekKey ? Math.min(7, data.daysRead ?? 0) : 0);
    } catch {}
  }

  openChallenge(): void {
    const ch = this.weekChallenge();
    if (!ch) return;
    const today = new Date().toISOString().slice(0, 10);
    const weekKey = this.getWeekKey();
    try {
      const raw = localStorage.getItem(WEEK_KEY);
      const data = raw ? JSON.parse(raw) : { weekKey, daysRead: 0 };
      if (data.weekKey !== weekKey) { data.weekKey = weekKey; data.daysRead = 0; }
      if (data.lastDay !== today) {
        data.daysRead = Math.min(7, (data.daysRead ?? 0) + 1);
        data.lastDay = today;
        this.weekDaysRead.set(data.daysRead);
        localStorage.setItem(WEEK_KEY, JSON.stringify(data));
      }
    } catch {}
    this.router.navigate(['/tabs/bible/book', ch.bookId, 'chapter', ch.chapter]);
  }

  openLastRead(): void {
    const lr = this.lastRead();
    if (lr) this.router.navigate(['/tabs/bible/book', lr.bookId, 'chapter', lr.chapter]);
  }

  openPrayer(id: string): void {
    this.router.navigate(['/tabs/prayers', id]);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    this.toastOpen.set(true);
  }
}

function dailyPhotoId(date: Date): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return `verse-${(dayOfYear % VERSE_PHOTO_COUNT) + 1}`;
}
