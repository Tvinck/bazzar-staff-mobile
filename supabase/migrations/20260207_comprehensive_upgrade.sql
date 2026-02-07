-- Comprehensive Upgrade Migration
-- 1. Procedures (Wiki/SOPs)
CREATE TABLE IF NOT EXISTS public.procedures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    steps JSONB DEFAULT '[]'::JSONB, -- Array of step objects { "text": "...", "image": "..." }
    scripts JSONB DEFAULT '[]'::JSONB, -- Array of copy-paste scripts { "label": "...", "text": "..." }
    tags TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Transactions (Finance)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL, -- e.g., 'Marketing', 'Salary', 'COGS', 'Sale'
    description TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Integrations (Tokens & Config)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service TEXT NOT NULL UNIQUE, -- 'avito', 'dbm', 'telegram_bot'
    config JSONB NOT NULL DEFAULT '{}'::JSONB, -- Stores encrypted tokens or public config
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Policies (Allow all authenticated users/staff to read/write for now)
CREATE POLICY "Enable read access for all users" ON public.procedures FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.procedures FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.procedures FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.integrations FOR SELECT USING (true);
CREATE POLICY "Enable update access for all users" ON public.integrations FOR UPDATE USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_procedures_tags ON public.procedures USING GIN(tags);

-- Notifications for Integrations
ALTER TABLE public.integrations REPLICA IDENTITY FULL;
