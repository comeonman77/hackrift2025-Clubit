import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ClubEvent, Rsvp, RsvpStatus } from '../types';

interface EventState {
  events: Map<string, ClubEvent[]>;
  currentEvent: ClubEvent | null;
  rsvps: Map<string, Rsvp[]>;
  isLoading: boolean;

  // Actions
  fetchClubEvents: (clubId: string) => Promise<ClubEvent[]>;
  fetchEventById: (eventId: string) => Promise<ClubEvent | null>;
  fetchUpcomingEvents: () => Promise<ClubEvent[]>;
  createEvent: (event: Omit<ClubEvent, 'id' | 'created_at' | 'created_by'>) => Promise<ClubEvent>;
  updateEvent: (eventId: string, updates: Partial<ClubEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  fetchEventRsvps: (eventId: string) => Promise<Rsvp[]>;
  submitRsvp: (eventId: string, status: RsvpStatus) => Promise<void>;
  setCurrentEvent: (event: ClubEvent | null) => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: new Map(),
  currentEvent: null,
  rsvps: new Map(),
  isLoading: false,

  fetchClubEvents: async (clubId: string) => {
    set({ isLoading: true });

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('events_with_rsvp_counts')
      .select('*')
      .eq('club_id', clubId)
      .order('start_time', { ascending: true });

    if (error) {
      set({ isLoading: false });
      throw error;
    }

    // Get user's RSVPs for these events
    let userRsvps: Record<string, RsvpStatus> = {};
    if (user && data) {
      const eventIds = data.map(e => e.id);
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('event_id, status')
        .eq('user_id', user.id)
        .in('event_id', eventIds);

      if (rsvpData) {
        rsvpData.forEach(r => {
          userRsvps[r.event_id] = r.status as RsvpStatus;
        });
      }
    }

    const events = (data || []).map(e => ({
      ...e,
      rsvp_counts: {
        going: e.going_count || 0,
        maybe: e.maybe_count || 0,
        not_going: e.not_going_count || 0,
      },
      user_rsvp: userRsvps[e.id] || null,
    }));

    set(state => {
      const newEvents = new Map(state.events);
      newEvents.set(clubId, events);
      return { events: newEvents, isLoading: false };
    });

    return events;
  },

  fetchEventById: async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('events_with_rsvp_counts')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    let userRsvp: RsvpStatus | null = null;
    if (user) {
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (rsvpData) {
        userRsvp = rsvpData.status as RsvpStatus;
      }
    }

    const event: ClubEvent = {
      ...data,
      rsvp_counts: {
        going: data.going_count || 0,
        maybe: data.maybe_count || 0,
        not_going: data.not_going_count || 0,
      },
      user_rsvp: userRsvp,
    };

    set({ currentEvent: event });
    return event;
  },

  fetchUpcomingEvents: async () => {
    set({ isLoading: true });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoading: false });
      return [];
    }

    // Get user's club IDs
    const { data: memberships } = await supabase
      .from('memberships')
      .select('club_id')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      set({ isLoading: false });
      return [];
    }

    const clubIds = memberships.map(m => m.club_id);

    const { data, error } = await supabase
      .from('events_with_rsvp_counts')
      .select('*')
      .in('club_id', clubIds)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(20);

    if (error) {
      set({ isLoading: false });
      throw error;
    }

    set({ isLoading: false });
    return data || [];
  },

  createEvent: async (eventData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Refresh club events
    await get().fetchClubEvents(eventData.club_id);

    return data;
  },

  updateEvent: async (eventId: string, updates: Partial<ClubEvent>) => {
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId);

    if (error) throw error;

    // Update current event if it's the same
    const currentEvent = get().currentEvent;
    if (currentEvent?.id === eventId) {
      set({ currentEvent: { ...currentEvent, ...updates } });
    }
  },

  deleteEvent: async (eventId: string) => {
    const currentEvent = get().currentEvent;
    const clubId = currentEvent?.club_id;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;

    // Refresh club events if we know the club
    if (clubId) {
      await get().fetchClubEvents(clubId);
    }

    if (currentEvent?.id === eventId) {
      set({ currentEvent: null });
    }
  },

  fetchEventRsvps: async (eventId: string) => {
    const { data, error } = await supabase
      .from('rsvps')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('event_id', eventId)
      .order('responded_at', { ascending: false });

    if (error) throw error;

    const rsvps = data as Rsvp[];
    set(state => {
      const newRsvps = new Map(state.rsvps);
      newRsvps.set(eventId, rsvps);
      return { rsvps: newRsvps };
    });

    return rsvps;
  },

  submitRsvp: async (eventId: string, status: RsvpStatus) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('rsvps')
      .upsert({
        event_id: eventId,
        user_id: user.id,
        status,
        responded_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Refresh event to get updated counts
    await get().fetchEventById(eventId);
  },

  setCurrentEvent: (event) => set({ currentEvent: event }),
}));
