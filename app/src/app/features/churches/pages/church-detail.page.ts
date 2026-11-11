import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ChurchesService } from '../services/churches.service';
import { Church, ChurchSchedule, Weekday } from '../models/churches.model';

@Component({
  standalone: true,
  selector: 'app-church-detail',
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
  ],
  templateUrl: './church-detail.page.html',
  styleUrls: ['./church-detail.page.scss'],
})
export class ChurchDetailPage implements OnInit {
  private readonly churchId = signal<string>('');
  protected readonly justSaved = signal(false);

  protected readonly church = computed(() =>
    this.churchesService.getChurchById(this.churchId())
  );

  protected readonly canEdit = computed(() => {
    const church = this.church();
    if (!church) return false;
    return (
      church.source === 'manual' ||
      church.isFavorite ||
      church.isMyParish ||
      this.justSaved()
    );
  });

  private static readonly WEEK: Weekday[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ];

  /** Schedules grouped by weekday (Monday first), times ascending. */
  protected readonly scheduleDays = computed(() => {
    const schedules = this.church()?.schedules ?? [];
    return ChurchDetailPage.WEEK
      .map((day) => ({
        day,
        items: schedules
          .filter((s) => s.day === day)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((group) => group.items.length);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private churchesService: ChurchesService
  ) {
  }

  async ngOnInit(): Promise<void> {
    if (!this.churchesService.mapChurches().length) {
      await this.churchesService.init();
    }

    const id = this.route.snapshot.paramMap.get('churchId') ?? '';
    this.churchId.set(id);
  }

  toggleFavorite(): void {
    const church = this.church();
    if (!church) return;
    this.churchesService.toggleFavorite(church.id);
  }

  setMyParish(): void {
    const church = this.church();
    if (!church) return;
    this.churchesService.setMyParish(church.id);
  }

  saveChurch(): void {
    const church = this.church();
    if (!church || church.source !== 'directory') return;
    this.churchesService.saveDirectoryChurch(church.id);
    this.justSaved.set(true);
  }

  editChurch(): void {
    const church = this.church();
    if (!church) return;
    this.router.navigate(['/churches', church.id, 'edit']);
  }

  deleteChurch(): void {
    const church = this.church();
    if (!church || church.source !== 'manual') return;
    this.churchesService.deleteSavedChurch(church.id);
    this.router.navigate(['/tabs/churches']);
  }

  openWebsite(): void {
    const church = this.church();
    if (!church?.website) return;
    window.open(church.website, '_blank', 'noopener,noreferrer');
  }

  protected formatDistance(distanceKm?: number): string {
    if (typeof distanceKm !== 'number') return '';
    return distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m`
      : `${distanceKm.toFixed(1)} km`;
  }

  protected formatDay(day: Weekday): string {
    const labels: Record<Weekday, string> = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
    };
    return labels[day];
  }

  protected formatScheduleType(schedule: ChurchSchedule): string {
    const labels: Record<string, string> = {
      mass: 'Misa',
      confession: 'Confesión',
      adoration: 'Adoración',
      vespers: 'Vísperas',
      rosary: 'Rosario',
      other: 'Otro',
    };
    return labels[schedule.type] ?? schedule.label;
  }
}
