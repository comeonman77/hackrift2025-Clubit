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
import { RootStackParamList } from '../../types';
import { useAuthStore, useClubStore } from '../../stores';
import { ClubCard } from '../../components/clubs';
import { Button, EmptyState, LoadingSpinner, Avatar } from '../../components/ui';
import { Colors, FontSize, Spacing } from '../../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { clubs, userRoles, isLoading, fetchUserClubs } = useClubStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserClubs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserClubs();
    setRefreshing(false);
  };

  const renderClubItem = ({ item }: { item: typeof clubs[0] }) => (
    <ClubCard
      club={item}
      role={userRoles.get(item.id)}
      onPress={() => navigation.navigate('ClubDetails', { clubId: item.id })}
    />
  );

  if (isLoading && clubs.length === 0) {
    return <LoadingSpinner fullScreen text="Loading clubs..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.name?.split(' ')[0] || 'there'}!
          </Text>
          <Text style={styles.subtitle}>
            {clubs.length} {clubs.length === 1 ? 'club' : 'clubs'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
          <Avatar uri={user?.avatar_url} name={user?.name} size="md" />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <Button
          title="Create Club"
          onPress={() => navigation.navigate('CreateClub')}
          variant="primary"
          size="sm"
          style={styles.actionButton}
        />
        <Button
          title="Join Club"
          onPress={() => navigation.navigate('JoinClub', {})}
          variant="outline"
          size="sm"
          style={styles.actionButton}
        />
      </View>

      {clubs.length === 0 ? (
        <EmptyState
          title="No Clubs Yet"
          description="Create a new club or join an existing one to get started"
          actionLabel="Create Your First Club"
          onAction={() => navigation.navigate('CreateClub')}
        />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(item) => item.id}
          renderItem={renderClubItem}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  list: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
});
