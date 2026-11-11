import { Component, OnInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-intro',
  imports: [IonContent],
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
})
export class IntroPage implements OnInit {
  constructor(private router: Router, private el: ElementRef) {}

  ngOnInit(): void {
    window.setTimeout(async () => {
      // Disable pointer events before navigating so a lingering intro
      // element never blocks touches on the next page.
      (this.el.nativeElement as HTMLElement).style.pointerEvents = 'none';

      await this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    }, 1400);
  }
}
