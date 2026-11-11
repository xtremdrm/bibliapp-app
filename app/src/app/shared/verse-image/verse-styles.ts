// Style catalog for verse images: layouts, formats, fonts, backgrounds and colours.
// All fonts are self-hosted through @fontsource (see angular.json "styles").

export type LayoutId = 'misal' | 'lamina' | 'clasico' | 'editorial' | 'estampa' | 'minimal';
export type FormatId = 'square' | 'portrait' | 'story';
export type QuoteStyle = 'none' | 'curly' | 'angle';
export type FontGroup = 'Clásicas' | 'Titulares' | 'Lapidarias' | 'Caligráficas' | 'Antiguas' | 'Modernas';

export type VerseBackground =
  | { kind: 'art'; id: string }
  | { kind: 'photo'; id: string }
  | { kind: 'solid'; color: string };

export interface VerseImageStyle {
  layout: LayoutId;
  format: FormatId;
  bg: VerseBackground;
  fontId: string;
  textColor: string;
  accentColor: string;
  /** Multiplier over the automatic text size (0.7–1.4). */
  scale: number;
  lineHeight: number;
  align: 'left' | 'center';
  caps: boolean;
  italic: boolean;
  quotes: QuoteStyle;
  /** Wash over paintings, 0–90 (%). */
  overlay: number;
  showRef: boolean;
  showCredit: boolean;
  showMark: boolean;
}

export interface EditorFont {
  id: string;
  label: string;
  family: string;
  weight: number;
  group: FontGroup;
  /** Whether an italic face exists. */
  italic: boolean;
}

export const EDITOR_FONTS: EditorFont[] = [
  { id: 'eb-garamond',   label: 'Garamond',        family: 'EB Garamond Variable',        weight: 500, group: 'Clásicas',     italic: true },
  { id: 'cormorant',     label: 'Cormorant',       family: 'Cormorant Garamond Variable', weight: 500, group: 'Clásicas',     italic: true },
  { id: 'caslon',        label: 'Caslon',          family: 'Libre Caslon Text',           weight: 400, group: 'Clásicas',     italic: true },
  { id: 'crimson',       label: 'Crimson',         family: 'Crimson Pro Variable',        weight: 400, group: 'Clásicas',     italic: true },
  { id: 'spectral',      label: 'Spectral',        family: 'Spectral',                    weight: 400, group: 'Clásicas',     italic: true },
  { id: 'lora',          label: 'Lora',            family: 'Lora Variable',               weight: 500, group: 'Clásicas',     italic: true },
  { id: 'playfair',      label: 'Playfair',        family: 'Playfair Display Variable',   weight: 600, group: 'Titulares',    italic: true },
  { id: 'dm-serif',      label: 'DM Serif',        family: 'DM Serif Display',            weight: 400, group: 'Titulares',    italic: true },
  { id: 'bodoni',        label: 'Bodoni',          family: 'Bodoni Moda Variable',        weight: 500, group: 'Titulares',    italic: true },
  { id: 'fraunces',      label: 'Fraunces',        family: 'Fraunces Variable',           weight: 500, group: 'Titulares',    italic: true },
  { id: 'instrument',    label: 'Instrument',      family: 'Instrument Serif',            weight: 400, group: 'Titulares',    italic: true },
  { id: 'cinzel',        label: 'Cinzel',          family: 'Cinzel Variable',             weight: 500, group: 'Lapidarias',   italic: false },
  { id: 'marcellus',     label: 'Marcellus',       family: 'Marcellus',                   weight: 400, group: 'Lapidarias',   italic: false },
  { id: 'italiana',      label: 'Italiana',        family: 'Italiana',                    weight: 400, group: 'Lapidarias',   italic: false },
  { id: 'pinyon',        label: 'Pinyon',          family: 'Pinyon Script',               weight: 400, group: 'Caligráficas', italic: false },
  { id: 'italianno',     label: 'Italianno',       family: 'Italianno',                   weight: 400, group: 'Caligráficas', italic: false },
  { id: 'fell',          label: 'Fell English',    family: 'IM Fell English',             weight: 400, group: 'Antiguas',     italic: true },
  { id: 'uncial',        label: 'Uncial',          family: 'Uncial Antiqua',              weight: 400, group: 'Antiguas',     italic: false },
  { id: 'fraktur',       label: 'Fraktur',         family: 'UnifrakturMaguntia',          weight: 400, group: 'Antiguas',     italic: false },
  { id: 'instrument-sans', label: 'Instrument Sans', family: 'Instrument Sans Variable',  weight: 500, group: 'Modernas',     italic: false },
  { id: 'manrope',       label: 'Manrope',         family: 'Manrope Variable',            weight: 600, group: 'Modernas',     italic: false },
  { id: 'archivo',       label: 'Archivo Black',   family: 'Archivo Black',               weight: 400, group: 'Modernas',     italic: false },
];

export const FONT_GROUPS: FontGroup[] = ['Clásicas', 'Titulares', 'Lapidarias', 'Caligráficas', 'Antiguas', 'Modernas'];

export function getFont(id: string): EditorFont {
  return EDITOR_FONTS.find(f => f.id === id) ?? EDITOR_FONTS[0];
}

