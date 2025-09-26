-- Seed default data for the story capture platform

-- Insert default super admin profile
INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    story,
    location,
    is_public,
    has_completed_profile,
    created_at
) VALUES (
    gen_random_uuid(),
    'System Admin',
    'admin@ai-friendly-numina.com',
    'super_admin',
    'Platform administrator and founder',
    'San Francisco, CA',
    false,
    true,
    now()
) ON CONFLICT (email) DO UPDATE SET
    role = 'super_admin',
    name = COALESCE(EXCLUDED.name, profiles.name),
    has_completed_profile = true,
    updated_at = now();

-- Insert default questions by category

-- Story & Values Questions (Pick 2-3)
INSERT INTO public.questions (category, question_text, display_order, is_required, is_active) VALUES
('Story & Values', 'What''s a moment that changed you?', 1, false, true),
('Story & Values', 'What do you believe makes life meaningful?', 2, false, true),
('Story & Values', 'Tell me about a time you had to stand up for something you believed in.', 3, false, true),
('Story & Values', 'What''s a lesson you learned the hard way?', 4, false, true),
('Story & Values', 'What''s something you''ve changed your mind about as you''ve gotten older?', 5, false, true),
('Story & Values', 'What''s a value you hold that others might find surprising?', 6, false, true);

-- Joy & Humanity Questions (Pick 2-3)
INSERT INTO public.questions (category, question_text, display_order, is_required, is_active) VALUES
('Joy & Humanity', 'What brings you the most joy in your daily life?', 1, false, true),
('Joy & Humanity', 'Tell me about someone who has made a big impact on your life.', 2, false, true),
('Joy & Humanity', 'What''s something small that always makes you smile?', 3, false, true),
('Joy & Humanity', 'When do you feel most like yourself?', 4, false, true),
('Joy & Humanity', 'What''s something you do that makes others happy?', 5, false, true),
('Joy & Humanity', 'What''s a tradition or ritual that''s important to you?', 6, false, true);

-- Passion & Dreams Questions (Pick 2-3)
INSERT INTO public.questions (category, question_text, display_order, is_required, is_active) VALUES
('Passion & Dreams', 'What''s something you could talk about for hours?', 1, false, true),
('Passion & Dreams', 'If you could master any skill overnight, what would it be?', 2, false, true),
('Passion & Dreams', 'What''s a dream you''re working toward?', 3, false, true),
('Passion & Dreams', 'What''s something you''ve always wanted to try but haven''t yet?', 4, false, true),
('Passion & Dreams', 'What project or goal are you most excited about right now?', 5, false, true),
('Passion & Dreams', 'If you could solve one problem in the world, what would it be?', 6, false, true);

-- Connection Questions (Required)
INSERT INTO public.questions (category, question_text, display_order, is_required, is_active) VALUES
('Connection', 'Who do you most enjoy connecting with?', 1, true, true),
('Connection', 'What makes someone easy to talk to for you?', 2, false, true),
('Connection', 'What''s your ideal way to spend time with friends?', 3, false, true);

-- Optional Fun Questions
INSERT INTO public.questions (category, question_text, display_order, is_required, is_active) VALUES
('Optional Fun', 'What''s your go-to karaoke song?', 1, false, true),
('Optional Fun', 'If you were a character in a TV show, what show would it be?', 2, false, true),
('Optional Fun', 'What''s your most unpopular opinion about food?', 3, false, true),
('Optional Fun', 'What''s something you''re surprisingly good at?', 4, false, true),
('Optional Fun', 'If you could have dinner with anyone, living or dead, who would it be?', 5, false, true),
('Optional Fun', 'What''s the weirdest thing you believed as a child?', 6, false, true),
('Optional Fun', 'What''s your secret talent?', 7, false, true),
('Optional Fun', 'If you could live in any fictional world, where would you choose?', 8, false, true);

-- Insert default interest tags
INSERT INTO public.tags (tag_name, usage_count) VALUES
-- Creative Arts
('Photography', 0),
('Writing', 0),
('Painting', 0),
('Music', 0),
('Design', 0),
('Film', 0),
('Theater', 0),
('Dance', 0),

-- Technology & Innovation
('Coding', 0),
('AI', 0),
('Startups', 0),
('Blockchain', 0),
('Data Science', 0),
('Product Design', 0),
('UX/UI', 0),

-- Health & Wellness
('Fitness', 0),
('Yoga', 0),
('Meditation', 0),
('Mental Health', 0),
('Nutrition', 0),
('Running', 0),
('Hiking', 0),

-- Food & Cooking
('Cooking', 0),
('Baking', 0),
('Wine', 0),
('Coffee', 0),
('Food Photography', 0),
('Restaurants', 0),

-- Travel & Culture
('Travel', 0),
('Languages', 0),
('History', 0),
('Architecture', 0),
('Museums', 0),
('Street Art', 0),

-- Social & Community
('Volunteering', 0),
('Community Building', 0),
('Social Justice', 0),
('Education', 0),
('Mentoring', 0),
('Networking', 0),

-- Business & Career
('Entrepreneurship', 0),
('Leadership', 0),
('Marketing', 0),
('Sales', 0),
('Consulting', 0),
('Public Speaking', 0),

-- Hobbies & Interests
('Reading', 0),
('Gaming', 0),
('Sports', 0),
('Gardening', 0),
('DIY', 0),
('Fashion', 0),
('Pets', 0),
('Podcasts', 0),
('Chess', 0),
('Board Games', 0);

-- Insert default form settings
INSERT INTO public.form_settings (setting_key, setting_value, description) VALUES
('intro_text', 'Welcome! We''re excited to learn your story. This should take about 5-10 minutes.', 'Text shown at the beginning of the form'),
('ai_generation_enabled', 'true', 'Whether AI story generation is enabled'),
('min_questions_per_category', '2', 'Minimum questions to answer per category (Story, Joy, Passion)'),
('max_questions_per_category', '3', 'Maximum questions to answer per category (Story, Joy, Passion)'),
('photo_consent_required', 'true', 'Whether photo consent checkbox is required'),
('allow_custom_tags', 'true', 'Whether users can create custom interest tags'),
('form_completion_message', 'Thank you for sharing your story! Your profile is now live.', 'Message shown after form completion');