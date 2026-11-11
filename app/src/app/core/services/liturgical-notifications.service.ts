import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications';

// Días de precepto fijos (fuera de domingos)
const PRECEPTOS_FIJOS: { month: number; day: number; label: string }[] = [
  { month:  1, day:  1, label: 'Santa María, Madre de Dios' },
  { month:  1, day:  6, label: 'Epifanía del Señor'          },
  { month:  8, day: 15, label: 'Asunción de María'           },
  { month: 11, day:  1, label: 'Todos los Santos'            },
  { month: 12, day:  8, label: 'Inmaculada Concepción'       },
  { month: 12, day: 25, label: 'Natividad del Señor'         },
];

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

const ENABLED_KEY  = 'bibliapp.notif.enabled';
const CHANNEL_ID   = 'liturgical';
const DAYS_AHEAD   = 365;

@Injectable({ providedIn: 'root' })
export class LiturgicalNotificationsService {

  isEnabled(): boolean {
    return localStorage.getItem(ENABLED_KEY) === 'true';
  }

  async enable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const { display } = await LocalNotifications.requestPermissions();
      if (display !== 'granted') return false;
      await this.createChannel();
      await this.scheduleAll();
      return true;
    } catch {
      return false;
    }
  }

  async disable(): Promise<void> {
    localStorage.setItem(ENABLED_KEY, 'false');
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { notifications } = await LocalNotifications.getPending();
      if (notifications.length) {
        await LocalNotifications.cancel({ notifications });
      }
    } catch {}
  }

  private async createChannel(): Promise<void> {
    try {
      await LocalNotifications.createChannel({
        id:          CHANNEL_ID,
        name:        'Calendario Litúrgico',
        description: 'Recordatorios de días de precepto y domingos',
        importance:  3,
        visibility:  1,
        sound:       'default',
        vibration:   true,
      });
    } catch {}
  }

  private async scheduleAll(): Promise<void> {
    try {
      const { notifications } = await LocalNotifications.getPending();
      if (notifications.length) {
        await LocalNotifications.cancel({ notifications });
      }
    } catch {}

    const notifications = this.buildNotifications();
    if (notifications.length) {
      await LocalNotifications.schedule({ notifications });
    }
    localStorage.setItem(ENABLED_KEY, 'true');
  }

  private buildNotifications(): LocalNotificationSchema[] {
    const result: LocalNotificationSchema[] = [];
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let id = 1;

    for (let offset = 0; offset <= DAYS_AHEAD; offset++) {
      const date    = addD(today, offset);
      const month   = date.getMonth() + 1;
      const day     = date.getDate();
      const year    = date.getFullYear();
      const isSun   = date.getDay() === 0;
      const notifyAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0, 0);

      if (notifyAt <= now) continue;

      const fixedP = PRECEPTOS_FIJOS.find(p => p.month === month && p.day === day);

      const e = easter(year);
      let mobileLabel: string | null = null;
      if (sameD(date, e))            mobileLabel = 'Domingo de Pascua';
      else if (sameD(date, addD(e, 39))) mobileLabel = 'Ascensión del Señor';
      else if (sameD(date, addD(e, 49))) mobileLabel = 'Pentecostés';
      else if (sameD(date, addD(e, 60))) mobileLabel = 'Corpus Christi';

      if (fixedP || mobileLabel) {
        const label = fixedP?.label ?? mobileLabel!;
        result.push({
          id: id++,
          title: 'Día de Precepto',
          body:  `Hoy es ${label}. Recuerda celebrar la Eucaristía.`,
          schedule: { at: notifyAt, allowWhileIdle: true },
          channelId: CHANNEL_ID,
        });
      } else if (isSun) {
        result.push({
          id: id++,
          title: 'Domingo',
          body:  'Hoy es domingo. Recuerda celebrar la Santa Misa.',
          schedule: { at: notifyAt, allowWhileIdle: true },
          channelId: CHANNEL_ID,
        });
      }
    }

    return result;
  }
}
