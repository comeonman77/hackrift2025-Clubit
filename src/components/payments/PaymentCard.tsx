import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Card, Badge } from '../ui';
import { PaymentRequest } from '../../types';
import { Colors, FontSize, Spacing } from '../../constants/theme';

interface PaymentCardProps {
  payment: PaymentRequest;
  onPress: () => void;
  showProgress?: boolean;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  onPress,
  showProgress = true,
}) => {
  const isOverdue = payment.due_date && new Date(payment.due_date) < new Date();
  const paidCount = payment.paid_count || 0;
  const totalCount = payment.total_count || 0;
  const progressPercent = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {payment.title}
        </Text>
        <Text style={styles.amount}>S${payment.amount.toFixed(2)}</Text>
      </View>

      {payment.description && (
        <Text style={styles.description} numberOfLines={2}>
          {payment.description}
        </Text>
      )}

      <View style={styles.footer}>
        {payment.due_date && (
          <View style={styles.dueDateContainer}>
            <Badge
              label={isOverdue ? 'Overdue' : `Due ${format(new Date(payment.due_date), 'MMM d')}`}
              variant={isOverdue ? 'error' : 'warning'}
              size="sm"
            />
          </View>
        )}

        {showProgress && totalCount > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {paidCount}/{totalCount} paid
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  amount: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  footer: {
    gap: Spacing.sm,
  },
  dueDateContainer: {
    flexDirection: 'row',
  },
  progressContainer: {
    gap: Spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
});
