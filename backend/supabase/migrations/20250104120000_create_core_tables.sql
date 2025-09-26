-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('Story & Values', 'Joy & Humanity', 'Passion & Dreams', 'Connection', 'Optional Fun')),
  question_text text NOT NULL,
  display_order integer DEFAULT 0,
  is_required boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tags table for interest tags
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name text UNIQUE NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, question_id)
);

-- Create user_tags junction table
CREATE TABLE IF NOT EXISTS public.user_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, tag_id)
);

-- Create form_settings table
CREATE TABLE IF NOT EXISTS public.form_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create communities table (was events)
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  date text NOT NULL,
  description text DEFAULT '',
  cover_image text DEFAULT '',
  is_private boolean DEFAULT false,
  participant_count integer DEFAULT 0,
  tags text[] DEFAULT ARRAY[]::text[],
  user_id uuid REFERENCES public.profiles(id),
  organization_id uuid,
  community_series text,
  sequence_number integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_order ON public.questions(display_order);
CREATE INDEX IF NOT EXISTS idx_answers_profile ON public.answers(profile_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_profile ON public.user_tags(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag ON public.user_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_form_settings_key ON public.form_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_communities_organization ON public.communities(organization_id);
CREATE INDEX IF NOT EXISTS idx_communities_user ON public.communities(user_id);

-- Add updated_at triggers
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON public.answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_settings_updated_at BEFORE UPDATE ON public.form_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Questions policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active questions" ON public.questions
FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage all questions" ON public.questions
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

-- Tags policies
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tags" ON public.tags
FOR SELECT USING (true);

CREATE POLICY "Super admins can manage tags" ON public.tags
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

-- Answers policies
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own answers" ON public.answers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = answers.profile_id
    AND (profiles.user_id = auth.uid() OR profiles.email = auth.email())
  )
);

CREATE POLICY "Super admins can view all answers" ON public.answers
FOR SELECT USING (
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

-- User tags policies
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tags" ON public.user_tags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_tags.profile_id
    AND (profiles.user_id = auth.uid() OR profiles.email = auth.email())
  )
);

-- Form settings policies
ALTER TABLE public.form_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view form settings" ON public.form_settings
FOR SELECT USING (true);

CREATE POLICY "Super admins can manage form settings" ON public.form_settings
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

-- Communities policies
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public communities" ON public.communities
FOR SELECT USING (is_private = false);

CREATE POLICY "Users can view communities they created" ON public.communities
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = communities.user_id
    AND (profiles.user_id = auth.uid() OR profiles.email = auth.email())
  )
);

CREATE POLICY "Super admins can manage all communities" ON public.communities
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