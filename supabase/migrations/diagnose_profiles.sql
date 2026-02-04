-- Диагностика: Проверка текущей структуры profiles
-- Выполните этот SQL чтобы увидеть что есть в таблице

-- 1. Проверить существует ли таблица
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
) AS table_exists;

-- 2. Показать все колонки таблицы profiles
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Показать все политики RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Показать все триггеры
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 5. Показать количество записей
SELECT COUNT(*) as total_profiles FROM public.profiles;
