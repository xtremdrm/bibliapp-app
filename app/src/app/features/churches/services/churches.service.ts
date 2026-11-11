import { Injectable, computed, signal } from '@angular/core';
import { Church, UserLocation } from '../models/churches.model';
import { ChurchDirectoryService, PlaceSuggestion } from './church-directory.service';
import { ChurchesStorageService } from './churches-storage.service';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class ChurchesService {

  private readonly _savedChurches  = signal<Church[]>([]);
  private readonly _mapChurches    = signal<Church[]>([]);  // las que se pintan en el mapa
  private readonly _userLocation   = signal<UserLocation | null>(null);

  readonly loading         = signal(false);
  readonly error           = signal<string | null>(null);

  // Lo que muestra el mapa; incluye guardadas para que pines de favoritas aparezcan
  readonly mapChurches = computed(() => {
    const map   = this._mapChurches();
    const saved = this._savedChurches();
    const savedMap = new Map(saved.map(c => [c.id, c]));
    return map.map(c => savedMap.has(c.id) ? { ...c, ...savedMap.get(c.id)! } : c);
  });

  readonly myParish = computed(() =>
    this._savedChurches().find(c => c.isMyParish)
  );

  readonly favoriteChurches = computed(() =>
    this._savedChurches().filter(c => c.isFavorite && !c.isMyParish)
  );

  constructor(
    private directory: ChurchDirectoryService,
    private storage:   ChurchesStorageService,
  ) {}

  async init(): Promise<void> {
    const saved = this.storage.loadSavedChurches().map(c => ({
      ...c, schedules: Array.isArray(c.schedules) ? c.schedules : [],
    }));
    this._savedChurches.set(saved);
    await this.directory.ensureLoaded();
  }

  getUserLocation(): UserLocation | null {
    return this._userLocation();
  }

  // Near me: GPS + offline coordinates, no per-church geocoding

  async findNearby(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this._mapChurches.set([]);

    try {
      const location = await this.requestLocation();
      this._userLocation.set(location);

      const nearby = this.directory.nearest(location.lat, location.lon, location.postalCode);
      if (!nearby.length) {
        this.error.set('No hay parroquias a menos de 30 km.');
        return;
      }
      this._mapChurches.set(nearby);
    } catch (e: any) {
      this.error.set(e?.message ?? 'No se pudo obtener tu ubicación.');
    } finally {
      this.loading.set(false);
    }
  }

  // Search

  suggest(query: string): PlaceSuggestion[] {
    return this.directory.suggest(query);
  }

  searchByName(query: string): Church[] {
    return this.directory.searchByName(query);
  }

  /** Parishes of a suggested place or postal code; they all have map pins. */
  selectSuggestion(s: PlaceSuggestion): Church[] {
    const results = this.directory.bySuggestion(s);
    this._mapChurches.set(results);
    return results;
  }

  showOnMap(churches: Church[]): void {
    this._mapChurches.set(churches);
  }

  // Location

  private async requestLocation(): Promise<UserLocation> {
    // requestPermissions() is not implemented on the web; the browser asks on getCurrentPosition().
    if (Capacitor.isNativePlatform()) {
      const perm = await Geolocation.requestPermissions();
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        throw new Error('Permiso de ubicación denegado.');
      }
    }
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true, timeout: 10000,
    });
    const { latitude: lat, longitude: lon } = pos.coords;
    return { lat, lon, postalCode: await this.postalCodeAt(lat, lon) };
  }

  /**
   * One optional lookup per tap, only to break ties between parishes that share
   * a point. Results never depend on it: offline or rate-limited, distance alone is used.
   */
  private async postalCodeAt(lat: number, lon: number): Promise<string | undefined> {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' }, signal: ctrl.signal },
      );
      clearTimeout(timer);
      if (!res.ok) return undefined;
      const data = await res.json();
      return data?.address?.postcode ?? undefined;
    } catch {
      return undefined;
    }
  }

  // CRUD

  getChurchById(id: string): Church | undefined {
    return [...this._mapChurches(), ...this._savedChurches()].find(c => c.id === id);
  }

  toggleFavorite(id: string): void {
    this.ensureSaved(id);
    this._savedChurches.set(
      this._savedChurches().map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)
    );
    this.persist();
  }

  setMyParish(id: string): void {
    this.ensureSaved(id);
    this._savedChurches.set(
      this._savedChurches().map(c => ({ ...c, isMyParish: c.id === id }))
    );
    this.persist();
  }

  addManualChurch(input: Omit<Church, 'id' | 'source'>): Church {
    const church: Church = {
      ...input,
      id:            `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source:        'manual',
      isUserCreated: true,
      schedules:     [...(input.schedules ?? [])],
    };
    let saved = [...this._savedChurches()];
    if (church.isMyParish) saved = saved.map(c => ({ ...c, isMyParish: false }));
    saved.push(church);
    this._savedChurches.set(saved);
    this.persist();
    return church;
  }

  updateSavedChurch(updated: Church): void {
    let saved = this._savedChurches();
    if (updated.isMyParish) saved = saved.map(c => ({ ...c, isMyParish: c.id === updated.id }));
    saved = saved.map(c => c.id === updated.id
      ? { ...updated, schedules: Array.isArray(updated.schedules) ? updated.schedules : [] }
      : c);
    this._savedChurches.set(saved);
    this.persist();
  }

  saveDirectoryChurch(id: string): void { this.ensureSaved(id); }

  deleteSavedChurch(id: string): void {
    this._savedChurches.set(this._savedChurches().filter(c => c.id !== id));
    this.persist();
  }

  private ensureSaved(id: string): void {
    if (this._savedChurches().some(c => c.id === id)) return;
    const church = this._mapChurches().find(c => c.id === id);
    if (!church) return;
    this._savedChurches.set([...this._savedChurches(), { ...church, schedules: [] }]);
  }

  private persist(): void {
    this.storage.saveSavedChurches(this._savedChurches());
  }
}