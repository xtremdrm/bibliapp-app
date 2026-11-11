// Renders verse images on a canvas. The same draw() feeds the editor preview and the export,
// so what the user sees is exactly what gets saved or shared.

import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

import { artSrc, getArtwork } from '../../shared/art/art-catalog';
import { getPhoto, photoSrc } from '../../shared/art/photo-catalog';
import {
  FORMATS, VerseImageStyle, getFont, isLight, presetStyle,
} from '../../shared/verse-image/verse-styles';

export interface VerseShareData {
  text: string;
  ref:  string;
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'downloaded';
export type SaveResult = 'saved' | 'shared' | 'downloaded' | 'cancelled' | 'error';

interface Box { x: number; y: number; w: number; h: number; }

@Injectable({ providedIn: 'root' })
export class VerseShareService {
  private images = new Map<string, Promise<HTMLImageElement>>();

  // Render

  async draw(canvas: HTMLCanvasElement, data: VerseShareData, style: VerseImageStyle): Promise<void> {
    const { w: W, h: H } = FORMATS[style.format];
    const font = getFont(style.fontId);
    const refFamily = 'Marcellus';
    const italic = style.italic && font.italic;
    const textFont = (px: number) => `${italic ? 'italic ' : ''}${font.weight} ${px}px "${font.family}"`;
    const refFont = (px: number) => `400 ${px}px "${refFamily}"`;
    const smallFont = (px: number) => `400 ${px}px "Marcellus"`;

    // Fonts must be ready before measuring, otherwise the fallback font is measured.
    await Promise.all([
      document.fonts.load(textFont(40), data.text.slice(0, 40) || 'A'),
      document.fonts.load(refFont(30), 'A'),
      document.fonts.load(smallFont(20), 'A'),
      document.fonts.load('40px "Marcellus"', 'B'),
    ]).catch(() => undefined);

    const art = style.bg.kind === 'art' ? getArtwork(style.bg.id) : undefined;
    const photo = style.bg.kind === 'photo' ? getPhoto(style.bg.id) : undefined;
    const imgSrc = art ? artSrc(art.id) : photo ? photoSrc(photo.id) : undefined;
    const focus = art?.focus ?? photo?.focus;
    const img = imgSrc ? await this.loadImage(imgSrc).catch(() => undefined) : undefined;

    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    const lightText = isLight(style.textColor);
    const pad = Math.round(W * 0.09);
    // The app mark sits above the verse; only the painting credit uses the footer.
    const footer = style.showCredit && style.bg.kind === 'art';

    // Background
    let area: Box = { x: pad, y: pad, w: W - 2 * pad, h: H - 2 * pad };
    let plate: Box | undefined;

    if (style.layout === 'lamina' && img) {
      ctx.fillStyle = lightText ? '#121212' : '#ede6d8';
      ctx.fillRect(0, 0, W, H);
      const plateH = Math.round(H * (style.format === 'story' ? 0.5 : style.format === 'portrait' ? 0.5 : 0.46));
      plate = { x: pad, y: pad, w: W - 2 * pad, h: plateH };
      this.drawCover(ctx, img, plate, focus);
      const top = plate.y + plate.h + pad * 0.6;
      area = { x: pad, y: top, w: W - 2 * pad, h: H - top - pad * 0.8 };
    } else {
      if (img) {
        this.drawCover(ctx, img, { x: 0, y: 0, w: W, h: H }, focus);
        const o = Math.max(0, Math.min(90, style.overlay)) / 100;
        ctx.fillStyle = lightText ? `rgba(12,10,9,${o})` : `rgba(240,234,222,${o})`;
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = style.bg.kind === 'solid' ? style.bg.color : '#121212';
        ctx.fillRect(0, 0, W, H);
      }
      if (footer) area.h -= Math.round(pad * 0.5);
    }

    if (style.layout === 'estampa') {
      const m = Math.round(W * 0.045);
      ctx.strokeStyle = style.accentColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(m + 14, m + 14, W - 2 * m - 28, H - 2 * m - 28);
      const inner = Math.round(pad * 1.3);
      area = { x: inner, y: inner, w: W - 2 * inner, h: H - 2 * inner - (footer ? pad * 0.3 : 0) };
    }

    // Text block
    const dropCap = style.layout === 'misal' && style.align === 'left' && /^\p{L}/u.test(data.text.trim());
    let body = data.text.trim().replace(/\s+/g, ' ');
    if (style.caps) body = body.toUpperCase();
    if (!dropCap) {
      if (style.quotes === 'curly') body = `“${body}”`;
      if (style.quotes === 'angle') body = `«${body}»`;
    }

    const len = body.length;
    const base = len <= 80 ? 0.075 : len <= 160 ? 0.062 : len <= 260 ? 0.052 : len <= 400 ? 0.044 : 0.037;
    let size = Math.round(W * base * style.scale * (style.format === 'story' ? 1.06 : 1));

    const ornamentH = (s: number) => (style.layout === 'estampa' ? s * 1.6 : 0);
    const refSize = (s: number) => Math.max(34, Math.round(s * 0.56));
    const markSize = (s: number) => Math.max(26, Math.round(s * 0.44));
    const markH = (s: number) => (style.showMark ? markSize(s) + s * 0.9 : 0);
    const refGap = (s: number) => (style.showRef ? s * 1.0 : 0);
    const spacing = (s: number) => (style.caps ? s * 0.04 : 0);

    let lines: string[] = [];
    let capText = '';
    let capW = 0;
    let lh = 0;

    for (let guard = 0; guard < 40; guard++) {
      lh = size * style.lineHeight;
      ctx.font = textFont(size);
      this.setSpacing(ctx, spacing(size));
      let rest = body;
      if (dropCap) {
        capText = body.charAt(0);
        rest = body.slice(1);
        ctx.font = textFont(this.capSize(size, style.lineHeight));
        capW = ctx.measureText(capText).width + size * 0.22;
        ctx.font = textFont(size);
      }
      lines = this.wrap(ctx, rest, i => (dropCap && i < 2 ? area.w - capW : area.w));
      const total = markH(size) + ornamentH(size) + lines.length * lh + (style.showRef ? refGap(size) + refSize(size) : 0);
      if (total <= area.h || size <= 18) break;
      size = Math.max(18, Math.round(size * 0.94));
    }

    const total = markH(size) + ornamentH(size) + lines.length * lh + (style.showRef ? refGap(size) + refSize(size) : 0);
    const top = style.layout === 'editorial'
      ? area.y + area.h - total
      : area.y + Math.max(0, (area.h - total) / 2);
    const cx = style.align === 'center' ? area.x + area.w / 2 : area.x;

    // Text and labels over a photo get a soft shadow so they read on any image.
    const shadow = (on: boolean) => {
      ctx.shadowColor = on && img && !plate && lightText ? 'rgba(0,0,0,0.55)' : 'transparent';
      ctx.shadowBlur = on ? Math.round(W * 0.012) : 0;
    };

    // App mark above the verse.
    if (style.showMark) {
      const ms = markSize(size);
      ctx.font = `400 ${ms}px "Marcellus"`;
      this.setSpacing(ctx, ms * 0.32);
      ctx.fillStyle = style.accentColor;
      ctx.textAlign = style.align === 'center' ? 'center' : 'left';
      shadow(true);
      ctx.fillText('BIBLIAPP', cx, top + ms);
      shadow(false);
      this.setSpacing(ctx, 0);
    }

    // Ornament (estampa): a thin cross above the text.
    if (style.layout === 'estampa') {
      const ch = size * 1.0;
      const ox = area.x + area.w / 2;
      const oy = top + markH(size) + size * 0.05;
      ctx.strokeStyle = style.accentColor;
      ctx.lineWidth = Math.max(2, size * 0.05);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, oy + ch);
      ctx.moveTo(ox - ch * 0.34, oy + ch * 0.3);
      ctx.lineTo(ox + ch * 0.34, oy + ch * 0.3);
      ctx.stroke();
    }

