import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { Avatar, Badge } from '../ui';
import { PaymentRecord } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

interface PaymentRecordCardProps {
  record: PaymentRecord;
  canConfirm?: boolean;
  onConfirm?: () => void;
}

export const PaymentRecordCard: React.FC<PaymentRecordCardProps> = ({
  record,
  canConfirm = false,
  onConfirm,
}) => {
  const isPaid = record.status === 'paid';

  return (
    <View style={styles.container}>
      <Avatar uri={record.user?.avatar_url} name={record.user?.name} size="md" />
      <View style={styles.info}>
        <Text style={styles.name}>{record.user?.name || 'Unknown'}</Text>
        {isPaid && record.paid_at && (
          <Text style={styles.paidDate}>
            Paid on {format(new Date(record.paid_at), 'MMM d, yyyy')}
          </Text>
        )}
      </View>
      <View style={styles.statusContainer}>
        <Badge
          label={isPaid ? 'Paid' : 'Pending'}
          variant={isPaid ? 'success' : 'warning'}
          size="sm"
        />
        {canConfirm && !isPaid && onConfirm && (
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paidDate: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  confirmButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  confirmText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});
