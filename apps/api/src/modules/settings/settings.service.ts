import type { PlatformSettings, ProcuraNotification, SystemAlert } from "@procura/shared";
import type { AppStore } from "../../core/store.js";

export class SettingsService {
  constructor(private readonly store: AppStore) {}

  get(): PlatformSettings {
    return this.store.settings;
  }

  update(next: PlatformSettings): PlatformSettings {
    this.store.settings = next;
    return next;
  }

  alerts(): SystemAlert[] {
    return [...this.store.alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  notifications(): ProcuraNotification[] {
    return [...this.store.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  markNotificationRead(id: string): ProcuraNotification | null {
    const idx = this.store.notifications.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    const updated = { ...this.store.notifications[idx]!, read: true };
    this.store.notifications[idx] = updated;
    return updated;
  }
}