export const FORMATS: Record<FormatId, { label: string; ratio: string; w: number; h: number }> = {
  square:   { label: 'Cuadrado', ratio: '1:1',  w: 1080, h: 1080 },
  portrait: { label: 'Vertical', ratio: '4:5',  w: 1080, h: 1350 },
  story:    { label: 'Historia', ratio: '9:16', w: 1080, h: 1920 },
};

export const LAYOUTS: { id: LayoutId; label: string }[] = [
  { id: 'misal',     label: 'Misal' },
  { id: 'lamina',    label: 'Lámina' },
  { id: 'clasico',   label: 'Clásico' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'estampa',   label: 'Estampa' },
  { id: 'minimal',   label: 'Mínimo' },
];

export const SOLID_COLORS: { label: string; color: string }[] = [
  { label: 'Tinta',      color: '#121212' },
  { label: 'Pergamino',  color: '#ede6d8' },
  { label: 'Hueso',      color: '#f6f1e7' },
  { label: 'Granate',    color: '#4a1714' },
  { label: 'Rúbrica',    color: '#a8432f' },
  { label: 'Morado',     color: '#3b2747' },
  { label: 'Verde',      color: '#24372a' },
  { label: 'Azul',       color: '#1c2f4a' },
  { label: 'Ocre',       color: '#8a6a3a' },
  { label: 'Negro',      color: '#000000' },
];

export const TEXT_COLORS: { label: string; color: string }[] = [
  { label: 'Pergamino', color: '#ede6d8' },
  { label: 'Blanco',    color: '#ffffff' },
  { label: 'Oro',       color: '#d2b47a' },
  { label: 'Rúbrica',   color: '#c9a24e' },
  { label: 'Granate',   color: '#6b1f1a' },
  { label: 'Tinta',     color: '#1a1a1a' },
];

export const ACCENT_COLORS: { label: string; color: string }[] = [
  { label: 'Rúbrica',   color: '#c9a24e' },
  { label: 'Bermellón', color: '#b34a36' },
  { label: 'Oro',       color: '#d2b47a' },
  { label: 'Pergamino', color: '#ede6d8' },
  { label: 'Tinta',     color: '#1a1a1a' },
];

const BASE: Omit<VerseImageStyle, 'layout' | 'bg' | 'fontId' | 'textColor' | 'accentColor' | 'align' | 'italic' | 'quotes'> = {
  format: 'square',
  scale: 1,
  lineHeight: 1.32,
  caps: false,
  overlay: 50,
  showRef: true,
  showCredit: false,
  showMark: true,
};

/** Preset defaults. The art background is kept from the current style when the preset uses art. */
export function presetStyle(layout: LayoutId, current?: VerseImageStyle): VerseImageStyle {
  const keep = current
    ? { format: current.format, showRef: current.showRef, showCredit: current.showCredit, showMark: current.showMark }
    : {};
  const art: VerseBackground =
    current && current.bg.kind !== 'solid' ? current.bg : { kind: 'art', id: 'latour-magdalena' };

  const presets: Record<LayoutId, VerseImageStyle> = {
    misal: {
      ...BASE, layout: 'misal', bg: { kind: 'solid', color: '#ede6d8' }, fontId: 'eb-garamond',
      textColor: '#1a1a1a', accentColor: '#b34a36', align: 'left', italic: false, quotes: 'none', lineHeight: 1.34,
    },
    lamina: {
      ...BASE, layout: 'lamina', bg: art, fontId: 'cormorant',
      textColor: '#ede6d8', accentColor: '#c9a24e', align: 'center', italic: true, quotes: 'none',
    },
    clasico: {
      ...BASE, layout: 'clasico', bg: art, fontId: 'playfair',
      textColor: '#ffffff', accentColor: '#d2b47a', align: 'center', italic: false, quotes: 'curly', overlay: 55,
    },
    editorial: {
      ...BASE, layout: 'editorial', bg: { kind: 'solid', color: '#121212' }, fontId: 'dm-serif',
      textColor: '#ede6d8', accentColor: '#c9a24e', align: 'left', italic: false, quotes: 'none', lineHeight: 1.18, scale: 1.1,
    },
    estampa: {
      ...BASE, layout: 'estampa', bg: { kind: 'solid', color: '#f6f1e7' }, fontId: 'cinzel',
      textColor: '#3a2620', accentColor: '#b34a36', align: 'center', italic: false, quotes: 'none', lineHeight: 1.42, scale: 0.9,
    },
    minimal: {
      ...BASE, layout: 'minimal', bg: { kind: 'solid', color: '#1c2f4a' }, fontId: 'instrument-sans',
      textColor: '#ede6d8', accentColor: '#ede6d8', align: 'center', italic: false, quotes: 'none', scale: 0.82, lineHeight: 1.45,
    },
  };
  return { ...presets[layout], ...keep };
}

export function hexLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function isLight(hex: string): boolean {
  return hexLuminance(hex) > 0.35;
}

/** Spanish citation style: "Génesis 1, 3-4. 7". */
export function formatRef(bookName: string, chapter: number, verses: number[]): string {
  if (!verses.length) return `${bookName} ${chapter}`;
  const sorted = [...new Set(verses)].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const v = sorted[i];
    if (v === prev + 1) { prev = v; continue; }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = v;
    prev = v;
  }
  return `${bookName} ${chapter}, ${parts.join('. ')}`;
}
