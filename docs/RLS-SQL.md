# Spring Nest RLS SQL 完整脚本

本文档包含 Supabase 数据库的完整 SQL 脚本，包括建表、索引、触发器和 RLS 策略。

在 Supabase Dashboard → SQL Editor 中执行以下脚本。

---

## 1. 启用必要扩展

```sql
-- 启用 UUID 生成扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 2. 创建 profiles 表

```sql
-- 用户资料表，与 Supabase Auth 的 auth.users 一一对应
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL DEFAULT '',
  bio         TEXT DEFAULT '',
  avatar_url  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 添加表注释
COMMENT ON TABLE public.profiles IS '用户资料表';
COMMENT ON COLUMN public.profiles.id IS '用户 ID，关联 auth.users';
COMMENT ON COLUMN public.profiles.username IS '用户昵称';
COMMENT ON COLUMN public.profiles.bio IS '个人简介';
COMMENT ON COLUMN public.profiles.avatar_url IS '头像 URL';

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略: 用户可以读取自己的 profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS 策略: 用户可以更新自己的 profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS 策略: 允许触发器插入新 profile (通过 service_role)
CREATE POLICY "profiles_insert_trigger"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

---

## 3. 创建 favorites 表

```sql
-- 用户收藏表
CREATE TABLE IF NOT EXISTS public.favorites (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  item_type   TEXT NOT NULL CHECK (item_type IN ('game', 'tool')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- 添加表注释
COMMENT ON TABLE public.favorites IS '用户收藏表';
COMMENT ON COLUMN public.favorites.item_id IS '收藏项 ID (如 2048, calculator)';
COMMENT ON COLUMN public.favorites.item_type IS '收藏类型: game 或 tool';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_item ON public.favorites(user_id, item_id);

-- 启用 RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS 策略: 用户可以读取自己的收藏
CREATE POLICY "favorites_select_own"
  ON public.favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略: 用户可以添加收藏
CREATE POLICY "favorites_insert_own"
  ON public.favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略: 用户可以删除自己的收藏
CREATE POLICY "favorites_delete_own"
  ON public.favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

## 4. 创建 game_scores 表

```sql
-- 游戏分数表
CREATE TABLE IF NOT EXISTS public.game_scores (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_slug   TEXT NOT NULL,
  score       INTEGER NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 添加表注释
COMMENT ON TABLE public.game_scores IS '游戏分数记录表';
COMMENT ON COLUMN public.game_scores.game_slug IS '游戏标识 (2048, memory, whackamole)';
COMMENT ON COLUMN public.game_scores.score IS '分数/成绩';
COMMENT ON COLUMN public.game_scores.metadata IS '额外数据 (用时、步数等)';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_game_scores_user_game ON public.game_scores(user_id, game_slug);
CREATE INDEX IF NOT EXISTS idx_game_scores_leaderboard ON public.game_scores(game_slug, score DESC);

-- 启用 RLS
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- RLS 策略: 用户可以读取自己的分数
CREATE POLICY "game_scores_select_own"
  ON public.game_scores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略: 用户可以提交分数
CREATE POLICY "game_scores_insert_own"
  ON public.game_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略: 用户可以更新自己的分数
CREATE POLICY "game_scores_update_own"
  ON public.game_scores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 5. 创建 user_settings 表

```sql
-- 用户设置表
CREATE TABLE IF NOT EXISTS public.user_settings (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  theme         TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language      TEXT NOT NULL DEFAULT 'zh' CHECK (language IN ('zh', 'en')),
  notifications JSONB DEFAULT '{"email": true, "push": true, "updates": false, "promotions": false}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 添加表注释
COMMENT ON TABLE public.user_settings IS '用户设置表';
COMMENT ON COLUMN public.user_settings.theme IS '主题偏好: light, dark, system';
COMMENT ON COLUMN public.user_settings.language IS '语言偏好: zh, en';
COMMENT ON COLUMN public.user_settings.notifications IS '通知设置';

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 启用 RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS 策略: 用户可以读取自己的设置
CREATE POLICY "user_settings_select_own"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略: 用户可以创建设置
CREATE POLICY "user_settings_insert_own"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略: 用户可以更新自己的设置
CREATE POLICY "user_settings_update_own"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 6. 创建 tool_usage 表

```sql
-- 工具使用记录表
CREATE TABLE IF NOT EXISTS public.tool_usage (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_slug   TEXT NOT NULL,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata    JSONB DEFAULT '{}'
);

-- 添加表注释
COMMENT ON TABLE public.tool_usage IS '工具使用记录表';
COMMENT ON COLUMN public.tool_usage.tool_slug IS '工具标识 (calculator, pomodoro 等)';
COMMENT ON COLUMN public.tool_usage.metadata IS '额外使用数据';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON public.tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_slug ON public.tool_usage(tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_usage_used_at ON public.tool_usage(used_at DESC);

-- 启用 RLS
ALTER TABLE public.tool_usage ENABLE ROW LEVEL SECURITY;

-- RLS 策略: 用户可以读取自己的使用记录
CREATE POLICY "tool_usage_select_own"
  ON public.tool_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略: 用户可以记录使用行为
CREATE POLICY "tool_usage_insert_own"
  ON public.tool_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

---

## 7. 创建触发器函数

```sql
-- 自动更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为 profiles 表添加 updated_at 触发器
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 为 user_settings 表添加 updated_at 触发器
CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

---

## 8. 新用户自动创建 profile 和 settings

```sql
-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', ''));

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定到 auth.users 的 INSERT 事件
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 9. 创建排行榜视图

```sql
-- 排行榜视图: 展示每个游戏的 Top 10 分数
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  gs.game_slug,
  gs.score,
  gs.metadata,
  gs.created_at,
  p.username
FROM public.game_scores gs
JOIN public.profiles p ON p.id = gs.user_id
WHERE gs.id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY game_slug ORDER BY score DESC) as rank
    FROM public.game_scores
  ) ranked
  WHERE rank <= 100
);

-- 排行榜视图的 RLS: 所有已认证用户可读取
-- 注意: 视图继承底层表的 RLS，但我们可以单独授权
GRANT SELECT ON public.leaderboard TO authenticated;
```

---

## 10. 授权

```sql
-- 授权 authenticated 角色访问所有表
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.game_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT SELECT, INSERT ON public.tool_usage TO authenticated;

-- 授权 anon 角色只读排行榜 (可选)
GRANT SELECT ON public.leaderboard TO anon;
```

---

## 执行顺序

1. 执行第 1 节 (扩展)
2. 执行第 2-6 节 (建表 + RLS)
3. 执行第 7-8 节 (触发器)
4. 执行第 9 节 (视图)
5. 执行第 10 节 (授权)
6. 在 Supabase Dashboard 验证所有表和策略

## 验证脚本

执行以下 SQL 验证配置是否正确:

```sql
-- 检查所有表是否启用 RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'favorites', 'game_scores', 'user_settings', 'tool_usage');

-- 预期: 所有表的 rowsecurity = true

-- 检查所有 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- 预期: 每个表至少有 SELECT 和 INSERT 策略

-- 检查触发器
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 预期: profiles 和 user_settings 有 updated_at 触发器
```

## 相关文档

- [数据库设计](./数据库设计.md) — 表结构和 ER 图
- [安全规则](./安全规则.md) — RLS 策略说明和安全规则
