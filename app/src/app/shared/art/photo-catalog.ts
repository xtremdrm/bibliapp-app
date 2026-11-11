// The app's own photographs, offered as backgrounds in the verse image editor.
// Optimized copies (max 1600px) of assets/hero and assets/moods live in assets/photos.

export interface Photo {
  id: string;
  /** CSS object-position used for cover crops. */
  focus: string;
}

const HERO = Array.from({ length: 20 }, (_, i) => `verse-${i + 1}`);
const MOODS = [
  'peace', 'hope', 'hope2', 'gratitude', 'strength', 'trust', 'love', 'forgiveness',
  'fear', 'doubt', 'lonely', 'illness', 'anger', 'temptation', 'work',
].map(n => `mood-${n}`);

export const PHOTOS: Photo[] = [...HERO, ...MOODS].map(id => ({ id, focus: '50% 50%' }));

/** Backgrounds offered in the image editor: mood photos stay with their tiles, except Fuerza. */
export const EDITOR_PHOTOS: Photo[] = PHOTOS.filter(p => !p.id.startsWith('mood-') || p.id === 'mood-strength');

export function photoSrc(id: string): string {
  return `assets/photos/${id}.jpg`;
}

/** Optimized copy of a mood photo: "assets/moods/peace.jpg" -> "assets/photos/mood-peace.jpg". */
export function moodPhotoSrc(image: string | undefined | null): string | null {
  if (!image) return null;
  const base = image.split('/').pop()?.replace(/\.[^.]+$/, '');
  return base && getPhoto(`mood-${base}`) ? photoSrc(`mood-${base}`) : image;
}

export function getPhoto(id: string): Photo | undefined {
  return PHOTOS.find(p => p.id === id);
}
