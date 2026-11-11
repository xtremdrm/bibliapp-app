import {
  Component, OnInit, OnDestroy,
  inject, signal, effect, NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonFab, IonFabButton,
  IonIcon, IonSpinner,
} from '@ionic/angular/standalone';

import { ChurchesService } from '../services/churches.service';
import { Church } from '../models/churches.model';
import { PlaceSuggestion } from '../services/church-directory.service';

declare const L: any;
type ViewMode = 'idle' | 'search' | 'map';

const CHURCH_ICON_URL = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40">
    <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 28 12 28S28 21 28 12C28 5.4 22.6 0 16 0z" fill="#c9a24e"/>
    <rect x="11" y="18" width="10" height="8" fill="#121212" rx="1"/>
    <rect x="14" y="22" width="4" height="4" fill="#c9a24e" rx="1"/>
    <rect x="15.2" y="8" width="1.6" height="8" fill="#121212" rx="0.5"/>
    <rect x="12.5" y="10.5" width="7" height="1.6" fill="#121212" rx="0.5"/>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
})();

@Component({
  standalone: true,
  selector: 'app-churches',
  imports: [
    CommonModule,
    IonContent, IonIcon, IonSpinner,
    IonFab, IonFabButton,
  ],
  templateUrl: './churches.page.html',
  styleUrls:   ['./churches.page.scss'],
})
export class ChurchesPage implements OnInit, OnDestroy {
  private readonly churchesService = inject(ChurchesService);
  private readonly router          = inject(Router);
  private readonly zone            = inject(NgZone);

  protected readonly viewMode       = signal<ViewMode>('idle');
  protected readonly query          = signal('');
  protected readonly searchResults  = signal<Church[]>([]);
  protected readonly suggestions    = signal<PlaceSuggestion[]>([]);
  /** The place or postal code the list is filtered by, e.g. "València · Valencia". */
  protected readonly activePlace    = signal<PlaceSuggestion | null>(null);
  protected readonly initialized    = signal(false);
  protected readonly selectedChurch = signal<Church | null>(null);
  protected readonly isOutsideSpain = signal(false);

  protected readonly loading          = this.churchesService.loading;
  protected readonly error            = this.churchesService.error;
  protected readonly myParish         = this.churchesService.myParish;
  protected readonly favoriteChurches = this.churchesService.favoriteChurches;
  protected readonly mapChurches      = this.churchesService.mapChurches;

  private searchDebounceTimer: any = null;
  private map: any        = null;
  private markers: any[]  = [];
  private userMarker: any = null;
  private churchIcon: any = null;

  // Repinta pines cuando cambian las iglesias del mapa
  private readonly markersEffect = effect(() => {
    const churches = this.mapChurches();
    if (this.map && this.churchIcon && this.viewMode() === 'map') {
      this.zone.runOutsideAngular(() => this.refreshMarkers(churches));
    }
  });

