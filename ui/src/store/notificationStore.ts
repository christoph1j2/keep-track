import { create } from "zustand";
import { api } from "../utils/api";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  fetchNotifications: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  fetchNotifications: async () => {
    try {
      const response = await api.get("/notifications");
      set({ notifications: response.data });
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  },

  dismissNotification: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set({ notifications: get().notifications.filter((n) => n.id !== id) });
    } catch (error) {
      console.error("Failed to dismiss notification", error);
    }
  },

  removeNotification: async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      set({ notifications: get().notifications.filter((n) => n.id !== id) });
    } catch (error) {
      console.error("Failed to remove notification", error);
    }
  },
}));
