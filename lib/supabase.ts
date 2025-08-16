import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Server-side Supabase client with service role key
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper function to get user session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
};

// Helper function to get user profile with institution data
export const getUserProfile = async (userId?: string) => {
  const user = userId || (await getCurrentUser())?.id;
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      institutions (
        id,
        name,
        code,
        settings
      )
    `)
    .eq('id', user)
    .single();

  if (error) {
    console.error('Error getting user profile:', error);
    return null;
  }

  return data;
};

// Helper function to check user permissions
export const checkPermission = async (
  userId: string,
  requiredRole: 'super_admin' | 'school_admin' | 'accountant' | 'teacher' | 'student' | 'parent'
) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !user) return false;

  const roleHierarchy = {
    super_admin: 5,
    school_admin: 4,
    accountant: 3,
    teacher: 2,
    student: 1,
    parent: 0,
  };

  return roleHierarchy[user.role as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
};

// Helper function to get institution context
export const getInstitutionContext = async (userId?: string) => {
  const profile = await getUserProfile(userId);
  if (!profile) return null;

  return {
    institutionId: profile.institution_id,
    institution: profile.institutions,
    userRole: profile.role,
  };
};

// Type for authenticated user
export type AuthenticatedUser = {
  id: string;
  email: string;
  role: 'super_admin' | 'school_admin' | 'accountant' | 'teacher' | 'student' | 'parent';
  institution_id: string | null;
  first_name: string;
  last_name: string;
  institution?: {
    id: string;
    name: string;
    code: string;
    settings: any;
  };
};

// Export types for use in components
export type { Database } from '@/types/supabase';
