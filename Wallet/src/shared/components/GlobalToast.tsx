import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@core/theme';
import { useFeedbackStore, FeedbackType } from '@core/feedback/feedback.store';

export const GlobalToast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const toast = useFeedbackStore((state) => state.toast);
  const hideToast = useFeedbackStore((state) => state.hideToast);

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast && toast.isVisible) {
      // Clear existing timer if any
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Animate In
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto Dismiss Timer
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, toast.duration || 3000);
    } else {
      // Animate Out
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast?.isVisible, toast?.message]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideToast();
    });
  };

  if (!toast || !toast.isVisible) {
    return null;
  }

  const getToastMeta = (type: FeedbackType = 'info') => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: colors.success,
          border: colors.success,
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          color: colors.error,
          border: colors.error,
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: colors.warning,
          border: colors.warning,
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: colors.info,
          border: colors.info,
        };
    }
  };

  const meta = getToastMeta(toast.type);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          top: Math.max(insets.top + (Platform.OS === 'ios' ? 8 : 16), 24),
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
          borderLeftColor: meta.border,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.contentRow}
        onPress={handleDismiss}
        activeOpacity={0.8}
      >
        <Ionicons name={meta.icon} size={22} color={meta.color} style={styles.icon} />
        <Text style={styles.messageText} numberOfLines={2}>
          {toast.message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  messageText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
