-- =============================================
-- Club Management App Database Schema
-- For Supabase (PostgreSQL)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Clubs table
CREATE TABLE public.clubs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  invite_code TEXT UNIQUE DEFAULT SUBSTR(MD5(RANDOM()::TEXT), 1, 8) NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Memberships table (junction table for users <-> clubs)
CREATE TABLE public.memberships (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'committee', 'member')) DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  PRIMARY KEY (user_id, club_id)
);

-- Events table
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- RSVPs table
CREATE TABLE public.rsvps (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('going', 'maybe', 'not_going')) NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  PRIMARY KEY (event_id, user_id)
);

-- Payment requests table
CREATE TABLE public.payment_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  due_date DATE,
  paynow_number TEXT, -- UEN or phone number for PayNow
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Payment records table
CREATE TABLE public.payment_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.payment_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid')) DEFAULT 'pending' NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  transaction_ref TEXT,
  confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE (request_id, user_id)
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('announcement', 'event_reminder', 'payment_due', 'new_member')) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_memberships_club_id ON public.memberships(club_id);
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_events_club_id ON public.events(club_id);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_rsvps_event_id ON public.rsvps(event_id);
CREATE INDEX idx_payment_requests_club_id ON public.payment_requests(club_id);
CREATE INDEX idx_payment_records_request_id ON public.payment_records(request_id);
CREATE INDEX idx_payment_records_user_id ON public.payment_records(user_id);
CREATE INDEX idx_announcements_club_id ON public.announcements(club_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_clubs_invite_code ON public.clubs(invite_code);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS (for avoiding RLS recursion)
-- =============================================

-- Function to check if user is a club member (bypasses RLS)
CREATE OR REPLACE FUNCTION is_club_member(club_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE club_id = club_uuid
    AND user_id = user_uuid
  );
$$;

-- Function to check if user is a club admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_club_admin(club_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE club_id = club_uuid
    AND user_id = user_uuid
    AND role = 'admin'
  );
$$;

-- Function to check if user is admin or committee (bypasses RLS)
CREATE OR REPLACE FUNCTION is_club_admin_or_committee(club_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE club_id = club_uuid
    AND user_id = user_uuid
    AND role IN ('admin', 'committee')
  );
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles policies
CREATE POLICY "Users can view any profile" ON public.profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Clubs policies
CREATE POLICY "Anyone can view clubs they are a member of" ON public.clubs
  FOR SELECT USING (is_club_member(id, auth.uid()));

CREATE POLICY "Anyone can view clubs by invite code" ON public.clubs
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create clubs" ON public.clubs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update their clubs" ON public.clubs
  FOR UPDATE USING (is_club_admin(id, auth.uid()));

CREATE POLICY "Admins can delete their clubs" ON public.clubs
  FOR DELETE USING (is_club_admin(id, auth.uid()));

-- Memberships policies (using SECURITY DEFINER functions to avoid recursion)
CREATE POLICY "Users can view their own memberships" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Members can view club memberships" ON public.memberships
  FOR SELECT USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Users can join clubs" ON public.memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update memberships" ON public.memberships
  FOR UPDATE USING (is_club_admin(club_id, auth.uid()));

CREATE POLICY "Members can leave clubs or admins can remove members" ON public.memberships
  FOR DELETE USING (
    auth.uid() = user_id OR is_club_admin(club_id, auth.uid())
  );

-- Events policies
CREATE POLICY "Members can view club events" ON public.events
  FOR SELECT USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Admins and committee can create events" ON public.events
  FOR INSERT WITH CHECK (is_club_admin_or_committee(club_id, auth.uid()));

CREATE POLICY "Admins and committee can update events" ON public.events
  FOR UPDATE USING (is_club_admin_or_committee(club_id, auth.uid()));

CREATE POLICY "Admins and committee can delete events" ON public.events
  FOR DELETE USING (is_club_admin_or_committee(club_id, auth.uid()));

-- RSVPs policies (need helper function for event club membership check)
CREATE OR REPLACE FUNCTION is_event_member(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_uuid
    AND is_club_member(e.club_id, user_uuid)
  );
$$;

CREATE POLICY "Members can view RSVPs for their club events" ON public.rsvps
  FOR SELECT USING (is_event_member(event_id, auth.uid()));

CREATE POLICY "Members can create their own RSVPs" ON public.rsvps
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND is_event_member(event_id, auth.uid())
  );

