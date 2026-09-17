import { create } from "zustand";
import { api } from "../utils/api";

/**
 * AppNotification interface defines the structure of a notification object in the notification state.
 */
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

/**
 * NotificationState interface defines the structure of the notification state managed by the notification store.
 */
interface NotificationState {
  notifications: AppNotification[];

  /**
   * Fetches the list of notifications for the current user from the API.
   */
  fetchNotifications: () => Promise<void>;

  /**
   * Marks a notification as read on the backend and removes it from the active state list.
   *
   * @param id - The unique identifier of the notification to dismiss.
   */
  dismissNotification: (id: string) => Promise<void>;

  /**
   * Deletes a notification permanently via the API and removes it from state.
   *
   * @param id - The unique identifier of the notification to remove.
   */
  removeNotification: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing the notification state.
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  /**
   * Fetches the list of notifications from the API and updates the state accordingly.
   */
  fetchNotifications: async () => {
    try {
      const response = await api.get("/notifications");
      set({ notifications: response.data });
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  },

  /**
   * Dismisses a notification by marking it as read in the API and updating the state to remove it from the list.
   *
   * @param id - The ID of the notification to dismiss.
   */
  dismissNotification: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set({ notifications: get().notifications.filter((n) => n.id !== id) });
    } catch (error) {
      console.error("Failed to dismiss notification", error);
    }
  },

  /**
   * Removes a notification by sending a DELETE request to the API and updating the state to remove it from the list.
   *
   * @param id - The ID of the notification to permanently remove.
   */
  removeNotification: async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      set({ notifications: get().notifications.filter((n) => n.id !== id) });
    } catch (error) {
      console.error("Failed to remove notification", error);
    }
  },
}));
