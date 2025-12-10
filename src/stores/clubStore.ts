import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Club, Membership, MemberRole } from '../types';

interface ClubState {
  clubs: Club[];
  currentClub: Club | null;
  memberships: Map<string, Membership[]>;
  userRoles: Map<string, MemberRole>;
  isLoading: boolean;

  // Actions
  fetchUserClubs: () => Promise<void>;
  fetchClubById: (clubId: string) => Promise<Club | null>;
  fetchClubByInviteCode: (inviteCode: string) => Promise<Club | null>;
  createClub: (name: string, description?: string) => Promise<Club>;
  updateClub: (clubId: string, updates: Partial<Club>) => Promise<void>;
  deleteClub: (clubId: string) => Promise<void>;
  joinClub: (clubId: string) => Promise<void>;
  leaveClub: (clubId: string) => Promise<void>;
  fetchClubMembers: (clubId: string) => Promise<Membership[]>;
  updateMemberRole: (clubId: string, userId: string, role: MemberRole) => Promise<void>;
  removeMember: (clubId: string, userId: string) => Promise<void>;
  setCurrentClub: (club: Club | null) => void;
  getUserRole: (clubId: string) => MemberRole | undefined;
}

export const useClubStore = create<ClubState>((set, get) => ({
  clubs: [],
  currentClub: null,
  memberships: new Map(),
  userRoles: new Map(),
  isLoading: false,

  fetchUserClubs: async () => {
    set({ isLoading: true });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoading: false });
      return;
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select('club_id, role')
      .eq('user_id', user.id);

    if (membershipError) {
      set({ isLoading: false });
      throw membershipError;
    }

    if (!memberships || memberships.length === 0) {
      set({ clubs: [], isLoading: false });
      return;
    }

    const clubIds = memberships.map(m => m.club_id);
    const userRoles = new Map<string, MemberRole>();
    memberships.forEach(m => userRoles.set(m.club_id, m.role as MemberRole));

    const { data: clubs, error: clubsError } = await supabase
      .from('clubs_with_member_count')
      .select('*')
      .in('id', clubIds)
      .order('created_at', { ascending: false });

    if (clubsError) {
      set({ isLoading: false });
      throw clubsError;
    }

    set({ clubs: clubs || [], userRoles, isLoading: false });
  },

  fetchClubById: async (clubId: string) => {
    const { data, error } = await supabase
      .from('clubs_with_member_count')
      .select('*')
      .eq('id', clubId)
      .single();

    if (error) throw error;

    set({ currentClub: data });
    return data;
  },

  fetchClubByInviteCode: async (inviteCode: string) => {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (error) return null;
    return data;
  },

  createClub: async (name: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name,
        description,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Refresh clubs list
    await get().fetchUserClubs();

    return data;
  },

  updateClub: async (clubId: string, updates: Partial<Club>) => {
    const { error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', clubId);

    if (error) throw error;

    // Update local state
    set(state => ({
      clubs: state.clubs.map(c => c.id === clubId ? { ...c, ...updates } : c),
      currentClub: state.currentClub?.id === clubId
        ? { ...state.currentClub, ...updates }
        : state.currentClub
    }));
  },

  deleteClub: async (clubId: string) => {
    const { error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId);

    if (error) throw error;

    set(state => ({
      clubs: state.clubs.filter(c => c.id !== clubId),
      currentClub: state.currentClub?.id === clubId ? null : state.currentClub
    }));
  },

  joinClub: async (clubId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('memberships')
      .insert({
        user_id: user.id,
        club_id: clubId,
        role: 'member'
      });

    if (error) throw error;

    // Refresh clubs list
    await get().fetchUserClubs();
  },

  leaveClub: async (clubId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('user_id', user.id)
      .eq('club_id', clubId);

    if (error) throw error;

    set(state => ({
      clubs: state.clubs.filter(c => c.id !== clubId),
      currentClub: state.currentClub?.id === clubId ? null : state.currentClub
    }));
  },

  fetchClubMembers: async (clubId: string) => {
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('club_id', clubId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const memberships = data as Membership[];
    set(state => {
      const newMemberships = new Map(state.memberships);
      newMemberships.set(clubId, memberships);
      return { memberships: newMemberships };
    });

    return memberships;
  },

  updateMemberRole: async (clubId: string, userId: string, role: MemberRole) => {
    const { error } = await supabase
      .from('memberships')
      .update({ role })
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) throw error;

    // Refresh members
    await get().fetchClubMembers(clubId);
  },

  removeMember: async (clubId: string, userId: string) => {
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) throw error;

    // Refresh members
    await get().fetchClubMembers(clubId);
  },

  setCurrentClub: (club) => set({ currentClub: club }),

  getUserRole: (clubId: string) => get().userRoles.get(clubId),
}));
