import { useState, useEffect } from 'react';
import { Loader2, Search, Shield, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePermission } from '../../hooks/usePermission';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

const Users = () => {
  const { loading: permissionLoading, can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!permissionLoading && can('manage_users')) {
      fetchUsers();
    } else if (!permissionLoading) {
      setLoading(false);
    }
  }, [permissionLoading]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // 从视图获取用户列表
      const { data: users, error } = await supabase
        .from('users_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: User['role']) => {
    if (!can('manage_users')) {
      toast.error('您没有权限执行此操作');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ id: userId, role });

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
      
      toast.success('用户角色更新成功');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error('更新用户角色失败');
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    if (!can('manage_users')) {
      toast.error('您没有权限执行此操作');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ id: userId, is_active: isActive });

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: isActive } : user
      ));
      
      toast.success(`用户${isActive ? '启用' : '禁用'}成功`);
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast.error(`${isActive ? '启用' : '禁用'}用户失败`);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!can('manage_users')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          访问受限
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          抱歉，您没有权限访问此页面
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            管理系统用户及其权限
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-lg">
            <label htmlFor="search" className="sr-only">搜索用户</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="搜索用户邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as User['role'])}
                      className="block w-full px-3 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      aria-label="选择用户角色"
                    >
                      <option value="user">普通用户</option>
                      <option value="editor">编辑者</option>
                      <option value="admin">管理员</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {user.is_active ? '已启用' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : '从未登录'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="切换管理员权限"
                      >
                        <Shield className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id, !user.is_active)}
                        className={`${
                          user.is_active
                            ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                        }`}
                        title={user.is_active ? '禁用用户' : '启用用户'}
                      >
                        {user.is_active ? (
                          <UserX className="h-5 w-5" />
                        ) : (
                          <UserCheck className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users; 