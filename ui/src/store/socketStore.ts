import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import i18n from "../i18n";
import { useNotificationStore } from "./notificationStore";

interface SocketState {
  socket: Socket | null;
  isImportProcessing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importedDataReady: any[] | null;
  importJobId: string | null;

  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  setImportProcessing: (status: boolean) => void;
  clearImportedData: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isImportProcessing: false,
  importedDataReady: null,
  importJobId: null,

  connectSocket: (userId: string) => {
    // pokud jsme pripojeni, nedelam nic
    if (get().socket?.connected) return;

    const newSocket = io(BACKEND_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      newSocket.emit("joinUserRoom", { userId });
    });

    newSocket.on("import_finished", (payload) => {
      if (payload.status === "success") {
        set({ isImportProcessing: false, importedDataReady: payload.data, importJobId: payload.jobId });
        toast.success(
          i18n.t("import.aiSuccess", "Transakce byly analyzovány!"),
        );
        // Obnovíme notifikace z backendu (nová IMPORT_READY notifikace)
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

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  setImportProcessing: (status) => set({ isImportProcessing: status }),

  clearImportedData: () => set({ importedDataReady: null }),
}));
