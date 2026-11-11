import { Component, OnInit, inject } from '@angular/core';
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonToolbar, IonTitle,
  IonIcon, IonToast,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline, notificationsOffOutline } from 'ionicons/icons';

import { LiturgicalCalendarService, LiturgicalDay } from '../../../core/services/liturgical-calendar.service';
import { Capacitor } from '@capacitor/core';
import { LiturgicalNotificationsService } from '../../../core/services/liturgical-notifications.service';

// Types
interface CalCell {
  date:       Date | null;
  dayNum:     number;
  isToday:    boolean;
  isSunday:   boolean;
  isPrecepto: boolean;
  feastLabel?: string;
  colorHex?:  string;
}

interface FeastRow {
  dayNum:     number;
  weekday:    string;
  label:      string;
  isPrecepto: boolean;
  colorHex:   string;
}

// Data
const PRECEPTOS_FIJOS: { month: number; day: number }[] = [
  { month:  1, day:  1 },
  { month:  1, day:  6 },
  { month:  8, day: 15 },
  { month: 11, day:  1 },
  { month: 12, day:  8 },
  { month: 12, day: 25 },
];

const MONTHS   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const WEEKDAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

// Helpers
function easter(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100,
        d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451),
        mo = Math.floor((h + l - 7 * m + 114) / 31),
        dy = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, dy);
}

function addD(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function sameD(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate();
}

// Component
@Component({
  standalone: true,
  selector:   'app-calendar',
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonIcon, IonToast,
  ],
  templateUrl: './calendar.page.html',
  styleUrls:   ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {
  private liturgical = inject(LiturgicalCalendarService);
  private notifSvc   = inject(LiturgicalNotificationsService);

  readonly headers = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  year  = new Date().getFullYear();
  month = new Date().getMonth();

  cells:  CalCell[]  = [];
  feasts: FeastRow[] = [];

  notifEnabled = false;
  /** Local notifications only exist in the native app. */
  readonly canNotify = Capacitor.isNativePlatform();
  selectedCell: CalCell | null = null;
  toastOpen    = false;
  toastMsg     = '';

  get monthLabel(): string { return `${MONTHS[this.month]} ${this.year}`; }

  get monthName(): string { return MONTHS[this.month].toLowerCase(); }

  /** Liturgical data for the selected day (detail block). */
  get selectedDay(): LiturgicalDay | null {
    return this.selectedCell?.date ? this.liturgical.getDay(this.selectedCell.date) : null;
  }

  isSelected(c: CalCell): boolean {
    return !!c.date && this.selectedCell?.date?.getTime() === c.date.getTime();
  }

  /** "Viernes, 30 de octubre" */
  dateOf(c: CalCell): string {
    return c.date ? `${WEEKDAYS[c.date.getDay()]}, ${c.dayNum} de ${MONTHS[c.date.getMonth()].toLowerCase()}` : '';
  }

  dayAria(c: CalCell): string {
    return this.dateOf(c) + (c.feastLabel ? `. ${c.feastLabel}` : '');
  }

  get seasonInfo(): { label: string; hex: string } {
    const d = this.liturgical.getDay(new Date(this.year, this.month, 15));
    return { label: d.seasonLabel, hex: d.colorHex };
  }

  constructor() {
    addIcons({ notificationsOutline, notificationsOffOutline });
  }

  ngOnInit(): void {
    this.notifEnabled = this.notifSvc.isEnabled();
    this.build();
  }

  prev(): void {
    this.selectedCell = null;
    if (this.month === 0) { this.month = 11; this.year--; }
    else this.month--;
    this.build();
  }

  next(): void {
    this.selectedCell = null;
    if (this.month === 11) { this.month = 0; this.year++; }
    else this.month++;
    this.build();
  }

  async toggleNotif(): Promise<void> {
    this.notifEnabled = !this.notifEnabled;
    if (this.notifEnabled) {
      const ok = await this.notifSvc.enable();
      if (!ok) {
        this.notifEnabled = false;
        this.toast('No se pudieron activar los recordatorios');
      } else {
        this.toast('Recordatorios activados para los próximos 12 meses');
      }
    } else {
      await this.notifSvc.disable();
      this.toast('Recordatorios desactivados');
    }
  }

  onDayClick(c: CalCell): void {
    if (!c.date) return;
    this.selectedCell = this.selectedCell?.date?.getTime() === c.date.getTime() ? null : c;
  }

  weekdayOf(d: Date | null): string {
    return d ? WEEKDAYS[d.getDay()] : '';
  }

  private build(): void {
    const today  = new Date();
    const y = this.year, m = this.month;
    const first  = new Date(y, m, 1);
    const days   = new Date(y, m + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7; // Monday-first

    const e      = easter(y);
    const mobile = this.getMobile(y, e);

    this.cells  = [];
    this.feasts = [];

    for (let i = 0; i < offset; i++) {
      this.cells.push({ date: null, dayNum: 0, isToday: false, isSunday: false, isPrecepto: false });
    }

    for (let d = 1; d <= days; d++) {
      const date     = new Date(y, m, d);
      const isToday  = sameD(date, today);
      const isSunday = date.getDay() === 0;
      const mon      = date.getMonth() + 1;

      const fixedP = PRECEPTOS_FIJOS.some(p => p.month === mon && p.day === d);
      const mob    = mobile.find(f => sameD(f.date, date));
      const litDay = this.liturgical.getDay(date);

      const feastLabel  = litDay.feastLabel ?? mob?.label;
      const isPrecepto  = fixedP || (mob?.isPrecepto ?? false);

      this.cells.push({
        date, dayNum: d, isToday, isSunday, isPrecepto,
        feastLabel,
        colorHex: feastLabel ? litDay.colorHex : undefined,
      });

      if (feastLabel) {
        this.feasts.push({
          dayNum:     d,
          weekday:    WEEKDAYS[date.getDay()],
          label:      feastLabel,
          isPrecepto: isPrecepto || isSunday,
          colorHex:   litDay.colorHex,
        });
      }
    }
  }

  private getMobile(y: number, e: Date): { date: Date; label: string; isPrecepto: boolean }[] {
    return [
      { date: addD(e, -46), label: 'Miércoles de Ceniza',     isPrecepto: false },
      { date: addD(e, -7),  label: 'Domingo de Ramos',         isPrecepto: true  },
      { date: addD(e, -3),  label: 'Jueves Santo',             isPrecepto: false },
      { date: addD(e, -2),  label: 'Viernes Santo',            isPrecepto: false },
      { date: addD(e, -1),  label: 'Sábado Santo',             isPrecepto: false },
      { date: e,            label: 'Domingo de Pascua',        isPrecepto: true  },
      { date: addD(e,  39), label: 'Ascensión del Señor',      isPrecepto: true  },
      { date: addD(e,  49), label: 'Pentecostés',              isPrecepto: true  },
      { date: addD(e,  56), label: 'Santísima Trinidad',       isPrecepto: false },
      { date: addD(e,  60), label: 'Corpus Christi',           isPrecepto: true  },
      { date: addD(e,  63), label: 'Sagrado Corazón de Jesús', isPrecepto: false },
    ];
  }

  private toast(msg: string): void { this.toastMsg = msg; this.toastOpen = true; }
}
