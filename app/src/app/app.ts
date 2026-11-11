import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet, ModalController, ActionSheetController } from '@ionic/angular/standalone';
import { App as CapacitorApp } from '@capacitor/app';
import { registerMisalIcons } from './shared/ui/misal-icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class App implements OnInit, OnDestroy {
  private backListener: any;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
  ) {
    registerMisalIcons();
  }

  async ngOnInit() {
    this.backListener = await CapacitorApp.addListener('backButton', async () => {

      // 1. Si hay un action sheet abierto -> cerrarlo
      const actionSheet = await this.actionSheetCtrl.getTop();
      if (actionSheet) {
        await actionSheet.dismiss();
        return;
      }

      // 2. Si hay un modal abierto -> cerrarlo
      const modal = await this.modalCtrl.getTop();
      if (modal) {
        await modal.dismiss();
        return;
      }

      // 3. Navegación normal
      const url = this.router.url;
      const exitRoutes = ['/tabs/home', '/intro'];

      if (exitRoutes.some(r => url === r || url.startsWith(r + '?'))) {
        CapacitorApp.exitApp();
        return;
      }

      if (url.startsWith('/tabs/')) {
        const segments = url.split('/').filter(Boolean);
        if (segments.length > 2) {
          const tab = segments[1];
          this.router.navigate(['/tabs', tab], { replaceUrl: true });
          return;
        }
        this.router.navigate(['/tabs/home'], { replaceUrl: true });
        return;
      }

      window.history.back();
    });
  }

  ngOnDestroy() {
    this.backListener?.remove?.();
  }
}