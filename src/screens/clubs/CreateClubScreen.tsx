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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useClubStore } from '../../stores';
import { Button, Input } from '../../components/ui';
import { Colors, FontSize, Spacing } from '../../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CreateClubScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { createClub } = useClubStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const validate = () => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Club name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Club name must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const club = await createClub(name.trim(), description.trim() || undefined);
      Alert.alert(
        'Club Created!',
        `${club.name} has been created. Share the invite code: ${club.invite_code}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('ClubDetails', { clubId: club.id }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create club');
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
        <Text style={styles.title}>Create a New Club</Text>
        <Text style={styles.subtitle}>
          Set up your club and start inviting members
        </Text>

        <View style={styles.form}>
          <Input
            label="Club Name"
            placeholder="Enter club name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoFocus
          />

          <Input
            label="Description (Optional)"
            placeholder="What's your club about?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <Button
            title="Create Club"
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
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
});
