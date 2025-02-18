

-- 启用行级安全
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 创建访问策略
CREATE POLICY "Users can view own settings"
    ON user_settings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admin users can manage all settings"
    ON user_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_settings
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- 为 admin@admin.com 用户添加管理员权限
INSERT INTO user_settings (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'admin@admin.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', is_active = true; 