    // Lines
    const textTop = top + markH(size) + ornamentH(size);
    ctx.fillStyle = style.textColor;
    ctx.textBaseline = 'alphabetic';
    ctx.font = textFont(size);
    this.setSpacing(ctx, spacing(size));
    const baselineOf = (i: number) => textTop + i * lh + lh / 2 + size * 0.32;
    lines.forEach((line, i) => {
      const indent = dropCap && i < 2 ? capW : 0;
      ctx.textAlign = style.align === 'center' ? 'center' : 'left';
      ctx.fillText(line, cx + indent, baselineOf(i));
    });

    if (dropCap) {
      ctx.fillStyle = style.accentColor;
      ctx.textAlign = 'left';
      ctx.font = textFont(this.capSize(size, style.lineHeight));
      this.setSpacing(ctx, 0);
      ctx.fillText(capText, area.x, baselineOf(Math.min(1, lines.length - 1)));
    }

    // Reference
    if (style.showRef && data.ref) {
      const rs = refSize(size);
      let ry = textTop + lines.length * lh + refGap(size);
      if (style.layout === 'clasico' || style.layout === 'editorial' || style.layout === 'misal') {
        const ruleW = style.layout === 'editorial' ? size * 2.2 : size * 1.1;
        const ruleY = ry - refGap(size) * 0.45;
        ctx.strokeStyle = style.accentColor;
        ctx.lineWidth = style.layout === 'editorial' ? 3 : 2;
        ctx.beginPath();
        const rx0 = style.align === 'center' ? cx - ruleW / 2 : area.x;
        ctx.moveTo(rx0, ruleY);
        ctx.lineTo(rx0 + ruleW, ruleY);
        ctx.stroke();
        ry += rs * 0.25;
      }
      ctx.font = refFont(rs);
      this.setSpacing(ctx, rs * 0.08);
      ctx.fillStyle = style.textColor;
      ctx.textAlign = style.align === 'center' ? 'center' : 'left';
      shadow(true);
      ctx.fillText(data.ref, cx, ry + rs * 0.8);
      shadow(false);
    }

