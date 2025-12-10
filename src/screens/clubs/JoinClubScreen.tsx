import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Club } from '../../types';
import { useClubStore } from '../../stores';
import { Button, Input, Card, Avatar, LoadingSpinner } from '../../components/ui';
import { Colors, FontSize, Spacing } from '../../constants/theme';

type RouteProps = RouteProp<RootStackParamList, 'JoinClub'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const JoinClubScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { fetchClubByInviteCode, joinClub } = useClubStore();

  const [inviteCode, setInviteCode] = useState(route.params?.inviteCode || '');
  const [foundClub, setFoundClub] = useState<Club | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (route.params?.inviteCode) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsSearching(true);
    setError('');
    setFoundClub(null);

    try {
      const club = await fetchClubByInviteCode(inviteCode.trim());
      if (club) {
        setFoundClub(club);
      } else {
        setError('No club found with this invite code');
      }
    } catch (error: any) {
      setError('Failed to search for club');
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoin = async () => {
    if (!foundClub) return;

    setIsJoining(true);
    try {
      await joinClub(foundClub.id);
      Alert.alert(
        'Joined!',
        `You are now a member of ${foundClub.name}`,
        [
          {
            text: 'View Club',
            onPress: () => navigation.replace('ClubDetails', { clubId: foundClub.id }),
          },
        ]
      );
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        Alert.alert('Already a Member', 'You are already a member of this club');
      } else {
        Alert.alert('Error', error.message || 'Failed to join club');
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Join a Club</Text>
        <Text style={styles.subtitle}>
          Enter the invite code to join an existing club
        </Text>

        <View style={styles.form}>
          <Input
            label="Invite Code"
            placeholder="Enter invite code"
            value={inviteCode}
            onChangeText={(text) => {
              setInviteCode(text);
              setFoundClub(null);
              setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            error={error}
          />

          <Button
            title="Search"
            onPress={handleSearch}
            isLoading={isSearching}
            fullWidth
            disabled={!inviteCode.trim()}
          />

          {foundClub && (
            <Card style={styles.clubCard}>
              <View style={styles.clubInfo}>
                <Avatar uri={foundClub.logo_url} name={foundClub.name} size="lg" />
                <View style={styles.clubDetails}>
                  <Text style={styles.clubName}>{foundClub.name}</Text>
                  {foundClub.description && (
                    <Text style={styles.clubDescription} numberOfLines={2}>
                      {foundClub.description}
                    </Text>
                  )}
                </View>
              </View>
              <Button
                title="Join Club"
                onPress={handleJoin}
                isLoading={isJoining}
                fullWidth
                style={styles.joinButton}
              />
            </Card>
          )}
        </View>

        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          fullWidth
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  form: {
    flex: 1,
    marginBottom: Spacing.lg,
  },
  clubCard: {
    marginTop: Spacing.lg,
  },
  clubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  clubDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  clubName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  clubDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  joinButton: {
    marginTop: Spacing.sm,
  },
});
