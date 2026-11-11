import type { Routes } from '@angular/router';

export const MOODS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/moods.page').then((m: any) => m.MoodsPage),
  },
  {
    path: ':moodId',
    loadComponent: () =>
      import('./pages/mood-detail.page').then((m: any) => m.MoodDetailPage),
  },
];