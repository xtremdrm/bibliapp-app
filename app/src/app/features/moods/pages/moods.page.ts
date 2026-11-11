import { Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';

import { Mood } from '../models/moods.model';
import { MoodsService } from '../services/moods.service';
import { moodPhotoSrc } from '../../../shared/art/photo-catalog';

// Height pattern per column (repeats every 4 tiles): index 1 is tall.
const TALL_INDICES = new Set([1]);

@Component({
  standalone: true,
  selector: 'app-moods',
  imports: [NgTemplateOutlet, IonContent, IonSpinner],
  templateUrl: './moods.page.html',
  styleUrls: ['./moods.page.scss'],
})
export class MoodsPage {
  private readonly moodsService = inject(MoodsService);
  private readonly router       = inject(Router);

  readonly loading = signal<boolean>(true);
  readonly error   = signal<string | null>(null);
  readonly cards   = signal<Mood[]>([]);

  constructor() { void this.loadData(); }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const moods = await this.moodsService.getMoods();
      this.cards.set(moods);
    } catch (e) {
      console.error('[MoodsPage]', e);
      this.error.set('No se pudieron cargar los estados de ánimo.');
      this.cards.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  openMood(moodId: string): void {
    void this.router.navigateByUrl(`/moods/${moodId}`);
  }

  /** Even positions -> left column */
  get leftCards(): Mood[] {
    return this.cards().filter((_, i) => i % 2 === 0);
  }

  /** Odd positions -> right column */
  get rightCards(): Mood[] {
    return this.cards().filter((_, i) => i % 2 !== 0);
  }

  isTileTall(globalIndex: number): boolean {
    const colIndex = Math.floor(globalIndex / 2);
    return TALL_INDICES.has(colIndex % 4);
  }

  // The mood's own photo from moods.json (optimized copy), as in the original tiles.
  tileImage(m: Mood): string | null {
    return moodPhotoSrc(m.image);
  }

  tileFocus(_m: Mood): string {
    return '50% 50%';
  }
}
