import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, Badge } from '../ui';
import { Membership, MemberRole } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { format } from 'date-fns';

interface MemberCardProps {
  membership: Membership;
  isCurrentUser?: boolean;
  canManage?: boolean;
  onPress?: () => void;
  onRoleChange?: (role: MemberRole) => void;
  onRemove?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  membership,
  isCurrentUser = false,
  canManage = false,
  onPress,
  onRoleChange,
  onRemove,
}) => {
  const user = membership.user;

  const getRoleBadge = () => {
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
        label={labels[membership.role]}
        variant={variants[membership.role]}
        size="sm"
      />
    );
  };

  const content = (
    <View style={styles.container}>
      <Avatar
        uri={user?.avatar_url}
        name={user?.name}
        size="md"
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {user?.name || 'Unknown'}
            {isCurrentUser && <Text style={styles.youLabel}> (You)</Text>}
          </Text>
          {getRoleBadge()}
        </View>
        <Text style={styles.joinDate}>
          Joined {format(new Date(membership.joined_at), 'MMM d, yyyy')}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{content}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  youLabel: {
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  joinDate: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});
