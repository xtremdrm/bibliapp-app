// Turns single verse references into readable passages: a verse that starts or
// ends mid-sentence is extended to the whole sentence, and neighbouring verses
// are merged, so "no temas, porque yo estoy contigo…" never shows up alone.

import { BibleVerse } from '../../features/bible/models/bible.models';

export interface Passage {
  start: number;
  end: number;
  text: string;
}

/** Longest passage we build, in verses. */
const MAX_SPAN = 5;

// Acrostic markers in some psalms, e.g. "(Qof) el Señor está cerca…".
const ACROSTIC = /^\([^)]{1,12}\)\s*/;

// Psalm headings that some first verses carry before the text,
// e.g. "Salmo de David. El Señor es mi pastor…".
const HEADING = /^(Al [Dd]irector|Al maestro|A [A-ZÁÉÍÓÚ][^\s.]*\.|En conmemoración|Salmo|De David|De Asaf|De los hijos de Cor|De Salomón|De Moisés|Oración|Canción|Cántico|Poema|Epigrama|Himno|Plegaria|Masquil|Con instrumentos|Según)/;

export function cleanVerseText(text: string): string {
  return String(text ?? '').replace(ACROSTIC, '').trim();
}

/** Drops leading heading sentences from a chapter's first verse, keeping the text. */
function stripHeading(text: string): string {
  const sentences = text.split(/(?<=\.)\s+/);
  let i = 0;
  while (i < sentences.length - 1 && HEADING.test(sentences[i])) i++;
  return sentences.slice(i).join(' ');
}

function startsMidSentence(text: string): boolean {
  const first = cleanVerseText(text).replace(/^[«"“'(¿¡\s—–-]+/, '').charAt(0);
  return !!first && first !== first.toUpperCase() && first === first.toLowerCase();
}

function endsMidSentence(text: string): boolean {
  const trimmed = cleanVerseText(text).replace(/[»"”')\s]+$/, '');
  return !!trimmed && !/[.!?…]$/.test(trimmed);
}

/** Extends [start, end] until it begins and ends on a full sentence. */
export function expandToSentence(verses: BibleVerse[], start: number, end = start): Passage | null {
  const sorted = [...verses].sort((a, b) => a.v - b.v);
  let s = sorted.findIndex(v => v.v === start);
  let e = sorted.findIndex(v => v.v === end);
  if (s < 0) return null;
  if (e < s) e = s;

  while (s > 0 && e - s + 1 < MAX_SPAN && startsMidSentence(sorted[s].t)) s--;
  while (e < sorted.length - 1 && e - s + 1 < MAX_SPAN && endsMidSentence(sorted[e].t)) e++;

  const slice = sorted.slice(s, e + 1);
  const text = slice
    .map(v => (v.v === 1 ? stripHeading(cleanVerseText(v.t)) : cleanVerseText(v.t)))
    .filter(Boolean)
    .join(' ');
  return text ? { start: slice[0].v, end: slice[slice.length - 1].v, text } : null;
}

/**
 * Builds passages for several verses of one chapter: each verse is completed to
 * its sentence, then overlapping or consecutive passages are joined.
 */
export function buildPassages(verses: BibleVerse[], picked: number[]): Passage[] {
  const expanded = [...new Set(picked)]
    .sort((a, b) => a - b)
    .map(v => expandToSentence(verses, v))
    .filter((p): p is Passage => !!p);

  const ranges: { start: number; end: number }[] = [];
  for (const p of expanded) {
    const last = ranges[ranges.length - 1];
    if (last && p.start <= last.end + 1 && Math.max(last.end, p.end) - last.start + 1 <= MAX_SPAN) {
      last.end = Math.max(last.end, p.end);
    } else {
      ranges.push({ start: p.start, end: p.end });
    }
  }

  return ranges
    .map(r => expandToSentence(verses, r.start, r.end))
    .filter((p): p is Passage => !!p);
}

/** "Isaías 41, 9-10" or "Isaías 41, 10". */
export function passageRef(bookName: string, chapter: number, p: { start: number; end: number }): string {
  return `${bookName} ${chapter}, ${p.start === p.end ? p.start : `${p.start}-${p.end}`}`;
}
