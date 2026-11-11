import { Component, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonIcon,
} from '@ionic/angular/standalone';
import { CrossIconComponent } from '../../../shared/ui/cross-icon.component';
import { artSrc, getArtwork } from '../../../shared/art/art-catalog';

export type MysteryType = 'gozosos' | 'luminosos' | 'dolorosos' | 'gloriosos';

// Sunday first, matching Date.getDay()
const MYSTERY_BY_DAY: MysteryType[] = ['gloriosos', 'gozosos', 'dolorosos', 'gloriosos', 'luminosos', 'dolorosos', 'gozosos'];

export interface RosaryBead {
  index:    number;
  type:     'cross' | 'our-father' | 'hail-mary' | 'glory';
  label:    string;
  prayer:   string;
  mystery?: string;
}

const MYSTERIES: Record<MysteryType, string[]> = {
  gozosos:   ['La Anunciación del Ángel a María','La Visitación de María a Isabel','El Nacimiento de Jesús','La Presentación de Jesús en el Templo','El Niño Jesús hallado en el Templo'],
  luminosos: ['El Bautismo de Jesús en el Jordán','La autorrevelación de Jesús en las bodas de Caná','El anuncio del Reino de Dios invitando a la conversión','La Transfiguración del Señor','La institución de la Eucaristía'],
  dolorosos: ['La Oración de Jesús en el Huerto','La Flagelación de Jesús','La Coronación de Espinas','Jesús con la Cruz a cuestas','La Crucifixión y Muerte de Jesús'],
  gloriosos: ['La Resurrección de Jesús','La Ascensión de Jesús al Cielo','La Venida del Espíritu Santo','La Asunción de María al Cielo','La Coronación de María Reina del Universo'],
};

const P = {
  creed:  `Yo creo en Dios, Padre Todopoderoso, Creador del Cielo y de la Tierra, y en Jesucristo, Su único Hijo, Nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios, Padre Todopoderoso. Desde allí ha de venir a juzgar a los vivos y a los muertos. Creo en el Espíritu Santo, en la santa Iglesia Católica, en la Comunión de los Santos, en el perdón de los pecados, en la resurrección de la carne y en la vida eterna. Amén.`,
  father: `Padre Nuestro, que estás en el Cielo, santificado sea Tu Nombre. Venga Tu Reino. Hágase Tu Voluntad en la Tierra como en el Cielo. Danos hoy nuestro pan de cada día. Perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden. No nos dejes caer en tentación y líbranos del mal. Amén.`,
  mary:   `Dios te salve, María, llena eres de gracia, el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús.\nSanta María, Madre de Dios, ruega por nosotros pecadores, ahora y en la hora de nuestra muerte. Amén.`,
  glory:  `Gloria al Padre, al Hijo y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.`,
  fatima: `Oh Jesús mío, perdona nuestros pecados, presérvanos del fuego del infierno, lleva al Cielo a todas las almas, especialmente a las más necesitadas de Tu Misericordia.`,
  salve:  `Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra. Dios te salve. A Ti clamamos los desterrados hijos de Eva; a Ti suspiramos gimiendo y llorando en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro muéstranos a Jesús, fruto bendito de tu vientre. Oh clementísima, oh piadosa, oh dulce Virgen María. Ruega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de Jesucristo. Amén.`,
};

function buildBeads(m: MysteryType): RosaryBead[] {
  const out: RosaryBead[] = [];
  let i = 0;
  const add = (b: Omit<RosaryBead, 'index'>) => out.push({ ...b, index: i++ });

  add({ type: 'cross',      label: 'Cruz — Credo de los Apóstoles', prayer: P.creed });
  add({ type: 'our-father', label: 'Padre Nuestro',                 prayer: P.father });
  for (let j = 1; j <= 3; j++)
    add({ type: 'hail-mary', label: `Ave María ${j}/3`, prayer: P.mary });
  add({ type: 'glory', label: 'Gloria', prayer: P.glory });

  for (let d = 0; d < 5; d++) {
    const ms = MYSTERIES[m][d];
    add({ type: 'our-father', label: `${d+1}.º Misterio — Padre Nuestro`, prayer: P.father, mystery: ms });
    for (let j = 1; j <= 10; j++)
      add({ type: 'hail-mary', label: `Ave María ${j}/10`, prayer: P.mary, mystery: ms });
    add({ type: 'glory', label: 'Gloria y Oración de Fátima', prayer: P.glory + '\n\n' + P.fatima, mystery: ms });
  }

  add({ type: 'our-father', label: 'Salve Regina', prayer: P.salve });
  return out;
}

// Tamaño de cuentas (debe coincidir con el CSS)
// Ave María / Glory / Cruz normal: 32px
// Padre Nuestro: 38px (ligeramente mayor)
// Activa: +14px más
// Gap entre cuentas: 8px

