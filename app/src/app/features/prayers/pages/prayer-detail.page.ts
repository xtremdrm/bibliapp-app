import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';

import { PrayersService, PrayerItem } from '../services/prayers.service';

@Component({
  standalone: true,
  selector: 'app-prayer-detail',
  imports: [
    NgFor,
    NgIf,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
  ],
  templateUrl: './prayer-detail.page.html',
  styleUrls: ['./prayer-detail.page.scss'],
})
export class PrayerDetailPage implements OnInit {

  prayer = signal<PrayerItem | null>(null);
  categoryTitle = signal('');

  constructor(
    private route: ActivatedRoute,
    private prayersService: PrayersService
  ) {}

  async ngOnInit() {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) return;

    const prayer = await this.prayersService.getPrayer(id);

    if (prayer) {
      this.prayer.set(prayer);
      const categories = await this.prayersService.getCategories();
      this.categoryTitle.set(categories.find(c => c.id === prayer.categoryId)?.title ?? '');
    }
  }

}
