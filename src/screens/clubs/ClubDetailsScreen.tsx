import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Club, Announcement, ClubEvent } from '../../types';
import { useClubStore, useEventStore, useAnnouncementStore, useAuthStore } from '../../stores';
import { Card, Avatar, Badge, Button, LoadingSpinner, EmptyState } from '../../components/ui';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { format } from 'date-fns';

type RouteProps = RouteProp<RootStackParamList, 'ClubDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ClubDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { clubId } = route.params;

  const { user } = useAuthStore();
  const { currentClub, fetchClubById, getUserRole, leaveClub } = useClubStore();
  const { events, fetchClubEvents } = useEventStore();
  const { announcements, fetchClubAnnouncements } = useAnnouncementStore();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userRole = getUserRole(clubId);
  const isAdmin = userRole === 'admin';
  const isCommittee = userRole === 'committee';
  const canCreate = isAdmin || isCommittee;

  const clubEvents = events.get(clubId) || [];
  const clubAnnouncements = announcements.get(clubId) || [];
  const upcomingEvents = clubEvents.filter(e => new Date(e.start_time) > new Date()).slice(0, 3);

  useEffect(() => {
    loadData();
  }, [clubId]);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchClubById(clubId),
        fetchClubEvents(clubId),
        fetchClubAnnouncements(clubId),
      ]);
    } catch (error) {
      console.error('Error loading club data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLeaveClub = () => {
    Alert.alert(
      'Leave Club',
      'Are you sure you want to leave this club?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveClub(clubId);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!currentClub) {
    return (
      <EmptyState
        title="Club Not Found"
        description="This club may have been deleted or you don't have access."
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
          tintColor={Colors.primary}
        />
      }
    >
      {/* Club Header */}
      <View style={styles.header}>
        <Avatar uri={currentClub.logo_url} name={currentClub.name} size="xl" />
        <Text style={styles.clubName}>{currentClub.name}</Text>
        {currentClub.description && (
          <Text style={styles.description}>{currentClub.description}</Text>
        )}
        <View style={styles.statsRow}>
          <Badge
            label={`${currentClub.member_count || 0} members`}
            variant="default"
            size="md"
          />
          {userRole && (
            <Badge
              label={userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              variant={isAdmin ? 'info' : isCommittee ? 'warning' : 'default'}
              size="md"
            />
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.quickActions}>
          {canCreate && (
            <>
              <Button
                title="New Event"
                onPress={() => navigation.navigate('CreateEvent', { clubId })}
                size="sm"
                style={styles.quickActionButton}
              />
              <Button
                title="Announce"
                onPress={() => navigation.navigate('CreateAnnouncement', { clubId })}
                variant="outline"
                size="sm"
                style={styles.quickActionButton}
              />
            </>
          )}
          {isAdmin && (
            <Button
              title="Payment"
              onPress={() => navigation.navigate('CreatePayment', { clubId })}
              variant="secondary"
              size="sm"
              style={styles.quickActionButton}
            />
          )}
        </View>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Events' as any)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No upcoming events</Text>
          </Card>
        ) : (
          upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
            >
              <Card style={styles.eventCard}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>
                  {format(new Date(event.start_time), 'EEE, MMM d · h:mm a')}
                </Text>
                {event.rsvp_counts && (
                  <Text style={styles.eventRsvp}>
                    {event.rsvp_counts.going} going
                  </Text>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Recent Announcements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Announcements</Text>
        </View>
        {clubAnnouncements.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No announcements yet</Text>
          </Card>
        ) : (
          clubAnnouncements.slice(0, 3).map((announcement) => (
            <Card key={announcement.id} style={styles.announcementCard}>
              <Text style={styles.announcementTitle}>{announcement.title}</Text>
              <Text style={styles.announcementContent} numberOfLines={2}>
                {announcement.content}
              </Text>
              <Text style={styles.announcementDate}>
                {format(new Date(announcement.created_at), 'MMM d, yyyy')}
              </Text>
            </Card>
          ))
        )}
      </View>

      {/* Club Actions */}
      <View style={styles.section}>
        <Button
          title="View Members"
          onPress={() => navigation.navigate('Members' as any)}
          variant="outline"
          fullWidth
          style={styles.memberButton}
        />
        {isAdmin && (
          <Button
            title="Invite Members"
            onPress={() => navigation.navigate('InviteMembers', { clubId })}
            variant="outline"
            fullWidth
            style={styles.memberButton}
          />
        )}
        {isAdmin && (
          <Button
            title="Edit Club"
            onPress={() => navigation.navigate('EditClub', { clubId })}
            variant="ghost"
            fullWidth
          />
        )}
        {!isAdmin && (
          <Button
            title="Leave Club"
            onPress={handleLeaveClub}
            variant="ghost"
            fullWidth
            textStyle={{ color: Colors.error }}
          />
        )}
      </View>

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
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  clubName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  section: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    flex: 1,
    minWidth: 100,
  },
  eventCard: {
    marginBottom: Spacing.sm,
  },
  eventTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  eventDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  eventRsvp: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  announcementCard: {
    marginBottom: Spacing.sm,
  },
  announcementTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  announcementContent: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  announcementDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyText: {
    color: Colors.textTertiary,
  },
  memberButton: {
    marginBottom: Spacing.sm,
  },
  bottomPadding: {
    height: Spacing.xl,
  },
});
