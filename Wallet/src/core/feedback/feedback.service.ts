import { useFeedbackStore, FeedbackType } from './feedback.store';

class FeedbackService {
  // ==========================================
  // TIER 1: TOAST NOTIFICATIONS (Transient)
  // ==========================================
  public toast = {
    show: (message: string, type: FeedbackType = 'info', duration: number = 3000) => {
      useFeedbackStore.getState().showToast({ message, type, duration });
    },
    success: (message: string, duration: number = 3000) => {
      useFeedbackStore.getState().showToast({ message, type: 'success', duration });
    },
    error: (message: string, duration: number = 3500) => {
      useFeedbackStore.getState().showToast({ message, type: 'error', duration });
    },
    warning: (message: string, duration: number = 3000) => {
      useFeedbackStore.getState().showToast({ message, type: 'warning', duration });
    },
    info: (message: string, duration: number = 3000) => {
      useFeedbackStore.getState().showToast({ message, type: 'info', duration });
    },
    hide: () => {
      useFeedbackStore.getState().hideToast();
    },
  };

  // ==========================================
  // TIER 2: INTERACTIVE DIALOG MODALS
  // ==========================================
  public dialog = {
    alert: (title: string, message: string, onConfirm?: () => void) => {
      useFeedbackStore.getState().showDialog({
        title,
        message,
        type: 'info',
        confirmText: 'Mengerti',
        onConfirm,
      });
    },

    success: (title: string, message: string, onConfirm?: () => void) => {
      useFeedbackStore.getState().showDialog({
        title,
        message,
        type: 'success',
        confirmText: 'Selesai',
        onConfirm,
      });
    },

    error: (title: string, message: string, onConfirm?: () => void) => {
      useFeedbackStore.getState().showDialog({
        title,
        message,
        type: 'error',
        confirmText: 'Tutup',
        onConfirm,
      });
    },

    warning: (title: string, message: string, onConfirm?: () => void) => {
      useFeedbackStore.getState().showDialog({
        title,
        message,
        type: 'warning',
        confirmText: 'Lanjutkan',
        onConfirm,
      });
    },

    confirm: (options: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      isDestructive?: boolean;
      onConfirm: () => void | Promise<void>;
      onCancel?: () => void;
    }) => {
      useFeedbackStore.getState().showDialog({
        ...options,
        type: options.isDestructive ? 'error' : 'warning',
        confirmText: options.confirmText || 'Konfirmasi',
        cancelText: options.cancelText || 'Batal',
      });
    },

    close: () => {
      useFeedbackStore.getState().closeDialog();
    },
  };
}

export const feedback = new FeedbackService();
