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
import { usePaymentStore } from '../../stores';
import { Button, Input } from '../../components/ui';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

type RouteProps = RouteProp<RootStackParamList, 'CreatePayment'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CreatePaymentScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { clubId } = route.params;
  const { createPaymentRequest } = usePaymentStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payment = await createPaymentRequest({
        club_id: clubId,
        title: title.trim(),
        description: description.trim() || null,
        amount: parseFloat(amount),
        due_date: dueDate?.toISOString().split('T')[0] || null,
      });

      Alert.alert(
        'Payment Request Created!',
        'All members will be notified.',
        [
          {
            text: 'View Details',
            onPress: () => navigation.replace('PaymentDetails', { paymentId: payment.id }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create payment request');
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
        <Text style={styles.title}>Create Payment Request</Text>
        <Text style={styles.subtitle}>
          Request payment from all club members
        </Text>

        <View style={styles.form}>
          <Input
            label="Title"
            placeholder="What is this payment for?"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
            autoFocus
          />

          <Input
            label="Amount (SGD)"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            error={errors.amount}
            leftIcon={<Text style={styles.currencyPrefix}>S$</Text>}
          />

          <Input
            label="Description (Optional)"
            placeholder="Add payment details"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          {/* Due Date */}
          <View style={styles.dateField}>
            <Text style={styles.label}>Due Date (Optional)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, !dueDate && styles.placeholder]}>
                {dueDate ? format(dueDate, 'MMMM d, yyyy') : 'Set due date'}
              </Text>
            </TouchableOpacity>
            {dueDate && (
              <TouchableOpacity onPress={() => setDueDate(null)}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setDueDate(date);
              }}
              minimumDate={new Date()}
            />
          )}

          <Button
            title="Create Payment Request"
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
  currencyPrefix: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  textArea: {
    height: 80,
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
  button: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
});
