import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Announcement } from '../types';

interface AnnouncementState {
  announcements: Map<string, Announcement[]>;
  isLoading: boolean;

  // Actions
  fetchClubAnnouncements: (clubId: string) => Promise<Announcement[]>;
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'created_at' | 'created_by'>) => Promise<Announcement>;
  updateAnnouncement: (announcementId: string, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (announcementId: string, clubId: string) => Promise<void>;
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: new Map(),
  isLoading: false,

  fetchClubAnnouncements: async (clubId: string) => {
    set({ isLoading: true });

    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        author:profiles(id, name, avatar_url)
      `)
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });

    if (error) {
      set({ isLoading: false });
      throw error;
    }

    set(state => {
      const newAnnouncements = new Map(state.announcements);
      newAnnouncements.set(clubId, data || []);
      return { announcements: newAnnouncements, isLoading: false };
    });

    return data || [];
  },

  createAnnouncement: async (announcementData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...announcementData,
        created_by: user.id,
      })
      .select(`
        *,
        author:profiles(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Add to local state
    set(state => {
      const newAnnouncements = new Map(state.announcements);
      const clubAnnouncements = newAnnouncements.get(announcementData.club_id) || [];
      newAnnouncements.set(announcementData.club_id, [data, ...clubAnnouncements]);
      return { announcements: newAnnouncements };
    });

    return data;
  },

  updateAnnouncement: async (announcementId: string, updates: Partial<Announcement>) => {
    const { error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', announcementId);

    if (error) throw error;
  },

  deleteAnnouncement: async (announcementId: string, clubId: string) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) throw error;

    // Remove from local state
    set(state => {
      const newAnnouncements = new Map(state.announcements);
      const clubAnnouncements = newAnnouncements.get(clubId) || [];
      newAnnouncements.set(
        clubId,
        clubAnnouncements.filter(a => a.id !== announcementId)
      );
      return { announcements: newAnnouncements };
    });
  },
}));
