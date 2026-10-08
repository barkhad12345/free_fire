-- ============================================================================
-- DIMATOP — FREE FIRE DIAMONDS PRODUCTION DATABASE SCHEMA
-- PostgreSQL schema for Supabase with RLS, Triggers, & Roles
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 2. PROFILES TABLE (Linked directly to Supabase Auth users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT DEFAULT 'assets/images/avatar.jpg',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. PACKAGES TABLE (Diamond Top-up Packages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.packages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  diamonds INTEGER NOT NULL,
  bonus INTEGER DEFAULT 0,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  image_url TEXT NOT NULL DEFAULT 'assets/images/diamond-single.jpg',
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PAYMENT METHODS TABLE (ZAAD, EVC Plus, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  logo_url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  instructions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. ORDERS TABLE (Customer Purchase Records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  player_id TEXT NOT NULL,
  package_id BIGINT REFERENCES public.packages(id) ON DELETE SET NULL,
  diamonds INTEGER NOT NULL,
  bonus INTEGER DEFAULT 0,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_phone TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed
  order_status TEXT NOT NULL DEFAULT 'pending',   -- pending, processing, completed, cancelled
  transaction_reference TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. SUPPORT MESSAGES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open, resolved, closed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. HELPER SECURITY FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to check if the current requesting user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatic trigger to create a profile entry upon new user signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Free Fire Gamer'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'assets/images/avatar.jpg'),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::BOOLEAN, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public can view own profile or admins" ON public.profiles;
CREATE POLICY "Public can view own profile or admins"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- PACKAGES POLICIES
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;
CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT
  USING (active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages"
  ON public.packages FOR ALL
  USING (public.is_admin());

-- PAYMENT METHODS POLICIES
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods FOR SELECT
  USING (active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;
CREATE POLICY "Admins can manage payment methods"
  ON public.payment_methods FOR ALL
  USING (public.is_admin());

-- ORDERS POLICIES
DROP POLICY IF EXISTS "Users can view own orders or admins" ON public.orders;
CREATE POLICY "Users can view own orders or admins"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own order during payment or admins" ON public.orders;
CREATE POLICY "Users can update own order during payment or admins"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- SUPPORT MESSAGES POLICIES
DROP POLICY IF EXISTS "Users can view and create own support messages" ON public.support_messages;
CREATE POLICY "Users can view and create own support messages"
  ON public.support_messages FOR ALL
  USING (auth.uid() = user_id OR public.is_admin());

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications read status" ON public.notifications;
CREATE POLICY "Users can update own notifications read status"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 10. INITIAL SEED DATA
-- ----------------------------------------------------------------------------

-- Seed Packages
INSERT INTO public.packages (id, name, diamonds, bonus, price, currency, image_url, active, sort_order)
VALUES
  (1, '100 Diamonds', 100, 0, 1.00, 'USD', 'assets/images/diamond-single.jpg', TRUE, 1),
  (2, '310 Diamonds', 310, 15, 3.00, 'USD', 'assets/images/diamond-double.jpg', TRUE, 2),
  (3, '520 Diamonds', 520, 30, 5.00, 'USD', 'assets/images/diamond-single.jpg', TRUE, 3),
  (4, '1060 Diamonds', 1060, 120, 10.00, 'USD', 'assets/images/diamonds-pile.jpg', TRUE, 4),
  (5, '2180 Diamonds', 2180, 260, 20.00, 'USD', 'assets/images/diamonds-pile.jpg', TRUE, 5),
  (6, '5600 Diamonds', 5600, 800, 50.00, 'USD', 'assets/images/diamonds-chest.jpg', TRUE, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  diamonds = EXCLUDED.diamonds,
  bonus = EXCLUDED.bonus,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url;

-- Seed Payment Methods
INSERT INTO public.payment_methods (id, name, code, logo_url, active, instructions)
VALUES
  (1, 'ZAAD', 'ZAAD', 'assets/icons/zaad-logo.svg', TRUE, '["1. Enter your ZAAD number", "2. Confirm the payment", "3. Click Verify Payment"]'::jsonb),
  (2, 'EVC Plus', 'EVC_PLUS', 'assets/icons/evc-logo.svg', TRUE, '["1. Enter your EVC Plus number", "2. Accept prompt on your phone", "3. Click Verify Payment"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  logo_url = EXCLUDED.logo_url;