    // Footer: painting credit and app mark
    this.setSpacing(ctx, 0);
    const fs = Math.round(W * 0.02);
    ctx.font = smallFont(fs);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = style.textColor;
    if (style.showCredit && art) {
      const credit = `${art.artist}, ${art.title}`;
      if (plate) {
        ctx.textAlign = 'left';
        ctx.fillText(credit, plate.x, plate.y + plate.h + fs * 1.6);
      } else {
        ctx.textAlign = style.align === 'center' ? 'center' : 'left';
        const x = ctx.textAlign === 'center' ? W / 2 : pad;
        ctx.fillText(credit, x, H - pad * 0.55);
      }
    }
    ctx.globalAlpha = 1;
  }

  async render(data: VerseShareData, style: VerseImageStyle = presetStyle('clasico')): Promise<string> {
    const canvas = document.createElement('canvas');
    await this.draw(canvas, data, style);
    return canvas.toDataURL('image/jpeg', 0.93);
  }

  // Share / save

  async share(data: VerseShareData, style?: VerseImageStyle): Promise<ShareResult> {
    return this.shareImage(await this.render(data, style), data);
  }

  /**
   * Shares an already rendered image. On the web, call it straight from the tap handler:
   * Safari only opens the share sheet while the user gesture is still active.
   */
  async shareImage(dataUrl: string, data: VerseShareData): Promise<ShareResult> {
    const fileName = this.buildFileName(data.ref);
    if (!Capacitor.isNativePlatform()) {
      const file = this.dataUrlToFile(dataUrl, fileName);
      const r = await this.webShareFile(file, data.ref);
      if (r) return r;
      this.browserDownload(file);
      return 'downloaded';
    }
    try {
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: dataUrl.split(',')[1],
        directory: Directory.Cache,
      });
      await Share.share({ title: data.ref, files: [saved.uri] });
      await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
      return 'shared';
    } catch (e: any) {
      const msg = String(e?.message ?? e?.errorMessage ?? '').toLowerCase();
      if (msg.includes('cancel')) return 'cancelled';
      await this.copy(`${data.text}\n\n${data.ref}`);
      return 'copied';
    }
  }

  /** Shares the verse as plain text; falls back to the clipboard on the web. */
  async shareText(data: VerseShareData): Promise<'shared' | 'copied' | 'cancelled'> {
    const text = `${data.text}\n\n${data.ref}`;
    try {
      await Share.share({ text });
      return 'shared';
    } catch (e: any) {
      const msg = String(e?.message ?? e?.errorMessage ?? '').toLowerCase();
      if (msg.includes('cancel')) return 'cancelled';
      await this.copy(text);
      return 'copied';
    }
  }

  async download(data: VerseShareData, style?: VerseImageStyle): Promise<SaveResult> {
    return this.saveImage(await this.render(data, style), data);
  }

  /**
   * Saves an already rendered image.
   * Native: Documents/BibliApp. Phone browser / installed web app: the share sheet, whose
   * "Save Image" puts it in Photos. Desktop browser: a regular download.
   */
  async saveImage(dataUrl: string, data: VerseShareData): Promise<SaveResult> {
    const fileName = this.buildFileName(data.ref);
    if (!Capacitor.isNativePlatform()) {
      const file = this.dataUrlToFile(dataUrl, fileName);
      if (window.matchMedia('(pointer: coarse)').matches) {
        const r = await this.webShareFile(file, data.ref);
        if (r) return r;
      }
      this.browserDownload(file);
      return 'downloaded';
    }
    try {
      await Filesystem.writeFile({
        path: `BibliApp/${fileName}`,
        data: dataUrl.split(',')[1],
        directory: Directory.Documents,
        recursive: true,
      });
      return 'saved';
    } catch (e) {
      console.error('save error', e);
      return 'error';
    }
  }

  /** Web Share with a file. Returns null when the browser cannot share files. */
  private async webShareFile(file: File, title: string): Promise<'shared' | 'cancelled' | null> {
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (!nav.share || !nav.canShare?.({ files: [file] })) return null;
    try {
      await nav.share({ files: [file], title });
      return 'shared';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'cancelled';
      return null; // e.g. NotAllowedError: fall back to a download
    }
  }

  private browserDownload(file: File): void {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  private dataUrlToFile(dataUrl: string, name: string): File {
    const [head, b64] = dataUrl.split(',');
    const mime = /:(.*?);/.exec(head)?.[1] ?? 'image/jpeg';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], name, { type: mime });
  }

  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
  }

  // Helpers

  private capSize(size: number, lineHeight: number): number {
    // Cap height (~0.66em) spans from the top of line 1 to the baseline of line 2.
    return Math.round((size * (lineHeight + 0.68)) / 0.66);
  }

  private setSpacing(ctx: CanvasRenderingContext2D, px: number): void {
    (ctx as any).letterSpacing = `${px}px`;
  }

  private drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, box: Box, focus = '50% 50%'): void {
    const [fx, fy] = focus.split(' ').map(p => (parseFloat(p) || 50) / 100);
    const scale = Math.max(box.w / img.width, box.h / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    ctx.drawImage(img, box.x - (sw - box.w) * fx, box.y - (sh - box.h) * fy, sw, sh);
    ctx.restore();
  }

  private wrap(ctx: CanvasRenderingContext2D, text: string, widthFor: (line: number) => number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(test).width > widthFor(lines.length)) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    let p = this.images.get(src);
    if (!p) {
      p = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
      this.images.set(src, p);
      p.catch(() => this.images.delete(src));
    }
    return p;
  }

  private buildFileName(ref: string): string {
    const safe = ref
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
    return `bibliapp-${safe || 'versiculo'}-${Date.now()}.jpg`;
  }
}
