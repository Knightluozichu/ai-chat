import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'editor' | 'user';

interface Permission {
  role: UserRole;
  is_active: boolean;
}

export const usePermission = () => {
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermission = async () => {
      if (!user) {
        setPermission(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('role, is_active')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setPermission(data as Permission);
      } catch (error) {
        console.error('Error fetching user permission:', error);
        setPermission({ role: 'user', is_active: true });
      } finally {
        setLoading(false);
      }
    };

    fetchPermission();
  }, [user]);

  const isAdmin = () => permission?.role === 'admin' && permission?.is_active;
  const isEditor = () => 
    (permission?.role === 'admin' || permission?.role === 'editor') && 
    permission?.is_active;
  const isActive = () => permission?.is_active ?? false;

  const can = (action: 'manage_users' | 'manage_posts' | 'use_ai' | 'view_posts') => {
    if (!permission?.is_active) return false;

    switch (action) {
      case 'manage_users':
        return permission.role === 'admin';
      case 'manage_posts':
        return permission.role === 'admin' || permission.role === 'editor';
      case 'use_ai':
        return permission.role === 'admin' || permission.role === 'editor';
      case 'view_posts':
        return true;
      default:
        return false;
    }
  };

  return {
    loading,
    permission,
    isAdmin,
    isEditor,
    isActive,
    can
  };
}; 