const BEAD_NORMAL     = 32;
const BEAD_OUR_FATHER = 38;
const BEAD_ACTIVE_ADD = 14;
const BEAD_GAP        = 8;

function beadWidth(type: RosaryBead['type'], active: boolean): number {
  const base = type === 'our-father' ? BEAD_OUR_FATHER : BEAD_NORMAL;
  return active ? base + BEAD_ACTIVE_ADD : base;
}

@Component({
  standalone: true,
  selector: 'app-rosary',
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonIcon,
    CrossIconComponent,
  ],
  templateUrl: './rosary.page.html',
  styleUrls: ['./rosary.page.scss'],
})
export class RosaryPage implements OnInit, AfterViewInit {

  @ViewChild('beadsTrack') trackRef?: ElementRef<HTMLElement>;

  mysteryType = signal<MysteryType>('gozosos');
  beads       = signal<RosaryBead[]>([]);
  current     = signal(0);
  slideDir    = signal<-1 | 0 | 1>(0);
  animating   = false;

  totalBeads  = computed(() => this.beads().length);
  currentBead = computed(() => this.beads()[this.current()] ?? null);
  progress    = computed(() => ((this.current() + 1) / Math.max(1, this.totalBeads())) * 100);
  isFinished  = computed(() => this.current() === this.totalBeads() - 1);

  readonly MYSTERY_LABELS: Record<MysteryType, string> = {
    gozosos:   'Misterios gozosos',
    luminosos: 'Misterios luminosos',
    dolorosos: 'Misterios dolorosos',
    gloriosos: 'Misterios gloriosos',
  };
  readonly BEAD_TYPE_LABELS: Record<string, string> = {
    'cross': 'Cruz', 'our-father': 'Padre Nuestro', 'hail-mary': 'Ave María', 'glory': 'Gloria',
  };
  readonly art    = getArtwork('murillo-virgen-nino');
  readonly artUrl = artSrc('murillo-virgen-nino');

  constructor(private router: Router) {}

  ngOnInit()       { this.loadMystery(MYSTERY_BY_DAY[new Date().getDay()]); }
  ngAfterViewInit(){ setTimeout(() => this.centerBead(0, false), 80); }

  loadMystery(type: MysteryType) {
    this.mysteryType.set(type);
    this.beads.set(buildBeads(type));
    this.current.set(0);
    this.slideDir.set(0);
    setTimeout(() => this.centerBead(0, false), 80);
  }

  setMystery(t: MysteryType) {
    if (this.mysteryType() === t) return;
    this.loadMystery(t);
  }

  async next() {
    if (this.animating || this.isFinished()) return;
    await this.doSlide(1);
    const next = this.current() + 1;
    this.current.set(next);
    this.slideDir.set(0);
    this.animating = false;
    requestAnimationFrame(() => this.centerBead(next, true));
  }

  async prev() {
    if (this.animating || this.current() <= 0) return;
    await this.doSlide(-1);
    const prev = this.current() - 1;
    this.current.set(prev);
    this.slideDir.set(0);
    this.animating = false;
    requestAnimationFrame(() => this.centerBead(prev, true));
  }

  reset() {
    this.current.set(0);
    this.slideDir.set(0);
    requestAnimationFrame(() => this.centerBead(0, false));
  }

  private async doSlide(dir: -1 | 1): Promise<void> {
    this.animating = true;
    this.slideDir.set(dir);
    return new Promise(res => setTimeout(res, 260));
  }

  // Centers bead `idx` using actual DOM positions; accounts for CSS padding correctly
  centerBead(idx: number, animate: boolean) {
    const track = this.trackRef?.nativeElement;
    if (!track) return;

    const beadEls = track.querySelectorAll<HTMLElement>('.bead-item');
    const bead    = beadEls[idx];
    if (!bead) return;

    const trackW    = track.clientWidth;
    const trackRect = track.getBoundingClientRect();
    const beadRect  = bead.getBoundingClientRect();

    // Bead center expressed in scroll-content coordinates
    const beadCenterInContent =
      track.scrollLeft + (beadRect.left - trackRect.left) + beadRect.width / 2;

    const target = beadCenterInContent - trackW / 2;
    track.scrollTo({ left: Math.max(0, target), behavior: animate ? 'smooth' : 'auto' });
  }

  beadClass(b: RosaryBead, i: number): Record<string, boolean> {
    const cur = this.current();
    return {
      'bead-active':  i === cur,
      'bead-done':    i < cur,
      'bead-pending': i > cur,
      'bead-near-l':  i === cur - 1,
      'bead-near-r':  i === cur + 1,
      [`type-${b.type}`]: true,
    };
  }

  // Swipe táctil
  private touchStartX = 0;
  onTouchStart(ev: TouchEvent) { this.touchStartX = ev.touches[0].clientX; }
  onTouchEnd(ev: TouchEvent) {
    const dx = ev.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(dx) < 50) return;
    dx < 0 ? this.next() : this.prev();
  }
}