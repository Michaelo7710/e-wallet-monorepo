import { create } from 'zustand';

export type FeedbackType = 'success' | 'warning' | 'error' | 'info';

export interface DialogOptions {
  title: string;
  message: string;
  type?: FeedbackType;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ToastOptions {
  message: string;
  type?: FeedbackType;
  duration?: number;
}

interface FeedbackState {
  // Dialog Modal State
  dialog: (DialogOptions & { isOpen: boolean }) | null;
  showDialog: (options: DialogOptions) => void;
  closeDialog: () => void;

  // Toast State
  toast: (ToastOptions & { isVisible: boolean }) | null;
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  dialog: null,
  toast: null,

  showDialog: (options: DialogOptions) =>
    set({
      dialog: {
        ...options,
        type: options.type || 'info',
        confirmText: options.confirmText || 'OK',
        isOpen: true,
      },
    }),

  closeDialog: () =>
    set((state) => ({
      dialog: state.dialog ? { ...state.dialog, isOpen: false } : null,
    })),

  showToast: (options: ToastOptions) =>
    set({
      toast: {
        ...options,
        type: options.type || 'info',
        duration: options.duration || 3000,
        isVisible: true,
      },
    }),

  hideToast: () =>
    set((state) => ({
      toast: state.toast ? { ...state.toast, isVisible: false } : null,
    })),
}));
