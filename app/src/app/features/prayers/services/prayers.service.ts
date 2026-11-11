import { Injectable } from '@angular/core';

export interface PrayerCategory {
  id: string;
  title: string;
  icon?: string; // opcional
}

export interface PrayerItem {
  id: string;
  title: string;
  categoryId: string;
  short?: string; // opcional
  body?: string[];
  lines?: { role: string; text: string }[];
}

export interface PrayersData {
  categories: PrayerCategory[];
  items: PrayerItem[];
}

const FAV_KEY = 'bibliapp.prayers.favs';

@Injectable({
  providedIn: 'root',
})
export class PrayersService {
  private cache: PrayersData | null = null;

  async load(): Promise<PrayersData> {
    if (this.cache) return this.cache;

    // Ruta del JSON de oraciones
    const path = 'assets/prayers/prayers.es.json';
    const url = new URL(path, document.baseURI);

    const res = await fetch(url);
    this.cache = await res.json();

    return this.cache!;
  }

  async getCategories() {
    const data = await this.load();
    return data.categories ?? [];
  }

  async getPrayers() {
    const data = await this.load();
    return data.items ?? [];
  }

  async getPrayer(id: string) {
    const data = await this.load();
    return (data.items ?? []).find(p => p.id === id);
  }

  // Favoritos (localStorage)
  private readFavs(): Set<string> {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw) as string[];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  private writeFavs(set: Set<string>) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
    } catch {
      // ignore
    }
  }

  isFavorite(id: string): boolean {
    return this.readFavs().has(id);
  }

  toggleFavorite(id: string): boolean {
    const favs = this.readFavs();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    this.writeFavs(favs);
    return favs.has(id);
  }
}