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

export interface DialogStateItem extends DialogOptions {
  id: string;
  isOpen: boolean;
}

export interface ToastOptions {
  message: string;
  type?: FeedbackType;
  duration?: number;
}

interface FeedbackState {
  // Dialog Modal State
  dialog: DialogStateItem | null;
  dialogQueue: DialogStateItem[];
  showDialog: (options: DialogOptions) => string;
  queueDialog: (options: DialogOptions) => string;
  closeDialog: (targetId?: string) => void;

  // Toast State
  toast: (ToastOptions & { isVisible: boolean }) | null;
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

let dialogCounter = 0;

function generateDialogId(): string {
  return `dialog_${Date.now()}_${++dialogCounter}_${Math.random().toString(36).substring(2, 7)}`;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  dialog: null,
  dialogQueue: [],
  toast: null,

  showDialog: (options: DialogOptions) => {
    const id = generateDialogId();
    set({
      dialog: {
        ...options,
        id,
        type: options.type || 'info',
        confirmText: options.confirmText || 'OK',
        isOpen: true,
      },
    });
    return id;
  },

  queueDialog: (options: DialogOptions) => {
    const id = generateDialogId();
    set((state) => {
      const newItem: DialogStateItem = {
        ...options,
        id,
        type: options.type || 'info',
        confirmText: options.confirmText || 'OK',
        isOpen: true,
      };

      if (!state.dialog || !state.dialog.isOpen) {
        return { dialog: newItem };
      }

      const queue = state.dialogQueue || [];
      return {
        dialogQueue: [...queue, newItem],
      };
    });
    return id;
  },

  closeDialog: (targetId?: string) =>
    set((state) => {
      // Jika targetId diberikan dan berbeda dengan dialog aktif, abaikan
      // Hal ini mencegah race condition di mana onConfirm membuka dialog baru
      // lalu finally dari dialog sebelumnya secara keliru menutup dialog baru tersebut.
      if (targetId && state.dialog && state.dialog.id !== targetId) {
        return state;
      }

      const queue = state.dialogQueue || [];
      if (queue.length > 0) {
        const [nextDialog, ...remainingQueue] = queue;
        return {
          dialog: nextDialog,
          dialogQueue: remainingQueue,
        };
      }

      return {
        dialog: state.dialog ? { ...state.dialog, isOpen: false } : null,
        dialogQueue: [],
      };
    }),

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
