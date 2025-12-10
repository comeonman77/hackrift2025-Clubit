import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import {
  ClubDetailsScreen,
  CreateClubScreen,
  JoinClubScreen,
  InviteMembersScreen,
  CreateAnnouncementScreen,
} from '../screens/clubs';
import {
  EventDetailsScreen,
  CreateEventScreen,
} from '../screens/events';
import {
  PaymentDetailsScreen,
  CreatePaymentScreen,
} from '../screens/payments';
import { EditProfileScreen } from '../screens/profile';
import { useAuthStore } from '../stores';
import { Colors } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { session, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null; // Or a splash screen
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      {!session ? (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ClubDetails"
            component={ClubDetailsScreen}
            options={{ title: 'Club' }}
          />
          <Stack.Screen
            name="CreateClub"
            component={CreateClubScreen}
            options={{ title: 'Create Club', presentation: 'modal' }}
          />
          <Stack.Screen
            name="JoinClub"
            component={JoinClubScreen}
            options={{ title: 'Join Club', presentation: 'modal' }}
          />
          <Stack.Screen
            name="InviteMembers"
            component={InviteMembersScreen}
            options={{ title: 'Invite Members' }}
          />
          <Stack.Screen
            name="EventDetails"
            component={EventDetailsScreen}
            options={{ title: 'Event' }}
          />
          <Stack.Screen
            name="CreateEvent"
            component={CreateEventScreen}
            options={{ title: 'Create Event', presentation: 'modal' }}
          />
          <Stack.Screen
            name="PaymentDetails"
            component={PaymentDetailsScreen}
            options={{ title: 'Payment' }}
          />
          <Stack.Screen
            name="CreatePayment"
            component={CreatePaymentScreen}
            options={{ title: 'Create Payment', presentation: 'modal' }}
          />
          <Stack.Screen
            name="CreateAnnouncement"
            component={CreateAnnouncementScreen}
            options={{ title: 'New Announcement', presentation: 'modal' }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
