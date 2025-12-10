import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, ClubEvent } from '../../types';
import { useClubStore, useEventStore } from '../../stores';
import { EventCard } from '../../components/events';
import { EmptyState, LoadingSpinner, Badge } from '../../components/ui';
import { Colors, FontSize, Spacing } from '../../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const EventsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { clubs, currentClub } = useClubStore();
  const { events, fetchClubEvents, isLoading } = useEventStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(
    currentClub?.id || (clubs.length > 0 ? clubs[0].id : null)
  );
  const [showPast, setShowPast] = useState(false);

  const clubEvents = selectedClubId ? events.get(selectedClubId) || [] : [];
  const now = new Date();
  const filteredEvents = showPast
    ? clubEvents.filter((e) => new Date(e.start_time) < now)
    : clubEvents.filter((e) => new Date(e.start_time) >= now);

  useEffect(() => {
    if (selectedClubId) {
      fetchClubEvents(selectedClubId);
    }
  }, [selectedClubId]);

  const handleRefresh = async () => {
    if (!selectedClubId) return;
    setRefreshing(true);
    await fetchClubEvents(selectedClubId);
    setRefreshing(false);
  };

  const renderEventItem = ({ item }: { item: ClubEvent }) => (
    <EventCard
      event={item}
      onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
    />
  );

  if (clubs.length === 0) {
    return (
      <EmptyState
        title="No Clubs Yet"
        description="Join or create a club to see events"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

      {/* Toggle Past/Upcoming */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggle, !showPast && styles.toggleActive]}
          onPress={() => setShowPast(false)}
        >
          <Text style={[styles.toggleText, !showPast && styles.toggleTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, showPast && styles.toggleActive]}
          onPress={() => setShowPast(true)}
        >
          <Text style={[styles.toggleText, showPast && styles.toggleTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {isLoading && clubEvents.length === 0 ? (
        <LoadingSpinner text="Loading events..." />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title={showPast ? 'No Past Events' : 'No Upcoming Events'}
          description={
            showPast
              ? 'Past events will appear here'
              : 'Create an event to get started'
          }
        />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
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
    </SafeAreaView>
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
  list: {
    padding: Spacing.lg,
  },
});
