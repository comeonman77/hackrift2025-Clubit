import React, { useState } from 'react';
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
import { RootStackParamList } from '../../types';
import { useAnnouncementStore } from '../../stores';
import { Button, Input } from '../../components/ui';
import { Colors, FontSize, Spacing } from '../../constants/theme';

type RouteProps = RouteProp<RootStackParamList, 'CreateAnnouncement'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CreateAnnouncementScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { clubId } = route.params;
  const { createAnnouncement } = useAnnouncementStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await createAnnouncement({
        club_id: clubId,
        title: title.trim(),
        content: content.trim(),
      });

      Alert.alert('Announcement Posted!', 'All members will be notified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post announcement');
    } finally {
      setIsLoading(false);
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
        <Text style={styles.title}>New Announcement</Text>
        <Text style={styles.subtitle}>
          Share updates with all club members
        </Text>

        <View style={styles.form}>
          <Input
            label="Title"
            placeholder="Announcement title"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
            autoFocus
          />

          <Input
            label="Content"
            placeholder="Write your announcement..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
            style={styles.textArea}
            error={errors.content}
          />

          <Button
            title="Post Announcement"
            onPress={handleCreate}
            isLoading={isLoading}
            fullWidth
            style={styles.button}
          />

          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="ghost"
            fullWidth
          />
        </View>
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
  },
  textArea: {
    height: 160,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
});
