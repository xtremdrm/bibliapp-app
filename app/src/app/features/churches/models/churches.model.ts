export type ChurchSource = 'directory' | 'manual';

export type ChurchEventType =
  | 'mass'
  | 'confession'
  | 'adoration'
  | 'vespers'
  | 'rosary'
  | 'other';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ChurchSchedule {
  id: string;
  type: ChurchEventType;
  label: string;
  day: Weekday;
  time: string; // HH:mm
  notes?: string;
}

export interface Church {
  id: string;
  source: ChurchSource;

  name: string;
  address: string;
  city: string;
  postalCode?: string;
  province?: string;
  diocese?: string;
  region?: string;
  country?: string;

  lat?: number;
  lon?: number;
  distanceKm?: number;

  phone?: string;
  description?: string;
  notes?: string;
  imageUrl?: string;
  website?: string;

  schedules: ChurchSchedule[];

  isFavorite?: boolean;
  isMyParish?: boolean;
  isUserCreated?: boolean;
}

export interface ChurchReminder {
  id: string;
  churchId: string;
  scheduleId: string;
  title: string;
  body?: string;
  enabled: boolean;
  minutesBefore: number;
}

export interface ChurchesState {
  savedChurches: Church[];
  reminders: ChurchReminder[];
}

export interface UserLocation {
  lat: number;
  lon: number;
  postalCode?: string;
  city?: string;       // village / town / city de Nominatim
  province?: string;
}

// Entrada del JSON parroquias_espana.json
export interface ParroquiaEntry {
  diocesis: string;
  poblacion: string;
  parroquia: string;
  codigo_postal: string;
  direccion: string;
  municipio: string;
  provincia: string;
  telefono: string;
}