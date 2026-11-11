import { Component } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonButtons,
  IonBackButton, IonTitle,
} from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-legal',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonContent,
  ],
  templateUrl: './legal.page.html',
  styleUrls:   ['./legal.page.scss'],
})
export class LegalPage {}
