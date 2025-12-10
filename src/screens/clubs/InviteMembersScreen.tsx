import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { RootStackParamList } from '../../types';
import { useClubStore } from '../../stores';
import { Button, Card, LoadingSpinner } from '../../components/ui';
import { Colors, FontSize, Spacing } from '../../constants/theme';

type RouteProps = RouteProp<RootStackParamList, 'InviteMembers'>;

export const InviteMembersScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { clubId } = route.params;

  const { currentClub, fetchClubById } = useClubStore();
  const [isLoading, setIsLoading] = useState(!currentClub || currentClub.id !== clubId);

  useEffect(() => {
    if (!currentClub || currentClub.id !== clubId) {
      loadClub();
    }
  }, [clubId]);

  const loadClub = async () => {
    try {
      await fetchClubById(clubId);
    } catch (error) {
      console.error('Error loading club:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const inviteCode = currentClub?.invite_code || '';
  const inviteLink = `clubmanagement://join/${inviteCode}`;

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('Copied!', 'Invite code copied to clipboard');
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    Alert.alert('Copied!', 'Invite link copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join ${currentClub?.name} on Club Management App!\n\nUse invite code: ${inviteCode}\n\nOr click this link: ${inviteLink}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Invite Members</Text>
        <Text style={styles.subtitle}>
          Share the invite code or QR code with potential members
        </Text>

        {/* QR Code */}
        <Card style={styles.qrCard}>
          <View style={styles.qrContainer}>
            <QRCode
              value={inviteLink}
              size={200}
              color={Colors.textPrimary}
              backgroundColor={Colors.surface}
            />
          </View>
          <Text style={styles.qrHint}>Scan to join {currentClub?.name}</Text>
        </Card>

        {/* Invite Code */}
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Invite Code</Text>
          <Text style={styles.code}>{inviteCode}</Text>
          <Button
            title="Copy Code"
            onPress={handleCopyCode}
            variant="outline"
            size="sm"
            fullWidth
            style={styles.copyButton}
          />
        </Card>

        {/* Share Button */}
        <Button
          title="Share Invite"
          onPress={handleShare}
          fullWidth
          style={styles.shareButton}
        />

        <Button
          title="Copy Link"
          onPress={handleCopyLink}
          variant="outline"
          fullWidth
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
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
  qrCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  qrContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  qrHint: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  codeCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  codeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  code: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  copyButton: {
    marginTop: Spacing.sm,
  },
  shareButton: {
    marginBottom: Spacing.md,
  },
});
