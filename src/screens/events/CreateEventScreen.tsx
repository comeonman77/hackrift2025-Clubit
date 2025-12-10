import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { RootStackParamList } from '../../types';
import { useEventStore } from '../../stores';
import { Button, Input, Card } from '../../components/ui';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

type RouteProps = RouteProp<RootStackParamList, 'CreateEvent'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CreateEventScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { clubId } = route.params;
  const { createEvent } = useEventStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; startDate?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (startDate < new Date()) {
      newErrors.startDate = 'Start date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const event = await createEvent({
        club_id: clubId,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        location_lat: null,
        location_lng: null,
        start_time: startDate.toISOString(),
        end_time: endDate?.toISOString() || null,
      });

      Alert.alert('Event Created!', `${event.title} has been scheduled.`, [
        {
          text: 'View Event',
          onPress: () => navigation.replace('EventDetails', { eventId: event.id }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create event');
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
        <Text style={styles.title}>Create Event</Text>

        <View style={styles.form}>
          <Input
            label="Event Title"
            placeholder="What's the event?"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
            autoFocus
          />

          <Input
            label="Description (Optional)"
            placeholder="Add details about the event"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <Input
            label="Location (Optional)"
            placeholder="Where is it happening?"
            value={location}
            onChangeText={setLocation}
          />

          {/* Start Date/Time */}
          <View style={styles.dateField}>
            <Text style={styles.label}>Start Date & Time</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {format(startDate, 'EEE, MMM d, yyyy · h:mm a')}
              </Text>
            </TouchableOpacity>
            {errors.startDate && (
              <Text style={styles.error}>{errors.startDate}</Text>
            )}
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="spinner"
              onChange={(event, date) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (date) setStartDate(date);
              }}
              minimumDate={new Date()}
            />
          )}

          {/* End Date/Time (Optional) */}
          <View style={styles.dateField}>
            <Text style={styles.label}>End Date & Time (Optional)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={[styles.dateButtonText, !endDate && styles.placeholder]}>
                {endDate
                  ? format(endDate, 'EEE, MMM d, yyyy · h:mm a')
                  : 'Set end time'}
              </Text>
            </TouchableOpacity>
            {endDate && (
              <TouchableOpacity onPress={() => setEndDate(null)}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {showEndPicker && (
            <DateTimePicker
              value={endDate || startDate}
              mode="datetime"
              display="spinner"
              onChange={(event, date) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (date) setEndDate(date);
              }}
              minimumDate={startDate}
            />
          )}

          <Button
            title="Create Event"
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
    marginBottom: Spacing.xl,
  },
  form: {
    flex: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateField: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  dateButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  dateButtonText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textTertiary,
  },
  clearText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  error: {
    fontSize: FontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  button: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
});
