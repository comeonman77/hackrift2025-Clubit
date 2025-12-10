import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, PaymentRequest } from '../../types';
import { useClubStore, usePaymentStore, useAuthStore } from '../../stores';
import { PaymentCard } from '../../components/payments';
import { EmptyState, LoadingSpinner, Badge, Button } from '../../components/ui';
import { Colors, FontSize, Spacing } from '../../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const PaymentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { clubs, currentClub, getUserRole } = useClubStore();
  const { paymentRequests, userOutstandingPayments, fetchClubPayments, fetchUserOutstandingPayments, isLoading } =
    usePaymentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(
    currentClub?.id || (clubs.length > 0 ? clubs[0].id : null)
  );
  const [viewMode, setViewMode] = useState<'outstanding' | 'all'>('outstanding');

  const clubPayments = selectedClubId ? paymentRequests.get(selectedClubId) || [] : [];
  const userRole = selectedClubId ? getUserRole(selectedClubId) : undefined;
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    loadData();
  }, [selectedClubId]);

  const loadData = async () => {
    if (selectedClubId) {
      await fetchClubPayments(selectedClubId);
    }
    await fetchUserOutstandingPayments();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderPaymentItem = ({ item }: { item: PaymentRequest }) => (
    <PaymentCard
      payment={item}
      onPress={() => navigation.navigate('PaymentDetails', { paymentId: item.id })}
      showProgress={isAdmin}
    />
  );

  if (clubs.length === 0) {
    return (
      <EmptyState
        title="No Clubs Yet"
        description="Join or create a club to see payments"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Club Filter */}
      {clubs.length > 1 && (
        <View style={styles.clubFilter}>
          <FlatList
            horizontal
            data={clubs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.clubChip,
                  selectedClubId === item.id && styles.clubChipSelected,
                ]}
                onPress={() => setSelectedClubId(item.id)}
              >
                <Text
                  style={[
                    styles.clubChipText,
                    selectedClubId === item.id && styles.clubChipTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clubFilterContent}
          />
        </View>
      )}

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggle, viewMode === 'outstanding' && styles.toggleActive]}
          onPress={() => setViewMode('outstanding')}
        >
          <Text style={[styles.toggleText, viewMode === 'outstanding' && styles.toggleTextActive]}>
            Outstanding
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, viewMode === 'all' && styles.toggleActive]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.toggleText, viewMode === 'all' && styles.toggleTextActive]}>
            All Requests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Admin Create Button */}
      {isAdmin && selectedClubId && (
        <View style={styles.createButtonContainer}>
          <Button
            title="Create Payment Request"
            onPress={() => navigation.navigate('CreatePayment', { clubId: selectedClubId })}
            size="sm"
            fullWidth
          />
        </View>
      )}

      {/* Payments List */}
      {isLoading && clubPayments.length === 0 ? (
        <LoadingSpinner text="Loading payments..." />
      ) : viewMode === 'outstanding' && userOutstandingPayments.length === 0 ? (
        <EmptyState
          title="All Caught Up!"
          description="You have no outstanding payments"
        />
      ) : viewMode === 'all' && clubPayments.length === 0 ? (
        <EmptyState
          title="No Payment Requests"
          description={isAdmin ? 'Create a payment request to collect from members' : 'No payments have been requested yet'}
        />
      ) : (
        <FlatList
          data={viewMode === 'outstanding'
            ? clubPayments.filter(p =>
                userOutstandingPayments.some(up => up.request_id === p.id)
              )
            : clubPayments
          }
          keyExtractor={(item) => item.id}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  clubFilter: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clubFilterContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  clubChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    marginRight: Spacing.sm,
  },
  clubChipSelected: {
    backgroundColor: Colors.primary,
  },
  clubChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  clubChipTextSelected: {
    color: Colors.textInverse,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  toggle: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.textInverse,
  },
  createButtonContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  list: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
});
