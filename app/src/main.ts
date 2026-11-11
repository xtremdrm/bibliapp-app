import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Capacitor } from '@capacitor/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Ionicons registration (obligatorio para que se vean bien en Android WebView)
import { addIcons } from 'ionicons';
import {
  homeOutline,
  bookOutline,
  heartOutline,
  sparklesOutline,
  locationOutline,
  chevronForwardOutline,
  chevronBackOutline,
  copyOutline,
  imagesOutline,
  walkOutline,
  starOutline,
  leafOutline,
  cloudOutline,
  flashOutline,
  shieldOutline,
  personOutline,
  helpOutline,
  sunnyOutline,
  flameOutline,
  roseOutline,
  medkitOutline,
  briefcaseOutline,
  warningOutline,
  infiniteOutline,
} from 'ionicons/icons';

addIcons({
  'home-outline': homeOutline,
  'book-outline': bookOutline,
  'heart-outline': heartOutline,
  'sparkles-outline': sparklesOutline,
  'location-outline': locationOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'chevron-back-outline': chevronBackOutline,
  'copy-outline': copyOutline,
  'images-outline': imagesOutline,
  'walk-outline': walkOutline,
  'star-outline': starOutline,
  'leaf-outline': leafOutline,
  'cloud-outline': cloudOutline,
  'flash-outline': flashOutline,
  'shield-outline': shieldOutline,
  'person-outline': personOutline,
  'help-outline': helpOutline,
  'sunny-outline': sunnyOutline,
  'flame-outline': flameOutline,
  'rose-outline': roseOutline,
  'medkit-outline': medkitOutline,
  'briefcase-outline': briefcaseOutline,
  'warning-outline': warningOutline,
  'infinite-outline': infiniteOutline,
});

bootstrapApplication(App, appConfig).catch(err => console.error(err));

// Offline support for the web / installed web app. The native app serves files locally
// and never registers it; the dev server skips it so edits are never served from cache.
if (!isDevMode() && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed', err));
  });
}