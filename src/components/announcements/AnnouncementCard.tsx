import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Card, Avatar } from '../ui';
import { Announcement } from '../../types';
import { Colors, FontSize, Spacing } from '../../constants/theme';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress?: () => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onPress,
}) => {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Avatar
          uri={announcement.author?.avatar_url}
          name={announcement.author?.name}
          size="sm"
        />
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{announcement.author?.name || 'Unknown'}</Text>
          <Text style={styles.date}>
            {format(new Date(announcement.created_at), 'MMM d, yyyy · h:mm a')}
          </Text>
        </View>
      </View>
      <Text style={styles.title}>{announcement.title}</Text>
      <Text style={styles.content} numberOfLines={3}>
        {announcement.content}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerText: {
    marginLeft: Spacing.sm,
  },
  authorName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  content: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
