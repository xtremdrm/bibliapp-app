import { ApplicationConfig, ErrorHandler, Injectable, inject } from '@angular/core';
import { provideRouter, RouteReuseStrategy, withHashLocation, Router } from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { routes } from './app.routes';

@Injectable()
class GlobalErrorHandler implements ErrorHandler {
  private router = inject(Router);

  handleError(error: any): void {
    const msg = error?.message ?? error?.toString?.() ?? 'Unknown error';
    console.error('[GlobalErrorHandler]', error);

    // Aviso visible del error
    try {
      alert('ERROR: ' + msg);
    } catch { /* ignore */ }

    // Vuelve a inicio
    try {
      void this.router.navigateByUrl('/home');
    } catch { /* ignore */ }
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // Rutas con hash: en Capacitor no hay servidor que resuelva rutas
    provideRouter(routes, withHashLocation()),

    // Captura errores Angular
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};