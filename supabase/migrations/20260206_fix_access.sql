-- Ensure tables exist and have RLS policies that allow reading by everyone (anon/authenticated)
-- This is a staff-only app so we want visibility

-- Orders
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read access" ON orders;
CREATE POLICY "Allow anon read access" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated read access" ON orders;
CREATE POLICY "Allow authenticated read access" ON orders FOR SELECT USING (true);

-- Platform Chats
ALTER TABLE IF EXISTS platform_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read access" ON platform_chats;
CREATE POLICY "Allow anon read access" ON platform_chats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated read access" ON platform_chats;
CREATE POLICY "Allow authenticated read access" ON platform_chats FOR SELECT USING (true);

-- Platform Messages
ALTER TABLE IF EXISTS platform_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read access" ON platform_messages;
CREATE POLICY "Allow anon read access" ON platform_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated read access" ON platform_messages;
CREATE POLICY "Allow authenticated read access" ON platform_messages FOR SELECT USING (true);
