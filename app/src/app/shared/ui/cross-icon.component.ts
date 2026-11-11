import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Elegant thin-line cross mark. Inherits `currentColor`, so callers control
 * color via CSS. Decorative by default (aria-hidden); pass a `label` to expose
 * it to assistive technology.
 */
@Component({
  standalone: true,
  selector: 'app-cross-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size"
      [attr.height]="size"
      [attr.role]="label ? 'img' : null"
      [attr.aria-label]="label || null"
      [attr.aria-hidden]="label ? null : 'true'"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
    >
      <path d="M12 3.2v17.6" />
      <path d="M6.4 8.4h11.2" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
      }
    `,
  ],
})
export class CrossIconComponent {
  @Input() size: number | string = 24;
  @Input() label = '';
}
