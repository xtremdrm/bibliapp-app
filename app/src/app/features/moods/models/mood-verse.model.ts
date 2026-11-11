export interface MoodVerse {
  id: number;
  ref: string;
  text: string;
  moodIds: string[];
  featured: boolean;
  bookId: number;
  chapter: number;
  verse: number;
  /** Last verse when the entry is a passage of several verses. */
  verseEnd?: number;
}