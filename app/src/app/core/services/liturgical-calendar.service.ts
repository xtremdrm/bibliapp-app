import { Injectable } from '@angular/core';

export type LiturgicalSeason =
  | 'adviento' | 'navidad' | 'ordinario_i' | 'cuaresma'
  | 'triduo' | 'pascua' | 'ordinario_ii' | 'pentecostes';

export interface LiturgicalDay {
  season: LiturgicalSeason;
  seasonLabel: string;
  weekNumber: number;       // semana dentro del tiempo
  weekday: string;          // Lunes, Martes…
  color: LiturgicalColor;
  colorLabel: string;
  colorHex: string;
  saint: string;
  isFeast: boolean;         // solemnidad o fiesta
  feastLabel?: string;      // nombre de la solemnidad
  shortDesc: string;        // resumen de 1 línea para la tarjeta
}

export type LiturgicalColor = 'morado' | 'blanco' | 'rojo' | 'verde' | 'rosa' | 'dorado';

// Algoritmo de Meeus/Jones/Butcher para la fecha de Pascua
function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate();
}

function isBetween(d: Date, start: Date, end: Date): boolean {
  const t = d.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

// Primer domingo anterior o igual a 'date'
function prevSunday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// Último domingo antes de 'date'
function lastSundayBefore(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay(); // 0=dom
  d.setDate(d.getDate() - (dow === 0 ? 7 : dow));
  return d;
}

// Solemnidades y fiestas fijas
interface FixedFeast { month: number; day: number; label: string; color: LiturgicalColor; }

const FIXED_FEASTS: FixedFeast[] = [
  { month: 1,  day: 1,  label: 'Santa María, Madre de Dios',      color: 'blanco'  },
  { month: 1,  day: 6,  label: 'Epifanía del Señor',               color: 'blanco'  },
  { month: 1,  day: 13, label: 'Bautismo del Señor',                color: 'blanco'  },
  { month: 2,  day: 2,  label: 'Presentación del Señor',            color: 'blanco'  },
  { month: 2,  day: 14, label: 'San Valentín',                      color: 'rojo'    },
  { month: 3,  day: 19, label: 'San José, Esposo de María',         color: 'blanco'  },
  { month: 3,  day: 25, label: 'Anunciación del Señor',             color: 'blanco'  },
  { month: 4,  day: 23, label: 'San Jorge',                         color: 'rojo'    },
  { month: 6,  day: 13, label: 'San Antonio de Padua',              color: 'blanco'  },
  { month: 6,  day: 24, label: 'Natividad de San Juan Bautista',    color: 'blanco'  },
  { month: 6,  day: 29, label: 'Santos Pedro y Pablo',              color: 'rojo'    },
  { month: 7,  day: 25, label: 'Santiago Apóstol',                  color: 'rojo'    },
  { month: 8,  day: 6,  label: 'Transfiguración del Señor',         color: 'blanco'  },
  { month: 8,  day: 15, label: 'Asunción de María',                 color: 'blanco'  },
  { month: 8,  day: 28, label: 'San Agustín',                       color: 'blanco'  },
  { month: 9,  day: 8,  label: 'Natividad de María',                color: 'blanco'  },
  { month: 9,  day: 29, label: 'Santos Arcángeles',                 color: 'blanco'  },
  { month: 10, day: 4,  label: 'San Francisco de Asís',             color: 'blanco'  },
  { month: 11, day: 1,  label: 'Todos los Santos',                  color: 'blanco'  },
  { month: 11, day: 2,  label: 'Conmemoración de los Difuntos',     color: 'morado'  },
  { month: 12, day: 8,  label: 'Inmaculada Concepción',             color: 'blanco'  },
  { month: 12, day: 12, label: 'Nuestra Señora de Guadalupe',       color: 'blanco'  },
  { month: 12, day: 25, label: 'Natividad del Señor',               color: 'blanco'  },
  { month: 12, day: 26, label: 'San Esteban, Protomártir',          color: 'rojo'    },
  { month: 12, day: 28, label: 'Santos Inocentes',                  color: 'rojo'    },
];

// Santos del día (simplificado, días más relevantes)
const SANTOS: Array<{ month: number; day: number; name: string }> = [
  { month:1,  day:17, name:'San Antonio Abad' },
  { month:1,  day:20, name:'San Sebastián' },
  { month:1,  day:21, name:'Santa Inés' },
  { month:1,  day:28, name:'Santo Tomás de Aquino' },
  { month:2,  day:3,  name:'San Blas' },
  { month:2,  day:11, name:'Ntra. Sra. de Lourdes' },
  { month:2,  day:22, name:'Cátedra de San Pedro' },
  { month:3,  day:4,  name:'San Casimiro' },
  { month:3,  day:17, name:'San Patricio' },
  { month:4,  day:29, name:'Santa Catalina de Siena' },
  { month:5,  day:1,  name:'San José Obrero' },
  { month:5,  day:3,  name:'Santos Felipe y Santiago' },
  { month:5,  day:15, name:'San Isidro Labrador' },
  { month:5,  day:26, name:'San Felipe Neri' },
  { month:6,  day:3,  name:'San Carlos Lwanga' },
  { month:6,  day:11, name:'San Bernabé' },
  { month:7,  day:3,  name:'Santo Tomás Apóstol' },
  { month:7,  day:11, name:'San Benito' },
  { month:7,  day:22, name:'Santa María Magdalena' },
  { month:7,  day:26, name:'Santos Joaquín y Ana' },
  { month:8,  day:10, name:'San Lorenzo' },
  { month:8,  day:24, name:'San Bartolomé Apóstol' },
  { month:9,  day:3,  name:'San Gregorio Magno' },
  { month:9,  day:13, name:'San Juan Crisóstomo' },
  { month:9,  day:21, name:'San Mateo Apóstol' },
  { month:10, day:1,  name:'Santa Teresa del Niño Jesús' },
  { month:10, day:7,  name:'Ntra. Sra. del Rosario' },
  { month:10, day:15, name:'Santa Teresa de Ávila' },
  { month:10, day:18, name:'San Lucas Evangelista' },
  { month:10, day:28, name:'Santos Simón y Judas' },
  { month:11, day:11, name:'San Martín de Tours' },
  { month:11, day:22, name:'Santa Cecilia' },
  { month:11, day:30, name:'San Andrés Apóstol' },
  { month:12, day:3,  name:'San Francisco Javier' },
  { month:12, day:13, name:'Santa Lucía' },
];

const WEEKDAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const COLOR_LABELS: Record<LiturgicalColor, string> = {
  morado:   'Morado',
  blanco:   'Blanco',
  rojo:     'Rojo',
  verde:    'Verde',
  rosa:     'Rosa',
  dorado:   'Dorado',
};

const COLOR_HEX: Record<LiturgicalColor, string> = {
  morado:  '#7C3AED',
  blanco:  '#F5F0E8',
  rojo:    '#DC2626',
  verde:   '#16A34A',
  rosa:    '#EC4899',
  dorado:  '#C8A44D',
};

const SEASON_LABELS: Record<LiturgicalSeason, string> = {
  adviento:     'Adviento',
  navidad:      'Navidad',
  ordinario_i:  'Tiempo Ordinario',
  cuaresma:     'Cuaresma',
  triduo:       'Triduo Pascual',
  pascua:       'Tiempo de Pascua',
  pentecostes:  'Pentecostés',
  ordinario_ii: 'Tiempo Ordinario',
};

@Injectable({ providedIn: 'root' })
export class LiturgicalCalendarService {

  getDay(date: Date = new Date()): LiturgicalDay {
    const year  = date.getFullYear();
    const month = date.getMonth() + 1;
    const day   = date.getDate();

    // Fechas móviles
    const easter        = easterDate(year);
    const ashWednesday  = addDays(easter, -46);   // Miércoles de Ceniza
    const palmSunday    = addDays(easter, -7);
    const holyThursday  = addDays(easter, -3);
    const goodFriday    = addDays(easter, -2);
    const holySaturday  = addDays(easter, -1);
    const ascension     = addDays(easter, 39);    // Jueves, o domingo según conferencia
    const pentecost     = addDays(easter, 49);
    const trinityS      = addDays(easter, 56);
    const corpusChristi = addDays(easter, 60);    // Jueves (en España domingo +63)
    // Advent I: the fourth Sunday before Christmas (always between Nov 27 and Dec 3)
    const christmas = new Date(year, 11, 25);
    const advent1   = (() => {
      const dow = christmas.getDay();
      const sundayBeforeChristmas = addDays(christmas, -(dow === 0 ? 7 : dow));
      return addDays(sundayBeforeChristmas, -21);
    })();
    // Christ the King: last Sunday of Ordinary Time (week 34)
    const christKing    = addDays(advent1, -7);

    // Detectar tiempo
    let season: LiturgicalSeason;
    let weekNumber = 1;

    const epiphany      = new Date(year, 0, 6);
    const baptismLord   = addDays(epiphany, (7 - epiphany.getDay()) % 7 + 1); // lunes tras dom del Bautismo

    if (sameDay(date, goodFriday) || sameDay(date, holySaturday) || sameDay(date, holyThursday)) {
      season = 'triduo';
    } else if (isBetween(date, easter, addDays(pentecost, -1))) {
      season = 'pascua';
      weekNumber = Math.floor((date.getTime() - easter.getTime()) / (7 * 86400000)) + 1;
    } else if (sameDay(date, pentecost)) {
      season = 'pentecostes';
    } else if (isBetween(date, ashWednesday, addDays(holyThursday, -1))) {
      season = 'cuaresma';
      weekNumber = Math.floor((date.getTime() - ashWednesday.getTime()) / (7 * 86400000)) + 1;
    } else if (isBetween(date, advent1, addDays(christmas, -1))) {
      season = 'adviento';
      weekNumber = Math.floor((date.getTime() - advent1.getTime()) / (7 * 86400000)) + 1;
    } else if (isBetween(date, christmas, new Date(year, 11, 31))) {
      season = 'navidad';
    } else if (isBetween(date, new Date(year, 0, 1), addDays(baptismLord, -1))) {
      season = 'navidad';
    } else if (isBetween(date, baptismLord, addDays(ashWednesday, -1))) {
      season = 'ordinario_i';
      weekNumber = Math.floor((date.getTime() - baptismLord.getTime()) / (7 * 86400000)) + 2;
    } else {
      // ordinario_ii: entre Pentecostés y Adviento
      season = 'ordinario_ii';
      // Count back from Christ the King (week 34); liturgical weeks start on Sunday
      const weekSunday = addDays(date, -date.getDay());
      const weeksBefore = Math.round((christKing.getTime() - weekSunday.getTime()) / (7 * 86400000));
      weekNumber = 34 - weeksBefore;
    }

    // Color base según tiempo
    const seasonColor: Record<LiturgicalSeason, LiturgicalColor> = {
      adviento:     'morado',
      navidad:      'blanco',
      ordinario_i:  'verde',
      cuaresma:     'morado',
      triduo:       'rojo',
      pascua:       'blanco',
      pentecostes:  'rojo',
      ordinario_ii: 'verde',
    };

    // Rosa en la 3ª semana de Adviento (Gaudete) y 4ª de Cuaresma (Laetare)
    let color: LiturgicalColor = seasonColor[season];
    if (season === 'adviento'  && weekNumber === 3 && date.getDay() === 0) color = 'rosa';
    if (season === 'cuaresma'  && weekNumber === 4 && date.getDay() === 0) color = 'rosa';
    if (season === 'pentecostes') color = 'rojo';

    // Solemnidades móviles
    type MobileFeast = { date: Date; label: string; color: LiturgicalColor };
    const mobileFeasts: MobileFeast[] = [
      { date: ashWednesday,  label: 'Miércoles de Ceniza',       color: 'morado' },
      { date: palmSunday,    label: 'Domingo de Ramos',           color: 'rojo'   },
      { date: holyThursday,  label: 'Jueves Santo',               color: 'blanco' },
      { date: goodFriday,    label: 'Viernes Santo',              color: 'rojo'   },
      { date: holySaturday,  label: 'Sábado Santo',               color: 'morado' },
      { date: easter,        label: 'Domingo de Pascua',          color: 'blanco' },
      { date: ascension,     label: 'Ascensión del Señor',        color: 'blanco' },
      { date: pentecost,     label: 'Pentecostés',                color: 'rojo'   },
      { date: trinityS,      label: 'Santísima Trinidad',         color: 'blanco' },
      { date: corpusChristi, label: 'Corpus Christi',             color: 'blanco' },
      { date: christKing,    label: 'Cristo Rey',                 color: 'blanco' },
    ];

    let feastLabel: string | undefined;
    let isFeast = false;

    const mobileFeast = mobileFeasts.find(f => sameDay(f.date, date));
    if (mobileFeast) {
      feastLabel = mobileFeast.label;
      color = mobileFeast.color;
      isFeast = true;
    }

    // Fiestas fijas
    if (!isFeast) {
      const fixed = FIXED_FEASTS.find(f => f.month === month && f.day === day);
      if (fixed) {
        feastLabel = fixed.label;
        color = fixed.color;
        isFeast = true;
      }
    }

    // Santo del día
    const saintEntry = SANTOS.find(s => s.month === month && s.day === day);
    const saint = isFeast ? (feastLabel ?? '') : (saintEntry?.name ?? '');

    // Descripción corta
    let shortDesc = '';
    if (isFeast) {
      shortDesc = feastLabel ?? '';
    } else if (season === 'ordinario_i' || season === 'ordinario_ii') {
      shortDesc = `Semana ${weekNumber} del Tiempo Ordinario`;
    } else if (season === 'adviento') {
      shortDesc = `${weekNumber}ª semana de Adviento`;
    } else if (season === 'cuaresma') {
      shortDesc = `${weekNumber}ª semana de Cuaresma`;
    } else if (season === 'pascua') {
      shortDesc = `${weekNumber}ª semana de Pascua`;
    } else if (season === 'navidad') {
      shortDesc = 'Tiempo de Navidad';
    } else {
      shortDesc = SEASON_LABELS[season];
    }

    return {
      season,
      seasonLabel: SEASON_LABELS[season],
      weekNumber,
      weekday: WEEKDAYS[date.getDay()],
      color,
      colorLabel: COLOR_LABELS[color],
      colorHex:   COLOR_HEX[color],
      saint,
      isFeast,
      feastLabel,
      shortDesc,
    };
  }
}