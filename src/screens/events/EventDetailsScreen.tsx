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
import { RootStackParamList, Rsvp, RsvpStatus } from '../../types';
import { useEventStore, useClubStore, useAuthStore } from '../../stores';
import { RsvpButtons } from '../../components/events';
import { Card, Avatar, Badge, Button, LoadingSpinner, EmptyState } from '../../components/ui';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

type RouteProps = RouteProp<RootStackParamList, 'EventDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const EventDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { eventId } = route.params;

  const { user } = useAuthStore();
  const { getUserRole } = useClubStore();
  const { currentEvent, rsvps, fetchEventById, fetchEventRsvps, submitRsvp, deleteEvent } =
    useEventStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const eventRsvps = rsvps.get(eventId) || [];
  const userRole = currentEvent ? getUserRole(currentEvent.club_id) : undefined;
  const canEdit = userRole === 'admin' || userRole === 'committee';
  const isPast = currentEvent ? new Date(currentEvent.start_time) < new Date() : false;

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      await Promise.all([fetchEventById(eventId), fetchEventRsvps(eventId)]);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRsvp = async (status: RsvpStatus) => {
    if (isPast) return;

    setIsSubmitting(true);
    try {
      await submitRsvp(eventId, status);
      await fetchEventRsvps(eventId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit RSVP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(eventId);
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const groupedRsvps = {
    going: eventRsvps.filter((r) => r.status === 'going'),
    maybe: eventRsvps.filter((r) => r.status === 'maybe'),
    not_going: eventRsvps.filter((r) => r.status === 'not_going'),
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!currentEvent) {
    return (
      <EmptyState
        title="Event Not Found"
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
      {/* Event Header */}
      <View style={styles.header}>
        {isPast && (
          <Badge label="Past Event" variant="default" style={styles.pastBadge} />
        )}
        <Text style={styles.title}>{currentEvent.title}</Text>

        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateIcon}>📅</Text>
          <View>
            <Text style={styles.date}>
              {format(new Date(currentEvent.start_time), 'EEEE, MMMM d, yyyy')}
            </Text>
            <Text style={styles.time}>
              {format(new Date(currentEvent.start_time), 'h:mm a')}
              {currentEvent.end_time &&
                ` - ${format(new Date(currentEvent.end_time), 'h:mm a')}`}
            </Text>
          </View>
        </View>

        {currentEvent.location && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.location}>{currentEvent.location}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {currentEvent.description && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{currentEvent.description}</Text>
        </Card>
      )}

      {/* RSVP Buttons */}
      {!isPast && (
        <Card style={styles.section}>
          <RsvpButtons
            currentStatus={currentEvent.user_rsvp || null}
            onStatusChange={handleRsvp}
            isLoading={isSubmitting}
          />
        </Card>
      )}

      {/* Attendees */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Attendees</Text>

        {/* Going */}
        {groupedRsvps.going.length > 0 && (
          <View style={styles.rsvpGroup}>
            <View style={styles.rsvpGroupHeader}>
              <Badge label={`Going (${groupedRsvps.going.length})`} variant="success" />
            </View>
            <View style={styles.attendeeList}>
              {groupedRsvps.going.map((rsvp) => (
                <View key={rsvp.user_id} style={styles.attendee}>
                  <Avatar uri={rsvp.user?.avatar_url} name={rsvp.user?.name} size="sm" />
                  <Text style={styles.attendeeName}>{rsvp.user?.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Maybe */}
        {groupedRsvps.maybe.length > 0 && (
          <View style={styles.rsvpGroup}>
            <View style={styles.rsvpGroupHeader}>
              <Badge label={`Maybe (${groupedRsvps.maybe.length})`} variant="warning" />
            </View>
            <View style={styles.attendeeList}>
              {groupedRsvps.maybe.map((rsvp) => (
                <View key={rsvp.user_id} style={styles.attendee}>
                  <Avatar uri={rsvp.user?.avatar_url} name={rsvp.user?.name} size="sm" />
                  <Text style={styles.attendeeName}>{rsvp.user?.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {eventRsvps.length === 0 && (
          <Text style={styles.noAttendees}>No responses yet</Text>
        )}
      </Card>

      {/* Admin Actions */}
      {canEdit && (
        <View style={styles.actions}>
          <Button
            title="Delete Event"
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
  pastBadge: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  dateIcon: {
    fontSize: FontSize.lg,
    marginRight: Spacing.sm,
  },
  date: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  time: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: FontSize.lg,
    marginRight: Spacing.sm,
  },
  location: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
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
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  rsvpGroup: {
    marginBottom: Spacing.md,
  },
  rsvpGroupHeader: {
    marginBottom: Spacing.sm,
  },
  attendeeList: {
    gap: Spacing.sm,
  },
  attendee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  attendeeName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  noAttendees: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  actions: {
    padding: Spacing.lg,
  },
  bottomPadding: {
    height: Spacing.xl,
  },
});
