export interface VerseReference {
  id: number;
  bookId: number;
  chapter: number;
  verse: number;
}

export interface VerseOfTheDay {
  id: number;
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  /** Last verse of the passage (same as verse for a single verse). */
  verseEnd: number;
  /** Display reference, e.g. "Isaías 41, 9-10". */
  ref: string;
  text: string;
  utcDate: string;
  dayIndex: number;
}