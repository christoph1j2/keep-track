import { create } from "zustand";

/**
 * ConfirmState interface defines the structure of the confirmation dialog state managed by the confirm store.
 */
interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;

  /**
   * Displays the confirmation dialog with the provided title, message, and action callbacks.
   *
   * @param title - The header title displayed in the confirmation dialog.
   * @param message - The descriptive body text explaining the action and its consequences.
   * @param onConfirm - Callback invoked when the user clicks confirm.
   * @param onCancel - Optional callback invoked when the user cancels or dismisses the dialog.
   */
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => void;

  /**
   * Hides the confirmation dialog and resets the open state.
   */
  hideConfirm: () => void;
}

/**
 * Custom hook for managing the confirmation dialog state.
 */
export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  title: "",
  message: "",
  onConfirm: () => {},
  onCancel: undefined,

  /**
   * Displays the confirmation dialog with the provided title, message, and callback functions for confirm and cancel actions.
   *
   * @param title - The header title displayed in the confirmation dialog.
   * @param message - The descriptive body text explaining the action.
   * @param onConfirm - Callback invoked when the user clicks confirm.
   * @param onCancel - Optional callback invoked when the user cancels or dismisses the dialog.
   */
  showConfirm: (title, message, onConfirm, onCancel) =>
    set({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel,
    }),

  /**
   * Hides the confirmation dialog and resets its open state.
   */
  hideConfirm: () => set({ isOpen: false }),
}));