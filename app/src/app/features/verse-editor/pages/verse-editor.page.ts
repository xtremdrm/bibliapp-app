import {
  AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild,
  computed, effect, inject, signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { IonContent, IonIcon, IonToast, IonToggle, IonSpinner } from '@ionic/angular/standalone';

import { VerseShareService } from '../../../core/services/verse-share.service';
import { ARTWORKS, artOfTheDay, artSrc, getArtwork } from '../../../shared/art/art-catalog';
import { EDITOR_PHOTOS, getPhoto, photoSrc } from '../../../shared/art/photo-catalog';
import {
  ACCENT_COLORS, EDITOR_FONTS, FONT_GROUPS, FORMATS, FormatId, LAYOUTS, LayoutId,
  QuoteStyle, SOLID_COLORS, TEXT_COLORS, VerseBackground, VerseImageStyle, isLight, presetStyle,
} from '../../../shared/verse-image/verse-styles';

// v3: the BibliApp mark is on by default (drawn above the verse).
const STORAGE_KEY = 'bibliapp.verseEditor.v3';

type EditorTab = 'estilo' | 'fondo' | 'letra' | 'texto' | 'formato';

@Component({
  standalone: true,
  selector: 'app-verse-editor',
  imports: [IonContent, IonIcon, IonToast, IonToggle, IonSpinner],
  templateUrl: './verse-editor.page.html',
  styleUrls: ['./verse-editor.page.scss'],
})
export class VerseEditorPage implements OnInit, AfterViewInit, OnDestroy {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private nav    = inject(NavController);
  private shareService = inject(VerseShareService);

  @ViewChild('preview') previewRef?: ElementRef<HTMLCanvasElement>;

  readonly tabs: { id: EditorTab; label: string }[] = [
    { id: 'estilo',  label: 'Estilo' },
    { id: 'fondo',   label: 'Fondo' },
    { id: 'letra',   label: 'Letra' },
    { id: 'texto',   label: 'Texto' },
    { id: 'formato', label: 'Formato' },
  ];
  readonly layouts = LAYOUTS;
  readonly artworks = ARTWORKS;
  readonly solids = SOLID_COLORS;
  readonly textColors = TEXT_COLORS;
  readonly accentColors = ACCENT_COLORS;
  readonly fontGroups = FONT_GROUPS.map(g => ({ group: g, fonts: EDITOR_FONTS.filter(f => f.group === g) }));
  readonly formats = (Object.keys(FORMATS) as FormatId[]).map(id => ({ id, ...FORMATS[id] }));
  readonly artSrc = artSrc;
  readonly photos = EDITOR_PHOTOS;
  readonly photoSrc = photoSrc;

  text = signal('');
  ref  = signal('');
  style = signal<VerseImageStyle>(this.loadStyle());
  tab = signal<EditorTab>('estilo');

  layoutThumbs = signal<Record<string, string>>({});
  busy = signal<'share' | 'save' | null>(null);
  toastOpen = signal(false);
  toastMessage = signal('');

  currentArt = computed(() => {
    const bg = this.style().bg;
    return bg.kind === 'art' ? getArtwork(bg.id) : undefined;
  });

  hasImage = computed(() => this.style().bg.kind !== 'solid');

  private drawToken = 0;
  private viewReady = false;
  private saveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const style = this.style();
      const data = { text: this.text(), ref: this.ref() };
      if (this.viewReady) this.redraw(data, style);
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.saveStyle(style), 300);
    });
  }

  ngOnInit(): void {
    const p = this.route.snapshot.queryParamMap;
    this.text.set((p.get('text') ?? '').trim());
    this.ref.set((p.get('ref') ?? '').trim());
    const photo = p.get('photo');
    if (photo && getPhoto(photo)) this.setPhoto(photo);
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.redraw({ text: this.text(), ref: this.ref() }, this.style());
    this.renderLayoutThumbs();
  }

  ngOnDestroy(): void {
    clearTimeout(this.saveTimer);
  }

  // Rendering

  private async redraw(data: { text: string; ref: string }, style: VerseImageStyle): Promise<void> {
    const canvas = this.previewRef?.nativeElement;
    if (!canvas) return;
    const token = ++this.drawToken;
    const off = document.createElement('canvas');
    await this.shareService.draw(off, data, style);
    if (token !== this.drawToken) return;
    canvas.width = off.width;
    canvas.height = off.height;
    canvas.getContext('2d')!.drawImage(off, 0, 0);
  }

  private async renderLayoutThumbs(): Promise<void> {
    const sample = { text: this.text() || 'En el principio existía el Verbo', ref: this.ref() || 'Juan 1, 1' };
    const thumbs: Record<string, string> = {};
    for (const l of LAYOUTS) {
      const s = { ...presetStyle(l.id, this.style()), format: 'square' as FormatId, showCredit: false, showMark: false };
      const c = document.createElement('canvas');
      await this.shareService.draw(c, sample, s);
      const small = document.createElement('canvas');
      small.width = 240;
      small.height = 240;
      small.getContext('2d')!.drawImage(c, 0, 0, 240, 240);
      thumbs[l.id] = small.toDataURL('image/jpeg', 0.85);
      this.layoutThumbs.set({ ...thumbs });
    }
  }

  // Edits

  patch(p: Partial<VerseImageStyle>): void {
    this.style.update(s => ({ ...s, ...p }));
  }

  setLayout(id: LayoutId): void {
    this.style.set(presetStyle(id, this.style()));
  }

  setArt(id: string): void {
    this.setImage({ kind: 'art', id });
  }

  setPhoto(id: string): void {
    this.setImage({ kind: 'photo', id });
  }

  isPhoto(id: string): boolean {
    const bg = this.style().bg;
    return bg.kind === 'photo' && bg.id === id;
  }

  private setImage(bg: VerseBackground): void {
    const s = this.style();
    const p: Partial<VerseImageStyle> = { bg };
    // Text over a painting reads best light on a dark wash.
    if (!isLight(s.textColor) && s.layout !== 'lamina') p.textColor = '#ede6d8';
    this.patch(p);
  }

  setSolid(color: string): void {
    const s = this.style();
    const p: Partial<VerseImageStyle> = { bg: { kind: 'solid', color } };
    const lightBg = isLight(color);
    if (lightBg && isLight(s.textColor)) { p.textColor = '#1a1a1a'; p.accentColor = '#b34a36'; }
    if (!lightBg && !isLight(s.textColor)) { p.textColor = '#ede6d8'; p.accentColor = '#c9a24e'; }
    this.patch(p);
  }

  isArt(id: string): boolean {
    const bg = this.style().bg;
    return bg.kind === 'art' && bg.id === id;
  }

  isSolid(color: string): boolean {
    const bg = this.style().bg;
    return bg.kind === 'solid' && bg.color === color;
  }

  onRange(key: 'scale' | 'lineHeight' | 'overlay', ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    this.patch({ [key]: v } as Partial<VerseImageStyle>);
  }

  onToggle(key: 'caps' | 'italic' | 'showRef' | 'showCredit' | 'showMark', ev: Event): void {
    this.patch({ [key]: (ev as CustomEvent).detail.checked } as Partial<VerseImageStyle>);
  }

  setQuotes(q: QuoteStyle): void { this.patch({ quotes: q }); }

  onText(ev: Event): void { this.text.set((ev.target as HTMLTextAreaElement).value); }
  onRef(ev: Event): void { this.ref.set((ev.target as HTMLInputElement).value); }

  reset(): void {
    this.style.set(presetStyle(this.style().layout, this.style()));
  }

  // Output

  // The preview canvas already holds the exact image. Reading it synchronously keeps the
  // tap's user gesture alive, which Safari needs to open the share sheet.
  private previewDataUrl(): string | null {
    const c = this.previewRef?.nativeElement;
    return c && c.width > 0 ? c.toDataURL('image/jpeg', 0.93) : null;
  }

  async share(): Promise<void> {
    if (this.busy() || !this.text()) return;
    const dataUrl = this.previewDataUrl();
    if (!dataUrl) return;
    this.busy.set('share');
    try {
      const r = await this.shareService.shareImage(dataUrl, { text: this.text(), ref: this.ref() });
      if (r === 'copied') this.showToast('Texto copiado');
      if (r === 'downloaded') this.showToast('Imagen descargada');
    } finally {
      this.busy.set(null);
    }
  }

  async save(): Promise<void> {
    if (this.busy() || !this.text()) return;
    const dataUrl = this.previewDataUrl();
    if (!dataUrl) return;
    this.busy.set('save');
    try {
      const r = await this.shareService.saveImage(dataUrl, { text: this.text(), ref: this.ref() });
      const msg: Record<string, string> = {
        saved: 'Guardada en Documentos/BibliApp',
        downloaded: 'Imagen descargada',
        error: 'No se pudo guardar',
      };
      if (msg[r]) this.showToast(msg[r]);
    } finally {
      this.busy.set(null);
    }
  }

  close(): void {
    if (window.history.length > 1) this.nav.back();
    else this.router.navigateByUrl('/tabs/home');
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    this.toastOpen.set(true);
  }

  // Persistence

  private loadStyle(): VerseImageStyle {
    const fallback = presetStyle('clasico', {
      ...presetStyle('clasico'),
      bg: { kind: 'art', id: artOfTheDay().id },
    });
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const saved = JSON.parse(raw) as Partial<VerseImageStyle>;
      const merged = { ...fallback, ...saved } as VerseImageStyle;
      if (merged.bg?.kind === 'art' && !getArtwork(merged.bg.id)) merged.bg = fallback.bg;
      if (merged.bg?.kind === 'photo' && !getPhoto(merged.bg.id)) merged.bg = fallback.bg;
      if (!FORMATS[merged.format]) merged.format = 'square';
      return merged;
    } catch {
      return fallback;
    }
  }

  private saveStyle(style: VerseImageStyle): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(style)); } catch {}
  }
}
