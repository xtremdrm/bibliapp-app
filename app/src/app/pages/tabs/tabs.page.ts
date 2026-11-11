import { Component } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet,
} from '@ionic/angular/standalone';
import { registerMisalIcons } from '../../shared/ui/misal-icons';

@Component({
  standalone: true,
  selector: 'app-tabs',
  imports: [IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage {
  constructor() {
    registerMisalIcons();
  }
}
