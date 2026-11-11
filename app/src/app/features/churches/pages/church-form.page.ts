import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import {
  Church,
  ChurchEventType,
  ChurchSchedule,
  Weekday,
} from '../models/churches.model';
import { ChurchesService } from '../services/churches.service';

type ChurchFormModel = {
  name: string;
  address: string;
  city: string;
  region: string;
  country: string;
  description: string;
  notes: string;
  isFavorite: boolean;
  isMyParish: boolean;
};

type DraftSchedule = {
  type: ChurchEventType;
  label: string;
  day: Weekday;
  time: string;
  notes: string;
};

@Component({
  standalone: true,
  selector: 'app-church-form',
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCheckbox,
    IonIcon,
  ],
  templateUrl: './church-form.page.html',
  styleUrls: ['./church-form.page.scss'],
})
export class ChurchFormPage implements OnInit {
  protected readonly isEdit = signal(false);
  private editingChurch: Church | null = null;

  protected form: ChurchFormModel = {
    name: '',
    address: '',
    city: '',
    region: '',
    country: 'España',
    description: '',
    notes: '',
    isFavorite: false,
    isMyParish: false,
  };

  protected schedules: ChurchSchedule[] = [];
  protected draftSchedule: DraftSchedule = this.createEmptyDraftSchedule();

  protected readonly weekdays: { value: Weekday; label: string }[] = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' },
  ];

  protected readonly eventTypes: { value: ChurchEventType; label: string }[] = [
    { value: 'mass', label: 'Misa' },
    { value: 'confession', label: 'Confesión' },
    { value: 'adoration', label: 'Adoración' },
    { value: 'vespers', label: 'Vísperas' },
    { value: 'rosary', label: 'Rosario' },
    { value: 'other', label: 'Otro' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private churchesService: ChurchesService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.churchesService.mapChurches().length) {
      await this.churchesService.init();
    }

    const churchId = this.route.snapshot.paramMap.get('churchId');
    if (!churchId) return;

    const church = this.churchesService.getChurchById(churchId);
    if (!church) {
      this.router.navigate(['/tabs/churches']);
      return;
    }

    this.isEdit.set(true);
    this.editingChurch = church;

    this.form = {
      name: church.name ?? '',
      address: church.address ?? '',
      city: church.city ?? '',
      region: church.region ?? '',
      country: church.country ?? 'España',
      description: church.description ?? '',
      notes: church.notes ?? '',
      isFavorite: !!church.isFavorite,
      isMyParish: !!church.isMyParish,
    };

    this.schedules = (church.schedules ?? []).map((s) => ({
      ...s,
      notes: s.notes ?? '',
    }));
  }

  addSchedule(): void {
    const label = this.draftSchedule.label.trim();
    const time = this.draftSchedule.time.trim();
    if (!label || !time) return;

    this.schedules = [
      ...this.schedules,
      {
        id: this.generateScheduleId(),
        type: this.draftSchedule.type,
        label,
        day: this.draftSchedule.day,
        time,
        notes: this.draftSchedule.notes.trim(),
      },
    ];

    this.draftSchedule = this.createEmptyDraftSchedule();
  }

  removeSchedule(scheduleId: string): void {
    this.schedules = this.schedules.filter((s) => s.id !== scheduleId);
  }

  save(): void {
    const name = this.form.name.trim();
    const city = this.form.city.trim();
    if (!name || !city) return;

    const cleanSchedules = this.schedules.map((s) => ({
      ...s,
      label: s.label.trim(),
      time: s.time.trim(),
      notes: (s.notes ?? '').trim(),
    }));

    if (this.editingChurch) {
      // Si era del directorio, aseguramos que queda guardada en local
      if (this.editingChurch.source === 'directory') {
        this.churchesService.saveDirectoryChurch(this.editingChurch.id);
      }

      this.churchesService.updateSavedChurch({
        ...this.editingChurch,
        name,
        address: this.form.address.trim(),
        city,
        region: this.form.region.trim() || undefined,
        country: this.form.country.trim() || undefined,
        description: this.form.description.trim() || undefined,
        notes: this.form.notes.trim() || undefined,
        isFavorite: this.form.isFavorite,
        isMyParish: this.form.isMyParish,
        schedules: cleanSchedules,
      });

      this.router.navigate(['/churches', this.editingChurch.id]);
      return;
    }

    const created = this.churchesService.addManualChurch({
      name,
      address: this.form.address.trim(),
      city,
      region: this.form.region.trim() || undefined,
      country: this.form.country.trim() || undefined,
      description: this.form.description.trim() || undefined,
      notes: this.form.notes.trim() || undefined,
      isFavorite: this.form.isFavorite,
      isMyParish: this.form.isMyParish,
      schedules: cleanSchedules,
      lat: undefined,
      lon: undefined,
      distanceKm: undefined,
      imageUrl: undefined,
      website: undefined,
      isUserCreated: true,
    });

    this.router.navigate(['/churches', created.id]);
  }

  protected trackByScheduleId(_index: number, schedule: ChurchSchedule): string {
    return schedule.id;
  }

  private createEmptyDraftSchedule(): DraftSchedule {
    return { type: 'mass', label: 'Misa', day: 'sunday', time: '11:00', notes: '' };
  }

  private generateScheduleId(): string {
    return `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}
