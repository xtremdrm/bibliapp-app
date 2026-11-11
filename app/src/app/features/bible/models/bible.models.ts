export interface BibleBook {
  id: number;
  name: string;
  abbr: string;
  testament: 'AT' | 'NT';
  chapters: number;
}

export interface BibleVerse {
  v: number;
  t: string;
}

export type BibleData = Record<string, Record<string, BibleVerse[]>>;