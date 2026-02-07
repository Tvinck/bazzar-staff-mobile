-- Comprehensive Upgrade Migration (Fix)

-- 1. Handle existing 'transactions' conflict
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        -- Check if it matches our desired schema roughly (has 'category')
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'category') THEN
            ALTER TABLE public.transactions RENAME TO transactions_old;
        END IF;
    END IF;
END $$;

-- 2. Handle existing 'integrations' conflict
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integrations') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'integrations' AND column_name = 'config') THEN
             ALTER TABLE public.integrations RENAME TO integrations_old;
        END IF;
    END IF;
END $$;

-- 3. Create Procedures (Wiki/SOPs)
CREATE TABLE IF NOT EXISTS public.procedures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    steps JSONB DEFAULT '[]'::JSONB,
    scripts JSONB DEFAULT '[]'::JSONB,
    tags TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Transactions (Finance)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Integrations (Tokens & Config)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service TEXT NOT NULL UNIQUE,
    config JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- Notifications
ALTER TABLE public.integrations REPLICA IDENTITY FULL;
