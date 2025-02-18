-- 启用 RLS
alter table posts enable row level security;

-- 创建策略
create policy "启用公开文章的匿名读取"
on posts for select
to anon
using (status = 'published');

create policy "启用所有文章的已认证用户读取"
on posts for select
to authenticated
using (true);

create policy "启用已认证用户的文章创建"
on posts for insert
to authenticated
with check (true);

create policy "启用已认证用户的文章更新"
on posts for update
to authenticated
using (true)
with check (true);

create policy "启用已认证用户的文章删除"
on posts for delete
to authenticated
using (true); 