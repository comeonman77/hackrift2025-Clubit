import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, FontSize, Spacing } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'sm',
  style,
}) => {
  return (
    <View style={[styles.container, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
  },
  default: {
    backgroundColor: Colors.surfaceSecondary,
  },
  success: {
    backgroundColor: Colors.successLight,
  },
  warning: {
    backgroundColor: Colors.warningLight,
  },
  error: {
    backgroundColor: Colors.errorLight,
  },
  info: {
    backgroundColor: Colors.infoLight,
  },
  size_sm: {
    paddingVertical: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
  },
  size_md: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  text: {
    fontWeight: '500',
  },
  text_default: {
    color: Colors.textSecondary,
  },
  text_success: {
    color: Colors.success,
  },
  text_warning: {
    color: Colors.warning,
  },
  text_error: {
    color: Colors.error,
  },
  text_info: {
    color: Colors.info,
  },
  textSize_sm: {
    fontSize: FontSize.xs,
  },
  textSize_md: {
    fontSize: FontSize.sm,
  },
});
