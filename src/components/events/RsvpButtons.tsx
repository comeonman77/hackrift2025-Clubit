import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RsvpStatus } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

interface RsvpButtonsProps {
  currentStatus: RsvpStatus | null;
  onStatusChange: (status: RsvpStatus) => void;
  isLoading?: boolean;
}

export const RsvpButtons: React.FC<RsvpButtonsProps> = ({
  currentStatus,
  onStatusChange,
  isLoading = false,
}) => {
  const options: { status: RsvpStatus; label: string; emoji: string }[] = [
    { status: 'going', label: 'Going', emoji: '✓' },
    { status: 'maybe', label: 'Maybe', emoji: '?' },
    { status: 'not_going', label: "Can't Go", emoji: '✕' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your RSVP</Text>
      <View style={styles.buttons}>
        {options.map((option) => {
          const isSelected = currentStatus === option.status;
          return (
            <TouchableOpacity
              key={option.status}
              style={[
                styles.button,
                isSelected && styles[`selected_${option.status}`],
              ]}
              onPress={() => onStatusChange(option.status)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonEmoji,
                  isSelected && styles.selectedEmoji,
                ]}
              >
                {option.emoji}
              </Text>
              <Text
                style={[
                  styles.buttonText,
                  isSelected && styles.selectedText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selected_going: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  selected_maybe: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  selected_not_going: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  buttonEmoji: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  selectedEmoji: {
    color: Colors.textPrimary,
  },
  selectedText: {
    color: Colors.textPrimary,
  },
});
