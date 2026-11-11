export interface Mood {
  id: string;
  title: string;
  /** Short verbatim verse fragment shown on the mood page. */
  quote?: string;
  quoteRef?: string;
  icon: string;
  gradient: string;
  image?: string;
}