  constructor() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.isOutsideSpain.set(tz !== 'Europe/Madrid' && tz !== 'Atlantic/Canary');
  }

  async ngOnInit(): Promise<void> {
    if (this.initialized()) return;
    this.initialized.set(true);
    await this.churchesService.init();
  }

  ngOnDestroy(): void {
    this.destroyMap();
    clearTimeout(this.searchDebounceTimer);
  }

  // Búsqueda
  // La búsqueda muestra lista Y activa el mapa con los mismos resultados

  onQueryChange(event: CustomEvent): void {
    const value = String(event.detail?.value ?? '').trim();
    this.query.set(value);
    this.activePlace.set(null);
    clearTimeout(this.searchDebounceTimer);

    if (!value) {
      this.viewMode.set('idle');
      this.searchResults.set([]);
      this.suggestions.set([]);
      return;
    }

    // While typing: place / postal code suggestions, plus parishes matching by name.
    this.viewMode.set('search');
    this.searchDebounceTimer = setTimeout(() => {
      this.suggestions.set(this.churchesService.suggest(value));
      this.searchResults.set(this.churchesService.searchByName(value));
    }, 200);
  }

  pickSuggestion(s: PlaceSuggestion): void {
    clearTimeout(this.searchDebounceTimer);
    this.query.set(s.title);
    this.activePlace.set(s);
    this.suggestions.set([]);
    this.searchResults.set(this.churchesService.selectSuggestion(s));
  }

  async confirmSearch(): Promise<void> {
    const value = this.query().trim();
    if (!value) return;

    // Enter picks the best suggestion, so "Valencia" means the city, not every Valencia.
    if (!this.activePlace()) {
      const first = this.churchesService.suggest(value)[0];
      if (first) this.pickSuggestion(first);
      else this.searchResults.set(this.churchesService.searchByName(value));
    }

    const results = this.searchResults();
    if (!results.length) return;

    this.viewMode.set('map');
    await this.waitFor(350);
    await this.ensureMap();
    this.churchesService.showOnMap(results);
    // The map was created after the list was set, so paint the pins now.
    this.zone.runOutsideAngular(() => this.refreshMarkers(this.mapChurches()));
    this.fitMap(results);
  }

  onNativeQuery(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.onQueryChange(new CustomEvent('input', { detail: { value } }));
  }

  clearSearch(): void {
    clearTimeout(this.searchDebounceTimer);
    this.query.set('');
    this.suggestions.set([]);
    this.activePlace.set(null);
    this.viewMode.set('idle');
    this.searchResults.set([]);
  }

  // GPS -> mapa

  async findNearby(): Promise<void> {
    this.clearSearch();
    this.selectedChurch.set(null);
    this.viewMode.set('map');

    await this.waitFor(350);
    await this.ensureMap();
    await this.churchesService.findNearby();
    this.zone.runOutsideAngular(() => this.refreshMarkers(this.mapChurches()));

    const loc = this.churchesService.getUserLocation();
    if (loc?.lat && loc?.lon) {
      this.setUserPin(loc.lat, loc.lon);
      this.fitMap(this.mapChurches().slice(0, 15), [loc.lat, loc.lon]);
    }
  }

  closeMap(): void {
    this.destroyMap();
    this.viewMode.set('idle');
    this.selectedChurch.set(null);
    this.query.set('');
    this.searchResults.set([]);
  }

  // Mapa

  private async ensureMap(): Promise<void> {
    await this.loadLeaflet();
    if (!this.map) this.initMap(40.416, -3.703);
  }

  /** Frames every pin (and the user, when known). */
  private fitMap(churches: Church[], extra?: [number, number]): void {
    if (!this.map) return;
    const points: [number, number][] = churches
      .filter(c => typeof c.lat === 'number' && typeof c.lon === 'number')
      .map(c => [c.lat!, c.lon!]);
    if (extra) points.push(extra);
    if (!points.length) { this.map.setView([40.416, -3.703], 6); return; }
    if (points.length === 1) { this.map.setView(points[0], 16); return; }
    this.map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 16 });
  }

  // Leaflet

  private async loadLeaflet(): Promise<void> {
    await this.injectCSS('leaflet-css',
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
    await this.injectJS('leaflet-js',
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js');

    if (!this.churchIcon) {
      this.churchIcon = L.divIcon({
        className: 'church-marker-icon',
        html:      `<img src="${CHURCH_ICON_URL}" width="32" height="40"
                        style="display:block;width:32px;height:40px;pointer-events:none;"/>`,
        iconSize:   [32, 40],
        iconAnchor: [16, 40],
      });
    }
  }

  private initMap(lat: number, lon: number): void {
    const container = document.getElementById('churches-map');
    if (!container) return;

    this.map = L.map(container, {
      center: [lat, lon], zoom: 15,
      zoomControl: false, tap: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  }

  private setUserPin(lat: number, lon: number): void {
    if (!this.map) return;
    if (this.userMarker) this.userMarker.remove();
    this.userMarker = L.marker([lat, lon], {
      icon: L.divIcon({
        className: 'user-marker-icon',
        html: `<div class="user-pin"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9],
      }),
      zIndexOffset: 1000,
    }).addTo(this.map);
  }

  private refreshMarkers(churches: Church[]): void {
    if (!this.map || !this.churchIcon) return;
    this.markers.forEach(m => m.remove());
    this.markers = [];

    churches
      .filter(c => typeof c.lat === 'number' && typeof c.lon === 'number')
      .forEach(church => {
        const marker = L.marker([church.lat!, church.lon!], { icon: this.churchIcon })
          .addTo(this.map);
        marker.on('click', () => this.zone.run(() => this.selectedChurch.set(church)));
        this.markers.push(marker);
      });
  }

  private destroyMap(): void {
    if (this.map) { this.map.remove(); this.map = null; }
    this.markers = []; this.userMarker = null; this.churchIcon = null;
  }

  // Navegación

  openChurch(church: Church): void {
    this.selectedChurch.set(null);
    this.router.navigate(['/churches', church.id]);
  }

  goToCreateChurch(): void { this.router.navigate(['/churches', 'new']); }

  toggleFavorite(e: Event, church: Church): void {
    e.stopPropagation();
    this.churchesService.toggleFavorite(church.id);
  }

  setMyParish(e: Event, church: Church): void {
    e.stopPropagation();
    this.churchesService.setMyParish(church.id);
  }

  trackByChurchId(_: number, church: Church): string { return church.id; }
  protected isFavorite(c: Church): boolean       { return !!c.isFavorite; }
  protected isMyParishChurch(c: Church): boolean  { return !!c.isMyParish; }

  /** Distance when known, otherwise the city. */
  protected placeLabel(c: Church): string {
    if (typeof c.distanceKm === 'number') {
      return c.distanceKm < 1
        ? `${Math.round(c.distanceKm * 1000)} m`
        : `${c.distanceKm.toFixed(1)} km`;
    }
    return c.city ?? '';
  }

  // Utils

  private injectCSS(id: string, href: string): Promise<void> {
    return new Promise(resolve => {
      if (document.getElementById(id)) { resolve(); return; }
      const el = document.createElement('link');
      el.id = id; el.rel = 'stylesheet'; el.href = href;
      el.onload = () => resolve();
      document.head.appendChild(el);
    });
  }

  private injectJS(id: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) { resolve(); return; }
      const el = document.createElement('script');
      el.id = id; el.src = src;
      el.onload  = () => resolve();
      el.onerror = () => reject(new Error('No se pudo cargar Leaflet'));
      document.head.appendChild(el);
    });
  }

  private waitFor(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}