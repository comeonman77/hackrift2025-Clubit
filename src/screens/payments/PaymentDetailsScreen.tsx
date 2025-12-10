import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import QRCode from 'react-native-qrcode-svg';
import { RootStackParamList, PaymentRecord } from '../../types';
import { usePaymentStore, useClubStore, useAuthStore } from '../../stores';
import { PaymentRecordCard } from '../../components/payments';
import { Card, Badge, Button, LoadingSpinner, EmptyState } from '../../components/ui';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

type RouteProps = RouteProp<RootStackParamList, 'PaymentDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const PaymentDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { paymentId } = route.params;

  const { user } = useAuthStore();
  const { getUserRole } = useClubStore();
  const {
    currentPaymentRequest,
    paymentRecords,
    fetchPaymentById,
    fetchPaymentRecords,
    updatePaymentStatus,
    deletePaymentRequest,
  } = usePaymentStore();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const records = paymentRecords.get(paymentId) || [];
  const userRole = currentPaymentRequest ? getUserRole(currentPaymentRequest.club_id) : undefined;
  const isAdmin = userRole === 'admin';
  const userRecord = records.find((r) => r.user_id === user?.id);
  const isOverdue = currentPaymentRequest?.due_date &&
    new Date(currentPaymentRequest.due_date) < new Date();

  useEffect(() => {
    loadData();
  }, [paymentId]);

  const loadData = async () => {
    try {
      await Promise.all([fetchPaymentById(paymentId), fetchPaymentRecords(paymentId)]);
    } catch (error) {
      console.error('Error loading payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleConfirmPayment = async (recordId: string) => {
    Alert.alert('Confirm Payment', 'Mark this member as paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await updatePaymentStatus(recordId, 'paid');
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Payment Request', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePaymentRequest(paymentId);
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  // Generate PayNow QR string (simplified version)
  const generatePayNowString = () => {
    if (!currentPaymentRequest) return '';
    // This is a simplified PayNow QR code - in production you'd use the actual PayNow format
    return `paynow://pay?amount=${currentPaymentRequest.amount}&ref=${paymentId}`;
  };

  const pendingRecords = records.filter((r) => r.status === 'pending');
  const paidRecords = records.filter((r) => r.status === 'paid');

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!currentPaymentRequest) {
    return (
      <EmptyState
        title="Payment Not Found"
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Payment Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{currentPaymentRequest.title}</Text>
        <Text style={styles.amount}>S${currentPaymentRequest.amount.toFixed(2)}</Text>

        {currentPaymentRequest.description && (
          <Text style={styles.description}>{currentPaymentRequest.description}</Text>
        )}

        <View style={styles.metaRow}>
          {currentPaymentRequest.due_date && (
            <Badge
              label={`Due ${format(new Date(currentPaymentRequest.due_date), 'MMM d, yyyy')}`}
              variant={isOverdue ? 'error' : 'warning'}
            />
          )}
          <Badge
            label={`${paidRecords.length}/${records.length} paid`}
            variant={paidRecords.length === records.length ? 'success' : 'default'}
          />
        </View>
      </View>

      {/* User's Payment Status */}
      {userRecord && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Your Payment Status</Text>
          <View style={styles.userStatusContainer}>
            <Badge
              label={userRecord.status === 'paid' ? 'Paid' : 'Pending'}
              variant={userRecord.status === 'paid' ? 'success' : 'warning'}
              size="md"
            />
            {userRecord.status === 'pending' && (
              <Text style={styles.pendingHint}>
                Pay via PayNow and notify an admin to confirm
              </Text>
            )}
          </View>
        </Card>
      )}

      {/* PayNow QR Code */}
      {userRecord?.status === 'pending' && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Pay with PayNow</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={generatePayNowString()}
              size={180}
              color={Colors.textPrimary}
              backgroundColor={Colors.surface}
            />
          </View>
          <Text style={styles.qrHint}>
            Scan with your banking app to pay S${currentPaymentRequest.amount.toFixed(2)}
          </Text>
        </Card>
      )}

      {/* Admin: Payment Records */}
      {isAdmin && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Status</Text>

          {pendingRecords.length > 0 && (
            <View style={styles.recordGroup}>
              <Text style={styles.recordGroupTitle}>
                Pending ({pendingRecords.length})
              </Text>
              {pendingRecords.map((record) => (
                <PaymentRecordCard
                  key={record.id}
                  record={record}
                  canConfirm
                  onConfirm={() => handleConfirmPayment(record.id)}
                />
              ))}
            </View>
          )}

          {paidRecords.length > 0 && (
            <View style={styles.recordGroup}>
              <Text style={styles.recordGroupTitle}>
                Paid ({paidRecords.length})
              </Text>
              {paidRecords.map((record) => (
                <PaymentRecordCard key={record.id} record={record} />
              ))}
            </View>
          )}
        </Card>
      )}

      {/* Admin Actions */}
      {isAdmin && (
        <View style={styles.actions}>
          <Button
            title="Delete Request"
            onPress={handleDelete}
            variant="danger"
            fullWidth
          />
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  amount: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  section: {
    margin: Spacing.lg,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  userStatusContainer: {
    alignItems: 'flex-start',
  },
  pendingHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  qrContainer: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  qrHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recordGroup: {
    marginBottom: Spacing.md,
  },
  recordGroupTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  actions: {
    padding: Spacing.lg,
  },
  bottomPadding: {
    height: Spacing.xl,
  },
});
