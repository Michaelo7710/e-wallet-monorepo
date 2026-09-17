import { feedback } from '../src/core/feedback/feedback.service';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';

describe('TASK-QA-01: Unified Feedback Service & Store Unit Tests', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useFeedbackStore.setState({
      dialog: null,
      toast: null,
    });
  });

  describe('Tier 1: Toast Notifications', () => {
    it('harus memiliki state awal toast bernilai null', () => {
      const state = useFeedbackStore.getState();
      expect(state.toast).toBeNull();
    });

    it('harus dapat memunculkan toast generic show()', () => {
      feedback.toast.show('Pesan info umum', 'info', 4000);
      const state = useFeedbackStore.getState();

      expect(state.toast).not.toBeNull();
      expect(state.toast?.isVisible).toBe(true);
      expect(state.toast?.message).toBe('Pesan info umum');
      expect(state.toast?.type).toBe('info');
      expect(state.toast?.duration).toBe(4000);
    });

    it('harus dapat memunculkan toast success()', () => {
      feedback.toast.success('Transaksi berhasil diproses');
      const state = useFeedbackStore.getState();

      expect(state.toast?.isVisible).toBe(true);
      expect(state.toast?.message).toBe('Transaksi berhasil diproses');
      expect(state.toast?.type).toBe('success');
      expect(state.toast?.duration).toBe(3000);
    });

    it('harus dapat memunculkan toast error() dengan default duration 3500ms', () => {
      feedback.toast.error('Saldo tidak mencukupi');
      const state = useFeedbackStore.getState();

      expect(state.toast?.isVisible).toBe(true);
      expect(state.toast?.message).toBe('Saldo tidak mencukupi');
      expect(state.toast?.type).toBe('error');
      expect(state.toast?.duration).toBe(3500);
    });

    it('harus dapat memunculkan toast warning() dan info()', () => {
      feedback.toast.warning('Koneksi internet tidak stabil');
      let state = useFeedbackStore.getState();
      expect(state.toast?.type).toBe('warning');
      expect(state.toast?.message).toBe('Koneksi internet tidak stabil');

      feedback.toast.info('Sesi Anda tersisa 5 menit');
      state = useFeedbackStore.getState();
      expect(state.toast?.type).toBe('info');
      expect(state.toast?.message).toBe('Sesi Anda tersisa 5 menit');
    });

    it('harus dapat menyembunyikan toast via hide()', () => {
      feedback.toast.success('Notifikasi aktif');
      expect(useFeedbackStore.getState().toast?.isVisible).toBe(true);

      feedback.toast.hide();
      expect(useFeedbackStore.getState().toast?.isVisible).toBe(false);
    });
  });

  describe('Tier 2: Interactive Dialog Modals', () => {
    it('harus memiliki state awal dialog bernilai null', () => {
      expect(useFeedbackStore.getState().dialog).toBeNull();
    });

    it('harus dapat membuka dialog alert() dengan confirmText "Mengerti"', () => {
      const onConfirmMock = jest.fn();
      feedback.dialog.alert('Informasi Sistem', 'Pemeliharaan server pukul 00:00 WIB', onConfirmMock);

      const state = useFeedbackStore.getState();
      expect(state.dialog?.isOpen).toBe(true);
      expect(state.dialog?.title).toBe('Informasi Sistem');
      expect(state.dialog?.message).toBe('Pemeliharaan server pukul 00:00 WIB');
      expect(state.dialog?.type).toBe('info');
      expect(state.dialog?.confirmText).toBe('Mengerti');

      state.dialog?.onConfirm?.();
      expect(onConfirmMock).toHaveBeenCalledTimes(1);
    });

    it('harus dapat membuka dialog success() dengan confirmText "Selesai"', () => {
      feedback.dialog.success('Pembayaran Berhasil', 'Tagihan PLN telah dibayar');

      const state = useFeedbackStore.getState();
      expect(state.dialog?.isOpen).toBe(true);
      expect(state.dialog?.title).toBe('Pembayaran Berhasil');
      expect(state.dialog?.type).toBe('success');
      expect(state.dialog?.confirmText).toBe('Selesai');
    });

    it('harus dapat membuka dialog error() dengan confirmText "Tutup"', () => {
      feedback.dialog.error('Autentikasi Gagal', 'PIN yang Anda masukkan salah');

      const state = useFeedbackStore.getState();
      expect(state.dialog?.isOpen).toBe(true);
      expect(state.dialog?.title).toBe('Autentikasi Gagal');
      expect(state.dialog?.type).toBe('error');
      expect(state.dialog?.confirmText).toBe('Tutup');
    });

    it('harus dapat membuka dialog warning() dengan confirmText "Lanjutkan"', () => {
      feedback.dialog.warning('Batas Penarikan', 'Penarikan melebihi batas harian');

      const state = useFeedbackStore.getState();
      expect(state.dialog?.isOpen).toBe(true);
      expect(state.dialog?.title).toBe('Batas Penarikan');
      expect(state.dialog?.type).toBe('warning');
      expect(state.dialog?.confirmText).toBe('Lanjutkan');
    });

    it('harus mendukung dialog confirm() dengan callback onConfirm dan onCancel', () => {
      const onConfirmMock = jest.fn();
      const onCancelMock = jest.fn();

      feedback.dialog.confirm({
        title: 'Konfirmasi Transfer',
        message: 'Kirim Rp 100.000 ke Budi?',
        confirmText: 'Ya, Kirim',
        cancelText: 'Batal',
        isDestructive: false,
        onConfirm: onConfirmMock,
        onCancel: onCancelMock,
      });

      const state = useFeedbackStore.getState();
      expect(state.dialog?.isOpen).toBe(true);
      expect(state.dialog?.title).toBe('Konfirmasi Transfer');
      expect(state.dialog?.confirmText).toBe('Ya, Kirim');
      expect(state.dialog?.cancelText).toBe('Batal');
      expect(state.dialog?.type).toBe('warning');

      state.dialog?.onConfirm?.();
      expect(onConfirmMock).toHaveBeenCalledTimes(1);

      state.dialog?.onCancel?.();
      expect(onCancelMock).toHaveBeenCalledTimes(1);
    });

    it('harus mengatur type dialog menjadi "error" jika isDestructive bernilai true', () => {
      feedback.dialog.confirm({
        title: 'Hapus Rekening',
        message: 'Apakah Anda yakin ingin menghapus rekening bank ini?',
        isDestructive: true,
        onConfirm: jest.fn(),
      });

      const state = useFeedbackStore.getState();
      expect(state.dialog?.type).toBe('error');
      expect(state.dialog?.confirmText).toBe('Konfirmasi');
      expect(state.dialog?.cancelText).toBe('Batal');
    });

    it('harus dapat menutup dialog via close()', () => {
      feedback.dialog.alert('Test', 'Pesan Test');
      expect(useFeedbackStore.getState().dialog?.isOpen).toBe(true);

      feedback.dialog.close();
      expect(useFeedbackStore.getState().dialog?.isOpen).toBe(false);
    });
  });
});
