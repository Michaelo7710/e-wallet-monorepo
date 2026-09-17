import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlobalDialogModal } from './GlobalDialogModal';
import { GlobalToast } from './GlobalToast';

interface GlobalFeedbackProviderProps {
  children: React.ReactNode;
}

export const GlobalFeedbackProvider: React.FC<GlobalFeedbackProviderProps> = ({
  children,
}) => {
  return (
    <View style={styles.container}>
      {children}
      <GlobalToast />
      <GlobalDialogModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
