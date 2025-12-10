import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Membership, MemberRole } from '../../types';
import { useClubStore, useAuthStore } from '../../stores';
import { MemberCard } from '../../components/clubs';
import { EmptyState, LoadingSpinner, Button } from '../../components/ui';
import { Colors, FontSize, Spacing } from '../../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const MembersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const {
    clubs,
    currentClub,
    memberships,
    getUserRole,
    fetchClubMembers,
    updateMemberRole,
    removeMember,
  } = useClubStore();

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(
    currentClub?.id || (clubs.length > 0 ? clubs[0].id : null)
  );

  const clubMembers = selectedClubId ? memberships.get(selectedClubId) || [] : [];
  const userRole = selectedClubId ? getUserRole(selectedClubId) : undefined;
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (selectedClubId) {
      loadMembers();
    }
  }, [selectedClubId]);

  const loadMembers = async () => {
    if (!selectedClubId) return;
    setIsLoading(true);
    try {
      await fetchClubMembers(selectedClubId);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const handleRoleChange = (membership: Membership) => {
    if (!isAdmin || membership.user_id === user?.id) return;

    const roles: MemberRole[] = ['member', 'committee', 'admin'];
    const options = roles.map((role) => ({
      text: role.charAt(0).toUpperCase() + role.slice(1),
      onPress: () => {
        if (role !== membership.role) {
          updateMemberRole(selectedClubId!, membership.user_id, role);
        }
      },
    }));

    Alert.alert('Change Role', `Select a new role for ${membership.user?.name}`, [
      ...options,
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveMember = (membership: Membership) => {
    if (!isAdmin || membership.user_id === user?.id) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${membership.user?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember(selectedClubId!, membership.user_id),
        },
      ]
    );
  };

  const renderMemberItem = ({ item }: { item: Membership }) => (
    <MemberCard
      membership={item}
      isCurrentUser={item.user_id === user?.id}
      canManage={isAdmin && item.user_id !== user?.id}
      onPress={
        isAdmin && item.user_id !== user?.id
          ? () => {
              Alert.alert('Member Options', `Options for ${item.user?.name}`, [
                { text: 'Change Role', onPress: () => handleRoleChange(item) },
                {
                  text: 'Remove from Club',
                  style: 'destructive',
                  onPress: () => handleRemoveMember(item),
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }
          : undefined
      }
    />
  );

  // Sort members: admins first, then committee, then members
  const sortedMembers = [...clubMembers].sort((a, b) => {
    const roleOrder: Record<MemberRole, number> = { admin: 0, committee: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  if (clubs.length === 0) {
    return (
      <EmptyState
        title="No Clubs Yet"
        description="Join or create a club to see members"
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

      {/* Invite Button */}
      {isAdmin && selectedClubId && (
        <View style={styles.inviteContainer}>
          <Button
            title="Invite Members"
            onPress={() => navigation.navigate('InviteMembers', { clubId: selectedClubId })}
            size="sm"
            fullWidth
          />
        </View>
      )}

      {/* Member Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {clubMembers.length} {clubMembers.length === 1 ? 'member' : 'members'}
        </Text>
      </View>

      {/* Members List */}
      {isLoading && clubMembers.length === 0 ? (
        <LoadingSpinner text="Loading members..." />
      ) : clubMembers.length === 0 ? (
        <EmptyState
          title="No Members"
          description="Invite members to join your club"
          actionLabel="Invite Members"
          onAction={
            isAdmin && selectedClubId
              ? () => navigation.navigate('InviteMembers', { clubId: selectedClubId })
              : undefined
          }
        />
      ) : (
        <FlatList
          data={sortedMembers}
          keyExtractor={(item) => item.user_id}
          renderItem={renderMemberItem}
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
  inviteContainer: {
    padding: Spacing.md,
    paddingBottom: 0,
  },
  countContainer: {
    padding: Spacing.md,
    paddingBottom: 0,
  },
  countText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  list: {
    padding: Spacing.md,
  },
});
