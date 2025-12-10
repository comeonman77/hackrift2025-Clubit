import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Card, Avatar, Badge } from '../ui';
import { Club, MemberRole } from '../../types';
import { Colors, FontSize, Spacing } from '../../constants/theme';

interface ClubCardProps {
  club: Club;
  role?: MemberRole;
  onPress: () => void;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, role, onPress }) => {
  const getRoleBadge = () => {
    if (!role) return null;

    const variants = {
      admin: 'info',
      committee: 'warning',
      member: 'default',
    } as const;

    const labels = {
      admin: 'Admin',
      committee: 'Committee',
      member: 'Member',
    };

    return (
      <Badge
        label={labels[role]}
        variant={variants[role]}
        size="sm"
      />
    );
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        <Avatar
          uri={club.logo_url}
          name={club.name}
          size="lg"
        />
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {club.name}
            </Text>
            {getRoleBadge()}
          </View>
          {club.description && (
            <Text style={styles.description} numberOfLines={2}>
              {club.description}
            </Text>
          )}
          <Text style={styles.members}>
            {club.member_count || 0} {club.member_count === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  members: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});
