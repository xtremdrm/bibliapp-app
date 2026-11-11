export interface BibleSectionDef {
  id: string;
  title: string;
  testament: 'AT' | 'NT';
  bookIds: number[];
}

/**
 * Orden católico de los libros, por ID de books.json.
 * Cubre los 73 libros.
 */
export const BIBLE_SECTIONS: BibleSectionDef[] = [
  // AT
  {
    id: 'pentateuco',
    title: 'Pentateuco',
    testament: 'AT',
    bookIds: [1, 2, 3, 4, 5],
  },
  {
    id: 'historicos',
    title: 'Libros Históricos',
    testament: 'AT',
    bookIds: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 45, 46],
  },
  {
    id: 'sapienciales',
    title: 'Sapienciales y Poéticos',
    testament: 'AT',
    bookIds: [20, 21, 22, 23, 24, 25, 26],
  },
  {
    id: 'profetas_mayores',
    title: 'Profetas Mayores',
    testament: 'AT',
    bookIds: [27, 28, 29, 30, 31, 32],
  },
  {
    id: 'profetas_menores',
    title: 'Profetas Menores',
    testament: 'AT',
    bookIds: [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
  },

  // NT
  {
    id: 'evangelios',
    title: 'Evangelios',
    testament: 'NT',
    bookIds: [47, 48, 49, 50],
  },
  {
    id: 'hechos',
    title: 'Hechos de los Apóstoles',
    testament: 'NT',
    bookIds: [51],
  },
  {
    id: 'paulinas',
    title: 'Cartas Paulinas',
    testament: 'NT',
    // Hebreos (65) va con las cartas paulinas
    bookIds: [52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65],
  },
  {
    id: 'catolicas',
    title: 'Cartas Católicas',
    testament: 'NT',
    bookIds: [66, 67, 68, 69, 70, 71, 72],
  },
  {
    id: 'apocalipsis',
    title: 'Apocalipsis',
    testament: 'NT',
    bookIds: [73],
  },
];