import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import i18n from "../i18n";
import { useNotificationStore } from "./notificationStore";
import { useAuthStore } from "./authStore";
import { useTransactionStore } from "./transactionStore";
import { useCategoryStore } from "./categoryStore";
import { useBudgetStore } from "./budgetStore";
import { useTemplateStore } from "./quickAddTemplateStore";
import { api } from "../utils/api";

/**
 * SocketState interface defines the structure of the WebSocket connection
 * and import job tracking state managed by the socket store.
 */
interface SocketState {
  socket: Socket | null;
  isImportProcessing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importedDataReady: any[] | null;
  importJobId: string | null;

  /**
   * Establishes a WebSocket connection to the backend server and sets up event listeners for real-time updates.
   */
  connectSocket: () => void;

  /**
   * Disconnects the active WebSocket connection, stops any active import polling, and clears the socket instance.
   */
  disconnectSocket: () => void;

  /**
   * Sets the import processing status and manages fallback polling for import job completion.
   *
   * @param status - Whether an import job is currently being processed.
   * @param jobId - Optional unique identifier of the active import job.
   */
  setImportProcessing: (status: boolean, jobId?: string) => void;

  /**
   * Clears the staged imported transactions data from the store state.
   */
  clearImportedData: () => void;

  /**
   * Checks the backend for any staged transactions waiting for review.
   *
   * @param targetJobId - Optional specific import job ID to check against.
   * @returns A promise resolving to true if a matching pending job was found and loaded, false otherwise.
   */
  fetchPendingJob: (targetJobId?: string) => Promise<boolean>;
}

const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || "/socket.io";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

let importPollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Stops and clears the background import polling timer if active.
 */
const stopImportPolling = () => {
  if (importPollTimer) {
    clearInterval(importPollTimer);
    importPollTimer = null;
  }
};

/**
 * Custom hook for managing the WebSocket connection, real-time data sync, and import job processing state.
 */
export const useSocketStore = create<SocketState>()(
  persist(
    (set, get) => ({
      socket: null,
      isImportProcessing: false,
      importedDataReady: null,
      importJobId: null,

      /**
       * Connects to the backend WebSocket server and registers event listeners for real-time data updates.
       * If already connected or if no authentication token is present, this method does nothing.
       */
      connectSocket: () => {
        // If already connected, do nothing
        if (get().socket?.connected) return;

        const token = useAuthStore.getState().accessToken;
        if (!token) return;

        const newSocket = io(BACKEND_URL, {
          path: SOCKET_PATH,
          withCredentials: true,
          auth: { token },
        });

        newSocket.on("connect", () => {
          console.log("WebSocket connected.");
          get().fetchPendingJob();
        });

        newSocket.on("data_updated", (payload?: { resource?: string }) => {
          const resource = payload?.resource;
          if (!resource || resource === "transactions") {
            useTransactionStore.getState().fetchTransactions();
          }
          if (!resource || resource === "categories") {
            useCategoryStore.getState().fetchCategories();
          }
          if (!resource || resource === "budgets") {
            useBudgetStore.getState().fetchBudgets();
            useBudgetStore.getState().fetchComplexBudget();
          }
          if (!resource || resource === "templates") {
            useTemplateStore.getState().fetchTemplates();
          }
        });

        newSocket.on("import_finished", (payload) => {
          stopImportPolling();
          if (payload.status === "success") {
            set({
              isImportProcessing: false,
              importedDataReady: payload.data,
              importJobId: payload.jobId,
            });
            toast.success(
              i18n.t("import.aiSuccess", "Transakce byly analyzovány!"),
            );
            // Refresh notifications from the backend (new IMPORT_READY notification)
            useNotificationStore.getState().fetchNotifications();
          } else {
            set({ isImportProcessing: false });
            toast.error(
              payload.message ||
                i18n.t(
                  "import.parseError",
                  "Při zpracování souboru nastala chyba.",
                ),
            );
          }
        });

        set({ socket: newSocket });
      },

      /**
       * Disconnects the current WebSocket connection and stops any running import polling.
       */
      disconnectSocket: () => {
        stopImportPolling();
        const { socket } = get();
        if (socket) {
          socket.disconnect();
          set({ socket: null });
        }
      },

      /**
       * Sets import processing state. When active, initiates a fallback polling interval (every 3 seconds)
       * to verify import job completion in case WebSocket notifications are delayed or missed.
       *
       * @param status - Whether an import job is currently being processed.
       * @param jobId - Optional unique identifier of the active import job.
       */
      setImportProcessing: (status, jobId) => {
        if (status) {
          set({
            isImportProcessing: true,
            importedDataReady: null,
            ...(jobId ? { importJobId: jobId } : {}),
          });
          stopImportPolling();
          importPollTimer = setInterval(async () => {
            const currentJobId = get().importJobId;
            const found = await get().fetchPendingJob(
              currentJobId || undefined,
            );
            if (found) {
              stopImportPolling();
              toast.success(
                i18n.t("import.aiSuccess", "Transakce byly analyzovány!"),
              );
              useNotificationStore.getState().fetchNotifications();
            }
          }, 3000);
        } else {
          stopImportPolling();
          set({ isImportProcessing: false });
        }
      },

      /**
       * Clears staged imported transactions from state once they have been reviewed or discarded.
       */
      clearImportedData: () => set({ importedDataReady: null }),

      /**
       * Fetches pending import job data from the backend to check for staged transactions awaiting review.
       *
       * @param targetJobId - Optional specific import job ID to check against.
       * @returns A promise resolving to true if a matching job was found and loaded into state, false otherwise.
       */
      fetchPendingJob: async (targetJobId) => {
        try {
          const idToUse = targetJobId || get().importJobId || undefined;
          const response = await api.get("/import/pending", {
            params: idToUse ? { jobId: idToUse } : {},
          });
          if (response.data) {
            if (idToUse && response.data.jobId !== idToUse) {
              return false;
            }
            stopImportPolling();
            set({
              importedDataReady: response.data.transactions,
              importJobId: response.data.jobId,
              isImportProcessing: false,
            });
            return true;
          }
        } catch (error) {
          console.error("Nepodařilo se načíst čekající import", error);
        }
        return false;
      },
    }),
    {
      name: "socket-store",
      partialize: (state) => ({
        importedDataReady: state.importedDataReady,
        importJobId: state.importJobId,
      }),
    },
  ),
);
