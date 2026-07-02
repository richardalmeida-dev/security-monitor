import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { colors } from './theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'success' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading, small, style }: ButtonProps) {
  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'success'
        ? colors.green
        : variant === 'danger'
          ? colors.red
          : 'transparent';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg },
        variant === 'ghost' && styles.buttonGhost,
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            small && styles.buttonTextSmall,
            variant === 'ghost' && { color: colors.accent },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type FieldProps = TextInputProps & { label: string };

export function Field({ label, style, ...props }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.dim}
        style={[styles.fieldInput, style]}
        {...props}
      />
    </View>
  );
}

export function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.screenTitleWrap}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonGhost: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextSmall: {
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: colors.dim,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.dim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  screenTitleWrap: {
    marginBottom: 14,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: colors.dim,
    fontSize: 14,
    marginTop: 2,
  },
});
