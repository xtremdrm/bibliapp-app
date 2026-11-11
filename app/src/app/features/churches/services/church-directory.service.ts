// Offline parish directory. Coordinates and place names come from places.json,
// built from the GeoNames postal code list (scripts/build-church-places.mjs),
// so search and "near me" need no geocoding calls.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Church, ParroquiaEntry } from '../models/churches.model';

interface PlacesFile {
  /** [name, province, community] */
  m: [string, string, string][];
  /** postal code -> [lat, lon, place indexes] */
  cp: Record<string, [number, number, number[]]>;
}

export interface PlaceSuggestion {
  kind: 'place' | 'cp';
  /** Place index (kind 'place') or the postal code (kind 'cp'). */
  key: string;
  title: string;
  detail: string;
  count: number;
}

const EARTH_KM = 6371;

@Injectable({ providedIn: 'root' })
export class ChurchDirectoryService {

  private allEntries: Church[] = [];
  private loaded = false;
  private places: PlacesFile = { m: [], cp: {} };

  private cpIndex     = new Map<string, number[]>();
  private placeIndex  = new Map<number, number[]>();   // place -> parishes
  private placeFolded: string[] = [];
  private indexName   = new Map<string, Set<number>>();

  constructor(private http: HttpClient) {}

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    const [raw, places] = await Promise.all([
      firstValueFrom(this.http.get<ParroquiaEntry[]>('assets/churches/parroquias_espana.json')),
      firstValueFrom(this.http.get<PlacesFile>('assets/churches/places.json')).catch(() => ({ m: [], cp: {} } as PlacesFile)),
    ]);
    this.places = places;
    this.placeFolded = places.m.map(([name]) => this.normalize(name));
    this.allEntries = raw.map((e, i) => this.mapEntry(e, i));
    this.buildIndexes();
    this.loaded = true;
  }

  private buildIndexes(): void {
    const seen = new Map<string, number>();
    this.allEntries.forEach((church, i) => {
      const cp = church.postalCode ?? '';
      if (cp) push(this.cpIndex, cp, i);
      for (const t of this.tokenize(church.name)) {
        if (!this.indexName.has(t)) this.indexName.set(t, new Set());
        this.indexName.get(t)!.add(i);
      }

      const info = this.places.cp[cp];
      if (!info) return;

      // Spread parishes that share a postal code around its point, so every
      // pin is visible on the map instead of stacking on one spot.
      const n = seen.get(cp) ?? 0;
      seen.set(cp, n + 1);
      const [lat, lon] = this.spread(info[0], info[1], n);
      church.lat = lat;
      church.lon = lon;

      const place = this.placeFor(church, info[2]);
      if (place !== undefined) {
        push(this.placeIndex, place, i);
        const [, province, community] = this.places.m[place];
        church.province = province;
        church.region = community;
      }
    });
  }

  /** When a postal code covers several places, pick the one named in the parish data. */
  private placeFor(church: Church, candidates: number[]): number | undefined {
    if (candidates.length <= 1) return candidates[0];
    const city = this.normalize(church.city);
    const address = this.normalize(church.address);
    return candidates.find(m => this.placeFolded[m] === city)
      ?? candidates.find(m => city.startsWith(this.placeFolded[m]))
      ?? candidates.find(m => address.includes(this.placeFolded[m]))
      ?? candidates[0];
  }

  private spread(lat: number, lon: number, n: number): [number, number] {
    if (n === 0) return [lat, lon];
    const ring = Math.ceil(Math.sqrt(n / 3));
    const angle = n * 2.399963; // golden angle
    const r = 0.0012 * ring;     // ~130 m per ring
    return [lat + r * Math.sin(angle), lon + (r * Math.cos(angle)) / Math.cos((lat * Math.PI) / 180)];
  }

  // Suggestions

  /** Places (and postal codes when typing digits) that have parishes. */
  suggest(query: string, max = 6): PlaceSuggestion[] {
    const q = this.normalize(query);
    if (!q) return [];

    if (/^\d{2,5}$/.test(q)) {
      return [...this.cpIndex.keys()]
        .filter(cp => cp.startsWith(q))
        .sort()
        .slice(0, max)
        .map(cp => {
          const place = this.places.cp[cp]?.[2]?.[0];
          const [name, province] = place !== undefined ? this.places.m[place] : ['', ''];
          return {
            kind: 'cp' as const, key: cp, title: cp,
            detail: [name, province].filter(Boolean).join(' · '),
            count: this.cpIndex.get(cp)!.length,
          };
        });
    }

    if (q.length < 2) return [];
    const hits: { m: number; rank: number; count: number }[] = [];
    this.placeFolded.forEach((name, m) => {
      const count = this.placeIndex.get(m)?.length ?? 0;
      if (!count) return;
      const rank = name === q ? 0 : name.startsWith(q) ? 1 : name.includes(` ${q}`) ? 2 : -1;
      if (rank >= 0) hits.push({ m, rank, count });
    });

    return hits
      .sort((a, b) => a.rank - b.rank || b.count - a.count)
      .slice(0, max)
      .map(({ m, count }) => {
        const [name, province, community] = this.places.m[m];
        return {
          kind: 'place' as const, key: String(m), title: name,
          detail: [province, community].filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
          count,
        };
      });
  }

  bySuggestion(s: PlaceSuggestion): Church[] {
    const idx = s.kind === 'cp'
      ? this.cpIndex.get(s.key) ?? []
      : this.placeIndex.get(Number(s.key)) ?? [];
    return idx.map(i => this.allEntries[i]);
  }

  // Search by parish name

  searchByName(query: string, maxResults = 40): Church[] {
    const tokens = this.tokenize(query);
    if (!tokens.length) return [];
    const scores = new Map<number, number>();
    for (const token of tokens) {
      for (const [key, indices] of this.indexName) {
        if (!key.startsWith(token)) continue;
        for (const i of indices) scores.set(i, (scores.get(i) ?? 0) + 1);
      }
    }
    return [...scores]
      .filter(([, s]) => s >= tokens.length)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxResults)
      .map(([i]) => this.allEntries[i]);
  }

  // Near me

  /**
   * Parishes ordered by distance from a point. Parishes in the user's own
   * postal code win ties (cities where every code shares one point).
   */
  nearest(lat: number, lon: number, userPostalCode?: string, max = 40, maxKm = 30): Church[] {
    return this.allEntries
      .filter(c => typeof c.lat === 'number' && typeof c.lon === 'number')
      .map(c => ({ ...c, distanceKm: distanceKm(lat, lon, c.lat!, c.lon!) }))
      .filter(c => c.distanceKm <= maxKm)
      .sort((a, b) => {
        const own = Number(b.postalCode === userPostalCode) - Number(a.postalCode === userPostalCode);
        const d = a.distanceKm - b.distanceKm;
        return Math.abs(d) < 0.05 ? own || d : d;
      })
      .slice(0, max);
  }

  // Utils

  private tokenize(text: string): string[] {
    return this.normalize(text).split(/\s+/).filter(t => t.length >= 2);
  }

  private normalize(text: string): string {
    return (text ?? '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private mapEntry(entry: ParroquiaEntry, index: number): Church {
    return {
      id:         `dir-${index}-${entry.codigo_postal}-${this.slug(entry.parroquia)}`,
      source:     'directory',
      name:       entry.parroquia,
      address:    entry.direccion,
      city:       entry.poblacion,
      postalCode: entry.codigo_postal,
      province:   entry.diocesis,
      diocese:    entry.diocesis,
      country:    'España',
      phone:      entry.telefono || undefined,
      schedules:  [],
      isFavorite: false,
      isMyParish: false,
    };
  }

  private slug(text: string): string {
    return this.normalize(text).replace(/\s+/g, '-').slice(0, 24);
  }
}

function push<K>(map: Map<K, number[]>, key: K, value: number): void {
  const list = map.get(key);
  if (list) list.push(value); else map.set(key, [value]);
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}
