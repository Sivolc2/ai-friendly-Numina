-- Create profiles table first (required for other tables)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    role text DEFAULT 'member',
    story text DEFAULT '',
    cover_photo text DEFAULT '',
    photos text[] DEFAULT ARRAY[]::text[],
    main_photo text,
    social_links jsonb DEFAULT '{}'::jsonb,
    custom_links jsonb DEFAULT '[]'::jsonb,
    messenger_platforms jsonb DEFAULT '{}'::jsonb,
    tags text[] DEFAULT ARRAY[]::text[],
    event_id uuid,
    location text DEFAULT '',
    is_public boolean DEFAULT false,
    has_completed_profile boolean DEFAULT false,
    published_profile boolean DEFAULT false,
    video_url text DEFAULT '',
    photographer_tier text,
    can_invite boolean DEFAULT false,
    organization_id uuid,
    parent_organiser_id uuid,
    invited_by uuid,
    organization_name text,
    invitation_accepted_at timestamptz,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- AI story generation fields
    story_answers text,
    joy_humanity_answers text,
    passion_dreams_answers text,
    connection_preferences_answers text,
    open_ended_answer text,
    ai_generated_at timestamptz
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Basic profile access policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (
    auth.uid() = user_id OR
    auth.email() = email
);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.email() = email
);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    auth.email() = email
);

-- Super admin access policy
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE (user_id = auth.uid() OR email = auth.email())
        AND (
            email = 'derrick@derricksiu.com' OR
            role ILIKE '%super_admin%' OR
            role ILIKE '%founder%' OR
            role ILIKE '%ceo%'
        )
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_event_id ON public.profiles(event_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public);

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();