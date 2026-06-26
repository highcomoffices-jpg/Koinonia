/*
  # Complete Koinonia Database Schema
  
  This script creates the complete database schema for the Koinonia Christian Community Platform.
  It includes all tables with proper constraints, relationships, and Row Level Security policies.
  
  Tables Order (respecting foreign key dependencies):
  1. Geographic tables (continents, sub_regions, countries, cities)
  2. Religious tables (confessions, parishes, celebrations)
  3. Auth & Profile tables (profiles)
  4. Social tables (posts, comments, likes, shares)
  5. Market tables (market_items)
  6. Services & Formation tables (services, service_schedules, formations, formation_modules, formation_enrollments)
  7. Community tables (groups, group_members, conversations, conversation_participants, messages)
  8. Activity tables (activities, activity_participants)
  9. Premium tables (live_celebrations, biblical_paths, location_meditations, challenges, challenge_participants, prayer_wall, donations, fundraisers, fundraiser_donations)
*/

-- =====================================================
-- GEOGRAPHIC TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS continents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sub_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  continent_id uuid NOT NULL REFERENCES continents(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  continent_id uuid NOT NULL REFERENCES continents(id),
  sub_region_id uuid REFERENCES sub_regions(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country_id uuid NOT NULL REFERENCES countries(id),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- RELIGIOUS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS confessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  validated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  confession_id uuid NOT NULL REFERENCES confessions(id),
  city_id uuid NOT NULL REFERENCES cities(id),
  address text,
  validated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS celebrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  date date NOT NULL,
  celebration_type text NOT NULL,
  confession_id uuid REFERENCES confessions(id),
  color_hex text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- AUTH & PROFILE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  profile_complete boolean DEFAULT false,
  role text DEFAULT 'brebis' CHECK (role = ANY (ARRAY['brebis', 'vigneron', 'admin'])),
  level text DEFAULT 'semeur' CHECK (level = ANY (ARRAY['semeur', 'moissonneur', 'berger'])),
  country_id uuid REFERENCES countries(id),
  city_id uuid REFERENCES cities(id),
  confession_id uuid REFERENCES confessions(id),
  parish_id uuid REFERENCES parishes(id),
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SOCIAL TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  media_urls text[] DEFAULT '{}',
  video_urls text[] DEFAULT '{}',
  visibility text DEFAULT 'global' CHECK (visibility = ANY (ARRAY['global', 'restricted', 'extended'])),
  confession_ids uuid[] DEFAULT '{}',
  parish_ids uuid[] DEFAULT '{}',
  is_live boolean DEFAULT false,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['post', 'comment'])),
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- MARKET TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS market_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  price numeric DEFAULT 0,
  condition text,
  location text NOT NULL,
  image_url text,
  images text[] DEFAULT '{}',
  likes integer DEFAULT 0,
  views integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SERVICES & FORMATIONS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  confession_ids uuid[] DEFAULT '{}',
  parish_id uuid REFERENCES parishes(id),
  price numeric,
  duration text,
  max_participants integer,
  current_participants integer DEFAULT 0,
  requirements text[] DEFAULT '{}',
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  is_online boolean DEFAULT false,
  meeting_link text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  price numeric DEFAULT 0,
  duration text NOT NULL,
  confession_ids uuid[] DEFAULT '{}',
  max_students integer,
  current_students integer DEFAULT 0,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count integer DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formation_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  duration text NOT NULL,
  video_url text,
  resources text[] DEFAULT '{}',
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formation_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES formations(id),
  student_id uuid NOT NULL REFERENCES profiles(id),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed boolean DEFAULT false,
  certificate_url text,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- =====================================================
-- COMMUNITY TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  visibility text DEFAULT 'public' CHECK (visibility = ANY (ARRAY['public', 'private', 'secret'])),
  creator_id uuid NOT NULL REFERENCES profiles(id),
  image_url text,
  confession_ids uuid[] DEFAULT '{}',
  max_members integer,
  member_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type = ANY (ARRAY['direct', 'group'])),
  name text,
  group_id uuid REFERENCES groups(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  joined_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  type text DEFAULT 'text',
  media_url text,
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ACTIVITY TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  activity_type text NOT NULL,
  parish_id uuid REFERENCES parishes(id),
  date_start timestamptz NOT NULL,
  date_end timestamptz,
  location text NOT NULL,
  max_participants integer,
  current_participants integer DEFAULT 0,
  status text DEFAULT 'upcoming' CHECK (status = ANY (ARRAY['upcoming', 'ongoing', 'completed', 'cancelled'])),
  is_active boolean DEFAULT true, -- Ajouté pour corriger l'erreur
  image_url text,
  organizer_id uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  status text DEFAULT 'registered',
  joined_at timestamptz DEFAULT now()
);

