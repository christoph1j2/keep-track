import { create } from 'zustand';

interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
    hideConfirm: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: undefined,
    
    showConfirm: (title, message, onConfirm, onCancel) => set({
        isOpen: true,
        title,
        message,
        onConfirm,
        onCancel
    }),
    
    hideConfirm: () => set({ isOpen: false })
}));