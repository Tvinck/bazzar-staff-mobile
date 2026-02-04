# 🔧 Пошаговая инструкция: Исправление регистрации

## 📋 Шаг 1: Диагностика

Выполните этот SQL в Supabase Dashboard → SQL Editor:

```sql
-- Проверить структуру таблицы profiles
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**Результат покажет:** какие колонки уже есть в таблице.

---

## 📋 Шаг 2: Применить исправление

Скопируйте и выполните этот SQL:

```sql
-- Добавить недостающие колонки
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff',
ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Включить RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Удалить старые политики
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Создать новые политики
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Создать функцию автосоздания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, created_at)
    VALUES (NEW.id, NEW.email, NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создать триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Создать функцию обновления updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создать триггер для updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Создать индексы
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_telegram_idx ON public.profiles(telegram);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at DESC);
```

---

## 📋 Шаг 3: Проверка

После выполнения проверьте что всё создалось:

```sql
-- 1. Проверить колонки
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Проверить политики
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- 3. Проверить триггеры
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'profiles';
```

**Ожидаемый результат:**

**Колонки:**
- id
- email
- telegram
- full_name
- avatar_url
- role
- balance
- xp
- rank
- created_at
- updated_at

**Политики:**
- Users can view own profile
- Users can update own profile
- Users can insert own profile

**Триггеры:**
- on_auth_user_created
- on_profile_updated

---

## 📋 Шаг 4: Тестирование

### 1. Открыть приложение
```
http://localhost:5173/
```

### 2. Зарегистрировать тестового пользователя
- Нажать "Создать аккаунт"
- Email: `test@example.com`
- Пароль: `test123`
- Ввести код из email
- Telegram: `@testuser`
- PIN: `1234`

### 3. Проверить в Supabase
```sql
-- Проверить пользователя
SELECT * FROM auth.users 
WHERE email = 'test@example.com';

-- Проверить профиль
SELECT * FROM public.profiles 
WHERE email = 'test@example.com';
```

**Должно быть:**
- Запись в `auth.users`
- Запись в `profiles` с тем же `id`
- Все поля заполнены

---

## ⚠️ Возможные проблемы

### Проблема 1: "column already exists"
**Решение:** Это нормально, `ADD COLUMN IF NOT EXISTS` пропустит существующие колонки.

### Проблема 2: "policy already exists"
**Решение:** Используем `DROP POLICY IF EXISTS` перед созданием.

### Проблема 3: Email не приходит
**Решение:** 
1. Проверить папку "Спам"
2. В Supabase Dashboard → Authentication → Email Templates
3. Проверить SMTP настройки

### Проблема 4: Профиль не создается автоматически
**Решение:**
```sql
-- Проверить что триггер работает
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';
```

---

## ✅ Готово!

После выполнения всех шагов:
- ✅ Таблица `profiles` настроена
- ✅ RLS политики работают
- ✅ Триггеры автосоздания профиля активны
- ✅ Регистрация полностью функциональна

**Можно тестировать регистрацию!** 🚀

---

## 📞 Если что-то не работает

Выполните диагностику:

```sql
-- Полная диагностика
SELECT 'Columns' as check_type, column_name as name 
FROM information_schema.columns 
WHERE table_name = 'profiles'

UNION ALL

SELECT 'Policies', policyname 
FROM pg_policies 
WHERE tablename = 'profiles'

UNION ALL

SELECT 'Triggers', trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';
```

Пришлите результат и я помогу разобраться! 🔧