CREATE POLICY "Members can update their own RSVPs" ON public.rsvps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Members can delete their own RSVPs" ON public.rsvps
  FOR DELETE USING (auth.uid() = user_id);

-- Payment requests policies
CREATE POLICY "Members can view club payment requests" ON public.payment_requests
  FOR SELECT USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Admins can create payment requests" ON public.payment_requests
  FOR INSERT WITH CHECK (is_club_admin(club_id, auth.uid()));

CREATE POLICY "Admins can update payment requests" ON public.payment_requests
  FOR UPDATE USING (is_club_admin(club_id, auth.uid()));

CREATE POLICY "Admins can delete payment requests" ON public.payment_requests
  FOR DELETE USING (is_club_admin(club_id, auth.uid()));

-- Payment records policies (need helper function)
CREATE OR REPLACE FUNCTION is_payment_request_admin(request_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM payment_requests pr
    WHERE pr.id = request_uuid
    AND is_club_admin(pr.club_id, user_uuid)
  );
$$;

CREATE POLICY "Members can view their own payment records or admins can view all" ON public.payment_records
  FOR SELECT USING (
    auth.uid() = user_id OR is_payment_request_admin(request_id, auth.uid())
  );

CREATE POLICY "Admins can create payment records" ON public.payment_records
  FOR INSERT WITH CHECK (is_payment_request_admin(request_id, auth.uid()));

CREATE POLICY "Admins can update payment records" ON public.payment_records
  FOR UPDATE USING (is_payment_request_admin(request_id, auth.uid()));

-- Announcements policies
CREATE POLICY "Members can view club announcements" ON public.announcements
  FOR SELECT USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Admins and committee can create announcements" ON public.announcements
  FOR INSERT WITH CHECK (is_club_admin_or_committee(club_id, auth.uid()));

CREATE POLICY "Admins and committee can update announcements" ON public.announcements
  FOR UPDATE USING (is_club_admin_or_committee(club_id, auth.uid()));

CREATE POLICY "Admins and committee can delete announcements" ON public.announcements
  FOR DELETE USING (is_club_admin_or_committee(club_id, auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation (auto-create profile)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to auto-add creator as admin when club is created
CREATE OR REPLACE FUNCTION handle_new_club()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.memberships (user_id, club_id, role)
  VALUES (NEW.created_by, NEW.id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-adding club creator as admin
CREATE TRIGGER on_club_created
  AFTER INSERT ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_club();

-- Function to auto-create payment records for all members when payment request is created
CREATE OR REPLACE FUNCTION handle_new_payment_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.payment_records (request_id, user_id, status)
  SELECT NEW.id, m.user_id, 'pending'
  FROM public.memberships m
  WHERE m.club_id = NEW.club_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating payment records
CREATE TRIGGER on_payment_request_created
  AFTER INSERT ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_payment_request();

-- =============================================
-- VIEWS (Optional - for convenience)
-- =============================================

-- View for club with member count
CREATE OR REPLACE VIEW public.clubs_with_member_count AS
SELECT
  c.*,
  COUNT(m.user_id)::INTEGER AS member_count
FROM public.clubs c
LEFT JOIN public.memberships m ON c.id = m.club_id
GROUP BY c.id;

-- View for events with RSVP counts
CREATE OR REPLACE VIEW public.events_with_rsvp_counts AS
SELECT
  e.*,
  COUNT(CASE WHEN r.status = 'going' THEN 1 END)::INTEGER AS going_count,
  COUNT(CASE WHEN r.status = 'maybe' THEN 1 END)::INTEGER AS maybe_count,
  COUNT(CASE WHEN r.status = 'not_going' THEN 1 END)::INTEGER AS not_going_count
FROM public.events e
LEFT JOIN public.rsvps r ON e.id = r.event_id
GROUP BY e.id;

-- View for payment requests with payment status counts
CREATE OR REPLACE VIEW public.payment_requests_with_status AS
SELECT
  pr.*,
  COUNT(CASE WHEN rec.status = 'paid' THEN 1 END)::INTEGER AS paid_count,
  COUNT(rec.id)::INTEGER AS total_count
FROM public.payment_requests pr
LEFT JOIN public.payment_records rec ON pr.id = rec.request_id
GROUP BY pr.id;
