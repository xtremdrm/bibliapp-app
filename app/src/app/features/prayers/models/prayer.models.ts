export type PrayerCategoryId =
  | 'rosary'
  | 'morning'
  | 'night'
  | 'protection'
  | 'virgin'
  | 'saints'
  | 'before_meal'
  | 'after_communion'
  | 'contrition'
  | 'holy_spirit'
  | 'thanks';

export interface PrayerCategory {
  id: PrayerCategoryId;
  title: string;
  icon?: string; // ion-icon name
  order: number;
}

export interface Prayer {
  id: string;                // slug estable (para ruta /tabs/prayers/:id)
  title: string;
  categoryId: PrayerCategoryId;
  short?: string;            // texto corto opcional para lista
  body: string;              // texto completo (con saltos \n)
  tags?: string[];
  source?: string;           // opcional: "Tradicional", "Liturgia", etc.
}