-- =====================================================
-- PREMIUM FEATURES TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS live_celebrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  celebration_id uuid REFERENCES celebrations(id),
  organizer_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  stream_url text,
  is_active boolean DEFAULT true,
  viewer_count integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS biblical_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  author_id uuid REFERENCES profiles(id),
  duration integer,
  difficulty text CHECK (difficulty = ANY (ARRAY['beginner', 'intermediate', 'advanced'])),
  content text,
  image_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS location_meditations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL,
  city_id uuid REFERENCES cities(id),
  description text,
  meditation_text text,
  author_id uuid REFERENCES profiles(id),
  image_url text,
  coordinates text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  duration text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  participants_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text DEFAULT 'active',
  joined_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS prayer_wall (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  content text NOT NULL,
  intention text,
  is_anonymous boolean DEFAULT false,
  is_public boolean DEFAULT true,
  prayer_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES profiles(id),
  recipient_id uuid REFERENCES profiles(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'completed', 'failed', 'refunded'])),
  message text,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fundraisers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  organizer_id uuid NOT NULL REFERENCES profiles(id),
  goal_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  image_url text,
  status text DEFAULT 'active',
  deadline date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fundraiser_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES profiles(id),
  amount numeric NOT NULL,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_market_items_seller_id ON market_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_formations_instructor_id ON formations(instructor_id);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_student_id ON formation_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_activities_organizer_id ON activities(organizer_id);
CREATE INDEX IF NOT EXISTS idx_activities_parish_id ON activities(parish_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user_id ON activity_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_title ON challenges(title);
CREATE INDEX IF NOT EXISTS idx_prayer_wall_author_id ON prayer_wall(author_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_fundraisers_organizer_id ON fundraisers(organizer_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE continents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_celebrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE biblical_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_meditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_wall ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_donations ENABLE ROW LEVEL SECURITY;

-- Public geographic and religious data
CREATE POLICY "Continents are public" ON continents FOR SELECT TO public USING (true);
CREATE POLICY "Sub-regions are public" ON sub_regions FOR SELECT TO public USING (true);
CREATE POLICY "Countries are public" ON countries FOR SELECT TO public USING (true);
CREATE POLICY "Cities are public" ON cities FOR SELECT TO public USING (true);
CREATE POLICY "Confessions are public" ON confessions FOR SELECT TO public USING (true);
CREATE POLICY "Parishes are public" ON parishes FOR SELECT TO public USING (true);
CREATE POLICY "Celebrations are public" ON celebrations FOR SELECT TO public USING (is_public = true);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT TO authenticated USING (true);

-- Posts policies
CREATE POLICY "Posts are viewable by authenticated users" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE TO authenticated USING (author_id = auth.uid());

-- Comments policies
CREATE POLICY "Comments are viewable by authenticated users" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE TO authenticated USING (author_id = auth.uid());

-- Market items policies
CREATE POLICY "Market items are viewable by authenticated users" ON market_items FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can create market items" ON market_items FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Users can update own market items" ON market_items FOR UPDATE TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Users can delete own market items" ON market_items FOR DELETE TO authenticated USING (seller_id = auth.uid());

-- Formations policies
CREATE POLICY "Formations are viewable by authenticated users" ON formations FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can create formations" ON formations FOR INSERT TO authenticated WITH CHECK (instructor_id = auth.uid());

-- Activities policies
CREATE POLICY "Activities are viewable by authenticated users" ON activities FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can create activities" ON activities FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());

-- Prayer wall policies
CREATE POLICY "Prayer wall entries are viewable when public" ON prayer_wall FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "Users can create prayer wall entries" ON prayer_wall FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() OR is_anonymous = true);
CREATE POLICY "Users can update own prayer wall entries" ON prayer_wall FOR UPDATE TO authenticated USING (author_id = auth.uid());

-- Donations policies
CREATE POLICY "Users can create donations" ON donations FOR INSERT TO authenticated WITH CHECK (donor_id = auth.uid());
CREATE POLICY "Users can view donations related to them" ON donations FOR SELECT TO authenticated USING (donor_id = auth.uid() OR recipient_id = auth.uid());

-- Services policies
CREATE POLICY "Services are viewable by authenticated users" ON services FOR SELECT TO authenticated USING (is_active = true);

-- Live celebrations policies
CREATE POLICY "Live celebrations are viewable by authenticated users" ON live_celebrations FOR SELECT TO authenticated USING (is_active = true);

-- Challenges policies
CREATE POLICY "Challenges are viewable by authenticated users" ON challenges FOR SELECT TO authenticated USING (is_active = true);

-- Fundraisers policies
CREATE POLICY "Fundraisers are viewable by authenticated users" ON fundraisers FOR SELECT TO authenticated USING (status = 'active');