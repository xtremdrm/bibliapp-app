/**
 * Sacred art used across BibliApp: public-domain paintings from
 * The Metropolitan Museum of Art (Open Access, CC0), museum borders trimmed.
 * Files live in `src/assets/art/<id>.jpg`.
 */
export interface Artwork {
  id: string;
  title: string;
  artist: string;
  date: string;
  /** CSS object-position that keeps the subject in view when cropped. */
  focus: string;
  /** Shown whole (contain) rather than cropped: the painting keeps its frame. */
  framed?: boolean;
  metId: number;
}

export const ARTWORKS: Artwork[] = [
  { id: 'latour-magdalena',          title: 'La Magdalena penitente',                 artist: 'Georges de La Tour',          date: 'c. 1640',      focus: '40% 30%', metId: 436839 },
  { id: 'caravaggio-negacion-pedro', title: 'La negación de san Pedro',               artist: 'Caravaggio',                  date: '1610',         focus: '70% 40%', metId: 437986 },
  { id: 'ribera-lagrimas-pedro',     title: 'Las lágrimas de san Pedro',              artist: 'José de Ribera',              date: 'c. 1612–13',   focus: '50% 30%', metId: 441971 },
  { id: 'murillo-virgen-nino',       title: 'La Virgen con el Niño',                  artist: 'Bartolomé Esteban Murillo',   date: 'c. 1670',      focus: '50% 35%', metId: 437175 },
  { id: 'greco-adoracion-pastores',  title: 'La adoración de los pastores',           artist: 'El Greco',                    date: 'c. 1605–10',   focus: '50% 55%', metId: 436570 },
  { id: 'greco-vision-san-juan',     title: 'La visión de san Juan',                  artist: 'El Greco',                    date: 'c. 1608–14',   focus: '25% 40%', metId: 436576 },
  { id: 'greco-san-andres',          title: 'San Andrés',                             artist: 'El Greco',                    date: 'c. 1610',      focus: '50% 25%', metId: 436577 },
  { id: 'reni-inmaculada',           title: 'La Inmaculada Concepción',               artist: 'Guido Reni',                  date: '1627',         focus: '50% 35%', metId: 437423 },
  { id: 'zurbaran-san-benito',       title: 'San Benito',                             artist: 'Francisco de Zurbarán',       date: 'c. 1640–45',   focus: '55% 30%', metId: 437970 },
  { id: 'zurbaran-virgen-nina',      title: 'La Virgen niña',                         artist: 'Francisco de Zurbarán',       date: 'c. 1632–33',   focus: '50% 40%', metId: 437971 },
  { id: 'zurbaran-crucifixion',      title: 'La Crucifixión',                         artist: 'Francisco de Zurbarán',       date: 's. XVII',      focus: '50% 30%', metId: 437972 },
  { id: 'murillo-crucifixion',       title: 'La Crucifixión',                         artist: 'Bartolomé Esteban Murillo',   date: 'c. 1675',      focus: '50% 30%', metId: 437172 },
  { id: 'ribera-sagrada-familia',    title: 'La Sagrada Familia con santa Ana y santa Catalina', artist: 'José de Ribera', date: '1648',         focus: '55% 40%', metId: 437455 },
  { id: 'rembrandt-samaritana',      title: 'Cristo y la samaritana',                 artist: 'Rembrandt',                   date: 's. XVII',      focus: '50% 65%', metId: 437403 },
  { id: 'caracciolo-vocacion-mateo', title: 'La vocación de san Mateo',               artist: 'Battistello Caracciolo',      date: 'c. 1625–30',   focus: '40% 35%', metId: 712946 },
  { id: 'saraceni-dormicion',        title: 'La dormición de la Virgen',              artist: 'Carlo Saraceni',              date: 'c. 1612',      focus: '50% 40%', metId: 438690 },
  { id: 'angelico-crucifixion',      title: 'La Crucifixión',                         artist: 'Fra Angelico',                date: 'c. 1420–23',   focus: '50% 25%', metId: 437007 },
  { id: 'strozzi-natividad',         title: 'La Natividad',                           artist: 'Zanobi Strozzi',              date: 'c. 1433–34',   focus: '50% 50%', metId: 435578 },
  { id: 'giovanni-paolo-paraiso',    title: 'El Paraíso',                             artist: 'Giovanni di Paolo',           date: '1445',         focus: '50% 30%', metId: 436512 },
  { id: 'david-adoracion-magos',     title: 'La adoración de los Magos',              artist: 'Gerard David',                date: 'c. 1520',      focus: '50% 55%', metId: 436104 },
  { id: 'david-cristo-bendiciendo',  title: 'Cristo bendiciendo',                     artist: 'Gerard David',                date: 'c. 1500–05',   focus: '50% 30%', metId: 439327, framed: true },
  { id: 'david-virgen-nino',         title: 'La Virgen con el Niño',                  artist: 'Gerard David',                date: 'c. 1520',      focus: '60% 35%', metId: 436103 },
  { id: 'david-anunciacion',         title: 'La Anunciación',                         artist: 'Gerard David',                date: '1506',         focus: '30% 40%', metId: 436096 },
];

export function artSrc(id: string): string {
  return `assets/art/${id}.jpg`;
}

export function getArtwork(id: string): Artwork | undefined {
  return ARTWORKS.find(a => a.id === id);
}

/** One painting per mood: the scene speaks to the feeling. */
export const MOOD_ART: Record<string, string> = {
  ansiedad:   'latour-magdalena',
  tristeza:   'ribera-lagrimas-pedro',
  gratitud:   'giovanni-paolo-paraiso',
  fuerza:     'greco-san-andres',
  miedo:      'caravaggio-negacion-pedro',
  soledad:    'zurbaran-san-benito',
  duda:       'caracciolo-vocacion-mateo',
  esperanza:  'reni-inmaculada',
  perdon:     'rembrandt-samaritana',
  ira:        'murillo-crucifixion',
  amor:       'murillo-virgen-nino',
  enfermedad: 'saraceni-dormicion',
  trabajo:    'zurbaran-virgen-nina',
  tentacion:  'greco-vision-san-juan',
  confianza:  'david-virgen-nino',
};

/** Deterministic painting for a given day (same all day, changes daily). */
export function artOfTheDay(date = new Date()): Artwork {
  const start = new Date(date.getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  return ARTWORKS[dayOfYear % ARTWORKS.length];
}
