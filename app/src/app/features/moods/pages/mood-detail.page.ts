import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton, IonButtons, IonContent, IonHeader,
  IonTitle, IonToolbar, IonIcon, IonSpinner, IonToast,
} from '@ionic/angular/standalone';
import { Share } from '@capacitor/share';

import { Mood } from '../models/moods.model';
import { MoodVerse } from '../models/mood-verse.model';
import { MoodsService } from '../services/moods.service';
import { moodPhotoSrc } from '../../../shared/art/photo-catalog';

@Component({
  standalone: true,
  selector: 'app-mood-detail',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonIcon, IonSpinner, IonToast,
  ],
  templateUrl: './mood-detail.page.html',
  styleUrls: ['./mood-detail.page.scss'],
})
export class MoodDetailPage implements OnInit, OnDestroy {
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly moodsService = inject(MoodsService);

  readonly loading  = signal<boolean>(true);
  readonly error    = signal<string | null>(null);
  readonly mood     = signal<Mood | null>(null);
  readonly verses   = signal<MoodVerse[]>([]);
  readonly todayKey = signal<string>('');

  toastOpen    = false;
  toastMessage = '';

  private midnightTimer: ReturnType<typeof setTimeout> | null = null;

  // Same photo as the mood's tile.
  get plateSrc(): string | null {
    return moodPhotoSrc(this.mood()?.image);
  }

  get plateFocus(): string {
    return '50% 50%';
  }

  async ngOnInit(): Promise<void> {
    await this.loadMoodDetail();
    this.scheduleMidnightRefresh();
  }

  ngOnDestroy(): void {
    if (this.midnightTimer) { clearTimeout(this.midnightTimer); this.midnightTimer = null; }
  }

  private async loadMoodDetail(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const moodId = this.route.snapshot.paramMap.get('moodId') ?? '';
      if (!moodId) throw new Error('Mood no válido');

      const mood = await this.moodsService.getMoodById(moodId);
      if (!mood) throw new Error('Mood no encontrado');

      const verses   = await this.moodsService.getDailyMoodVerses(moodId, 10);
      const todayKey = this.moodsService.getLocalDateKey();

      this.mood.set(mood);
      this.verses.set(verses);
      this.todayKey.set(todayKey);
    } catch (error) {
      console.error(error);
      this.error.set('No se pudo cargar este estado de ánimo.');
      this.mood.set(null);
      this.verses.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  // Navegación

  goToVerse(verse: MoodVerse): void {
    if (!verse?.bookId || !verse?.chapter || !verse?.verse) return;
    this.router.navigate(
      ['/tabs/bible/book', verse.bookId, 'chapter', verse.chapter],
      { queryParams: { verse: verse.verse } }
    );
  }

  openEditor(verse: MoodVerse, ev: Event): void {
    ev.stopPropagation();
    this.router.navigate(['/verse-editor'], {
      queryParams: { text: verse.text, ref: verse.ref },
    });
  }

  // Compartir texto

  async shareVerse(verse: MoodVerse, ev: Event): Promise<void> {
    ev.stopPropagation();
    const text = `"${verse.text}" — ${verse.ref}`;
    try {
      await Share.share({ text });
    } catch {
      // Fallback clipboard
      try { await navigator.clipboard.writeText(text); } catch {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;opacity:0;';
        document.body.appendChild(ta); ta.focus(); ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
      }
      this.showToast('Copiado');
    }
  }

  private showToast(msg: string) { this.toastMessage = msg; this.toastOpen = true; }

  private scheduleMidnightRefresh(): void {
    if (this.midnightTimer) { clearTimeout(this.midnightTimer); this.midnightTimer = null; }
    const delay = this.moodsService.getNextLocalMidnightDelayMs();
    this.midnightTimer = setTimeout(async () => {
      await this.loadMoodDetail();
      this.scheduleMidnightRefresh();
    }, delay + 1000);
  }
}