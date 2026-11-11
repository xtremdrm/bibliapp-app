import { Routes } from '@angular/router';

export const CHURCHES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/churches.page').then((m) => m.ChurchesPage),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/church-form.page').then((m) => m.ChurchFormPage),
  },
  {
    path: ':churchId',
    loadComponent: () =>
      import('./pages/church-detail.page').then((m) => m.ChurchDetailPage),
  },
  {
    path: ':churchId/edit',
    loadComponent: () =>
      import('./pages/church-form.page').then((m) => m.ChurchFormPage),
  },
];