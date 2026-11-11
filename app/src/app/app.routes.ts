import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'intro' },

  {
    path: 'intro',
    loadComponent: () =>
      import('./pages/intro/intro.page').then((m) => m.IntroPage),
  },

  {
    path: 'tabs',
    loadComponent: () =>
      import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'bible',
        loadComponent: () =>
          import('./features/bible/pages/bible.page').then((m) => m.BiblePage),
      },
      {
        path: 'bible/book/:bookId/chapter/:chapter',
        loadComponent: () =>
          import('./features/bible/pages/reader.page').then((m) => m.ReaderPage),
      },
      {
        path: 'prayers',
        loadComponent: () =>
          import('./features/prayers/pages/prayers.page').then((m) => m.PrayersPage),
      },
      {
        path: 'prayers/rosary',
        loadComponent: () =>
          import('./features/prayers/pages/rosary.page').then((m) => m.RosaryPage),
      },
      {
        path: 'prayers/:id',
        loadComponent: () =>
          import('./features/prayers/pages/prayer-detail.page').then((m) => m.PrayerDetailPage),
      },
      {
        path: 'moods',
        loadComponent: () =>
          import('./features/moods/pages/moods.page').then((m) => m.MoodsPage),
      },
      {
        path: 'churches',
        loadComponent: () =>
          import('./features/churches/pages/churches.page').then((m) => m.ChurchesPage),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/pages/calendar.page').then((m) => m.CalendarPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },

  {
    path: 'legal',
    loadComponent: () =>
      import('./pages/legal/legal.page').then((m) => m.LegalPage),
  },

  // Editor de imagen de versículo (fuera de tabs, pantalla completa)
  {
    path: 'verse-editor',
    loadComponent: () =>
      import('./features/verse-editor/pages/verse-editor.page').then((m) => m.VerseEditorPage),
  },

  {
    path: 'moods/:moodId',
    loadComponent: () =>
      import('./features/moods/pages/mood-detail.page').then((m) => m.MoodDetailPage),
  },
  {
    path: 'churches',
    loadChildren: () =>
      import('./features/churches/churches.routes').then((m) => m.CHURCHES_ROUTES),
  },

  { path: 'home',     redirectTo: 'tabs/home',     pathMatch: 'full' },
  { path: 'bible',    redirectTo: 'tabs/bible',    pathMatch: 'full' },
  { path: 'prayers',  redirectTo: 'tabs/prayers',  pathMatch: 'full' },
  { path: 'moods',    redirectTo: 'tabs/moods',    pathMatch: 'full' },
  { path: 'churches', redirectTo: 'tabs/churches', pathMatch: 'full' },
  { path: 'calendar', redirectTo: 'tabs/calendar', pathMatch: 'full' },

  { path: '**', redirectTo: 'intro' },
];