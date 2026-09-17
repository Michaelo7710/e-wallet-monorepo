import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { feedback } from '../src/core/feedback/feedback.service';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';
import { GlobalDialogModal } from '../src/shared/components/GlobalDialogModal';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const React = require('react');
  RN.Modal = (props: any) => (props.visible ? React.createElement(RN.View, props, props.children) : null);
  return RN;
});

describe('TASK-QA-01: Unified Feedback Service & Store Unit Tests', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useFeedbackStore.setState({
      dialog: null,
      dialogQueue: [],
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

  describe('TASK-FE-08: Concurrency & Chained Callback Protection Tests', () => {
    it('harus memberikan id unik setiap kali showDialog dipanggil', () => {
      const id1 = useFeedbackStore.getState().showDialog({
        title: 'Dialog 1',
        message: 'Pesan 1',
      });
      const id2 = useFeedbackStore.getState().showDialog({
        title: 'Dialog 2',
        message: 'Pesan 2',
      });

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(useFeedbackStore.getState().dialog?.id).toBe(id2);
    });

    it('harus menolak closeDialog jika targetId tidak cocok dengan dialog aktif (mencegah penutupan rantai callback)', () => {
      const id1 = useFeedbackStore.getState().showDialog({
        title: 'Dialog 1',
        message: 'Pesan 1',
      });

      // Dialog kedua dibuka (misalnya dari onConfirm dialog 1)
      const id2 = useFeedbackStore.getState().showDialog({
        title: 'Dialog 2 (Chained)',
        message: 'Pesan 2',
      });

      // Handler dialog 1 mencoba menutup dengan targetId id1
      useFeedbackStore.getState().closeDialog(id1);

      // State dialog 2 HARUS tetap terbuka dan tidak tertutup dini!
      const currentDialog = useFeedbackStore.getState().dialog;
      expect(currentDialog?.isOpen).toBe(true);
      expect(currentDialog?.id).toBe(id2);
      expect(currentDialog?.title).toBe('Dialog 2 (Chained)');

      // Ketika id2 ditutup, barulah dialog tertutup
      useFeedbackStore.getState().closeDialog(id2);
      expect(useFeedbackStore.getState().dialog?.isOpen).toBe(false);
    });

    it('harus mengantrekan dialog baru via queueDialog jika sedang ada dialog aktif', () => {
      const id1 = useFeedbackStore.getState().showDialog({
        title: 'Dialog Utama',
        message: 'Sedang tampil',
      });

      const id2 = useFeedbackStore.getState().queueDialog({
        title: 'Dialog Antrean',
        message: 'Menunggu giliran',
      });

      const state = useFeedbackStore.getState();
      expect(state.dialog?.id).toBe(id1);
      expect(state.dialogQueue?.length).toBe(1);
      expect(state.dialogQueue?.[0].id).toBe(id2);

      // Tutup dialog utama
      useFeedbackStore.getState().closeDialog(id1);

      // Dialog antrean otomatis naik menjadi dialog aktif!
      const nextState = useFeedbackStore.getState();
      expect(nextState.dialog?.isOpen).toBe(true);
      expect(nextState.dialog?.id).toBe(id2);
      expect(nextState.dialog?.title).toBe('Dialog Antrean');
      expect(nextState.dialogQueue?.length).toBe(0);
    });

    it('harus mengeksekusi rantai callback onConfirm pada GlobalDialogModal tanpa menutup dialog penerus', async () => {
      let renderer: any;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(React.createElement(GlobalDialogModal));
      });

      // Buka Dialog 1 yang di dalam onConfirm-nya memicu Dialog 2
      await ReactTestRenderer.act(async () => {
        feedback.dialog.confirm({
          title: 'Konfirmasi Awal',
          message: 'Lanjutkan ke tahap 2?',
          confirmText: 'Lanjut',
          onConfirm: async () => {
            // Rantai callback: buka dialog kedua
            feedback.dialog.success('Sukses Tahap 2', 'Data berhasil diperbarui');
          },
        });
      });

      // Pastikan Dialog 1 ter-render
      expect(useFeedbackStore.getState().dialog?.title).toBe('Konfirmasi Awal');

      // Tekan tombol confirm pada GlobalDialogModal
      const confirmButton = renderer.root.findByProps({ testID: 'dialog-confirm-button' });
      await ReactTestRenderer.act(async () => {
        await confirmButton.props.onPress();
      });

      // Dialog kedua HARUS tetap aktif di store!
      const currentDialog = useFeedbackStore.getState().dialog;
      expect(currentDialog?.isOpen).toBe(true);
      expect(currentDialog?.title).toBe('Sukses Tahap 2');
      expect(currentDialog?.confirmText).toBe('Selesai');
      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });

    it('harus mengeksekusi onCancel pada GlobalDialogModal dengan aman saat membuka dialog baru', async () => {
      let renderer: any;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(React.createElement(GlobalDialogModal));
      });

      await ReactTestRenderer.act(async () => {
        feedback.dialog.confirm({
          title: 'Batal Transaksi?',
          message: 'Apakah Anda ingin membatalkan transaksi?',
          confirmText: 'Lanjutkan',
          cancelText: 'Batalkan',
          onConfirm: () => {},
          onCancel: () => {
            feedback.dialog.alert('Informasi Pembatalan', 'Transaksi telah dibatalkan');
          },
        });
      });

      const dialog1Id = useFeedbackStore.getState().dialog?.id;
      const cancelButton = renderer.root.findByProps({ testID: 'dialog-cancel-button' });

      await ReactTestRenderer.act(async () => {
        await cancelButton.props.onPress();
      });

      const currentDialog = useFeedbackStore.getState().dialog;
      expect(currentDialog?.isOpen).toBe(true);
      expect(currentDialog?.title).toBe('Informasi Pembatalan');
      expect(currentDialog?.id).not.toBe(dialog1Id);
      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    });
  });
});
