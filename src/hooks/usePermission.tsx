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
        console.log('No user found in auth store');
        setPermission(null);
        setLoading(false);
        return;
      }

      try {
        // 1. 验证当前会话
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Current auth state:', {
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          storeUserId: user.id,
          sessionError,
          accessToken: session?.access_token ? 'present' : 'missing'
        });

        if (!session?.access_token) {
          console.log('No valid session found, attempting to refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            console.error('Session refresh failed:', refreshError);
            setPermission(null);
            setLoading(false);
            return;
          }
        }

        // 2. 尝试直接查询
        console.log('Attempting to fetch permissions for user:', {
          userId: user.id,
          userEmail: user.email,
          sessionId: session?.user?.id,
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        const { data: directData, error: directError } = await supabase
          .from('user_settings')
          .select('role, is_active')
          .eq('id', user.id)
          .single();

        console.log('Permission query result:', {
          success: !directError,
          data: directData,
          error: directError?.message,
          errorDetails: directError?.details,
          queriedUserId: user.id,
          query: `SELECT role, is_active FROM user_settings WHERE id = '${user.id}'`
        });

        if (directError) {
          console.error('Failed to fetch permission:', {
            error: directError,
            message: directError.message,
            details: directError.details,
            hint: directError.hint,
            code: directError.code
          });
          setPermission(null);
        } else if (directData) {
          console.log('Setting permission from query:', {
            data: directData,
            userId: user.id,
            role: directData.role,
            isActive: directData.is_active
          });
          setPermission(directData as Permission);
        } else {
          console.log('No permission data found');
          setPermission(null);
        }
      } catch (error) {
        console.error('Error in permission check:', {
          error,
          userId: user.id,
          userEmail: user.email
        });
        setPermission(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPermission();
  }, [user]);

  const isAdmin = () => {
    const result = permission?.role === 'admin' && permission?.is_active;
    console.log('isAdmin check:', { 
      permission, 
      result,
      userId: user?.id,
      userEmail: user?.email 
    });
    return result;
  };
  
  const isEditor = () => {
    const result = (permission?.role === 'admin' || permission?.role === 'editor') && 
      permission?.is_active;
    console.log('isEditor check:', { 
      permission, 
      result,
      userId: user?.id,
      userEmail: user?.email 
    });
    return result;
  };
  
  const isActive = () => {
    const result = permission?.is_active ?? false;
    console.log('isActive check:', { 
      permission, 
      result,
      userId: user?.id,
      userEmail: user?.email 
    });
    return result;
  };

  const can = (action: 'manage_users' | 'manage_posts' | 'use_ai' | 'view_posts') => {
    if (!permission?.is_active) {
      console.log('Permission check failed:', {
        reason: 'user not active',
        permission,
        userId: user?.id,
        userEmail: user?.email
      });
      return false;
    }

    let result = false;
    switch (action) {
      case 'manage_users':
        result = permission.role === 'admin';
        break;
      case 'manage_posts':
        result = permission.role === 'admin' || permission.role === 'editor';
        break;
      case 'use_ai':
        result = permission.role === 'admin' || permission.role === 'editor';
        break;
      case 'view_posts':
        result = true;
        break;
    }
    
    console.log('Permission check:', { 
      action, 
      permission, 
      result,
      userId: user?.id,
      userEmail: user?.email
    });
    return result;
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