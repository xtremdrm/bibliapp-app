import { Injectable } from '@angular/core';
import { Church, ChurchReminder, ChurchesState } from '../models/churches.model';

const STORAGE_KEY = 'bibliapp.churches.state';

@Injectable({ providedIn: 'root' })
export class ChurchesStorageService {

  loadState(): ChurchesState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.emptyState();
      const parsed = JSON.parse(raw) as Partial<ChurchesState>;
      return {
        savedChurches: Array.isArray(parsed.savedChurches) ? parsed.savedChurches : [],
        reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      };
    } catch {
      return this.emptyState();
    }
  }

  saveState(state: ChurchesState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[ChurchesStorage] Error saving state:', e);
    }
  }

  loadSavedChurches(): Church[] {
    return this.loadState().savedChurches;
  }

  saveSavedChurches(churches: Church[]): void {
    const state = this.loadState();
    this.saveState({ ...state, savedChurches: churches });
  }

  loadReminders(): ChurchReminder[] {
    return this.loadState().reminders;
  }

  saveReminders(reminders: ChurchReminder[]): void {
    const state = this.loadState();
    this.saveState({ ...state, reminders });
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  private emptyState(): ChurchesState {
    return { savedChurches: [], reminders: [] };
  }
}
