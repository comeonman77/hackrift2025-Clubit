// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

// Club types
export interface Club {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export type MemberRole = 'admin' | 'committee' | 'member';

export interface Membership {
  user_id: string;
  club_id: string;
  role: MemberRole;
  joined_at: string;
  user?: User;
}

// Event types
export interface ClubEvent {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  start_time: string;
  end_time: string | null;
  created_by: string;
  created_at: string;
  rsvp_counts?: {
    going: number;
    maybe: number;
    not_going: number;
  };
  user_rsvp?: RsvpStatus | null;
}

export type RsvpStatus = 'going' | 'maybe' | 'not_going';

export interface Rsvp {
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  responded_at: string;
  user?: User;
}

// Payment types
export type PaymentStatus = 'pending' | 'paid';

export interface PaymentRequest {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  created_by: string;
  created_at: string;
  paid_count?: number;
  total_count?: number;
}

export interface PaymentRecord {
  id: string;
  request_id: string;
  user_id: string;
  status: PaymentStatus;
  paid_at: string | null;
  transaction_ref: string | null;
  confirmed_by: string | null;
  user?: User;
}

// Announcement types
export interface Announcement {
  id: string;
  club_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  author?: User;
}

// Notification types
export type NotificationType = 'announcement' | 'event_reminder' | 'payment_due' | 'new_member';

export interface Notification {
  id: string;
  user_id: string;
  club_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ClubDetails: { clubId: string };
  EventDetails: { eventId: string };
  CreateEvent: { clubId: string };
  CreatePayment: { clubId: string };
  PaymentDetails: { paymentId: string };
  CreateAnnouncement: { clubId: string };
  MemberProfile: { userId: string; clubId: string };
  InviteMembers: { clubId: string };
  JoinClub: { inviteCode?: string };
  CreateClub: undefined;
  EditClub: { clubId: string };
  EditProfile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  Payments: undefined;
  Members: undefined;
  Profile: undefined;
};
