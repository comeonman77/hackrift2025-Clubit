import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Card, Badge } from '../ui';
import { ClubEvent, RsvpStatus } from '../../types';
import { Colors, FontSize, Spacing } from '../../constants/theme';

interface EventCardProps {
  event: ClubEvent;
  onPress: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const startDate = new Date(event.start_time);
  const isPast = startDate < new Date();

  const getRsvpBadge = () => {
    if (!event.user_rsvp) return null;

    const variants: Record<RsvpStatus, 'success' | 'warning' | 'error'> = {
      going: 'success',
      maybe: 'warning',
      not_going: 'error',
    };

    const labels: Record<RsvpStatus, string> = {
      going: 'Going',
      maybe: 'Maybe',
      not_going: 'Not Going',
    };

    return (
      <Badge
        label={labels[event.user_rsvp]}
        variant={variants[event.user_rsvp]}
        size="sm"
      />
    );
  };

  const cardStyle = isPast ? { ...styles.card, ...styles.pastCard } : styles.card;

  return (
    <Card onPress={onPress} style={cardStyle}>
      <View style={styles.dateContainer}>
        <Text style={[styles.dateMonth, isPast && styles.pastText]}>
          {format(startDate, 'MMM').toUpperCase()}
        </Text>
        <Text style={[styles.dateDay, isPast && styles.pastText]}>
          {format(startDate, 'd')}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, isPast && styles.pastText]} numberOfLines={1}>
            {event.title}
          </Text>
          {getRsvpBadge()}
        </View>
        <Text style={[styles.time, isPast && styles.pastText]}>
          {format(startDate, 'EEEE · h:mm a')}
        </Text>
        {event.location && (
          <Text style={[styles.location, isPast && styles.pastText]} numberOfLines={1}>
            📍 {event.location}
          </Text>
        )}
        {event.rsvp_counts && (
          <View style={styles.rsvpCounts}>
            <Text style={styles.rsvpText}>
              {event.rsvp_counts.going} going
            </Text>
            {event.rsvp_counts.maybe > 0 && (
              <Text style={styles.rsvpText}>
                · {event.rsvp_counts.maybe} maybe
              </Text>
            )}
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  pastCard: {
    opacity: 0.6,
  },
  dateContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  dateMonth: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  time: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  location: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  rsvpCounts: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  rsvpText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  pastText: {
    color: Colors.textTertiary,
  },
});
