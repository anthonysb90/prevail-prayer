-- ============================================================
-- Prevail Prayer — Supabase Schema
-- Run this entire file once in the Supabase SQL Editor.
-- Project: supabase.com → SQL Editor → New Query → Paste → Run
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- HELPER: auto-update updated_at on row changes
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- TABLE: profiles
-- One row per authenticated user. Created automatically on signup.
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT,
  walk_with_god     TEXT[],          -- onboarding multi-select answers
  theme_pref        TEXT DEFAULT 'system'
                    CHECK (theme_pref IN ('system', 'light', 'dark')),
  prayer_streak     INT DEFAULT 0,
  last_prayer_date  DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- TABLE: categories
-- Default categories have user_id = NULL and are visible to all.
-- User-created categories have user_id = the owner's ID.
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  color_bg      TEXT NOT NULL,    -- hex, e.g. #E8F5E9
  color_border  TEXT NOT NULL,    -- hex, e.g. #4CAF50
  icon          TEXT,             -- Ionicons name
  sort_order    INT DEFAULT 0,
  is_default    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE: prayer_requests
-- ============================================================

CREATE TABLE IF NOT EXISTS prayer_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  status        TEXT DEFAULT 'active'
                CHECK (status IN ('active', 'answered', 'completed', 'ongoing')),
  is_urgent     BOOLEAN DEFAULT FALSE,
  answer_notes  TEXT,
  answered_at   TIMESTAMPTZ,
  archived_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER prayer_requests_updated_at
  BEFORE UPDATE ON prayer_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: prayer_request_categories
-- Junction table linking prayer requests to categories (many-to-many).
-- ============================================================

CREATE TABLE IF NOT EXISTS prayer_request_categories (
  prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  category_id       UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (prayer_request_id, category_id)
);


-- ============================================================
-- TABLE: reminders
-- prayer_request_id = NULL means it's a general reminder (not tied to one request).
-- days_of_week: integer array, 0 = Sunday through 6 = Saturday.
-- ============================================================

CREATE TABLE IF NOT EXISTS reminders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_request_id   UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  reminder_type       TEXT NOT NULL
                      CHECK (reminder_type IN ('specific', 'general')),
  recurrence_type     TEXT NOT NULL
                      CHECK (recurrence_type IN ('once', 'daily', 'weekly')),
  days_of_week        INT[],         -- used when recurrence_type = 'weekly'
  reminder_time       TIME NOT NULL,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE: journal_entries
-- Optionally linked to a prayer request.
-- ============================================================

CREATE TABLE IF NOT EXISTS journal_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_request_id   UUID REFERENCES prayer_requests(id) ON DELETE SET NULL,
  title               TEXT,
  body                TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: scripture_verses
-- Seeded with KJV verses. Read-only for all users.
-- ============================================================

CREATE TABLE IF NOT EXISTS scripture_verses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference   TEXT NOT NULL,     -- e.g. "Philippians 4:6-7"
  verse_text  TEXT NOT NULL,     -- KJV full text
  topic       TEXT NOT NULL,     -- e.g. "Prayer", "Faith"
  is_featured BOOLEAN DEFAULT FALSE,   -- eligible for home screen rotation
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE: user_favorite_verses
-- ============================================================

CREATE TABLE IF NOT EXISTS user_favorite_verses (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_id   UUID NOT NULL REFERENCES scripture_verses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, verse_id)
);


-- ============================================================
-- TABLE: prayer_sessions
-- Logged each time a user completes a prayer timer session.
-- ============================================================

CREATE TABLE IF NOT EXISTS prayer_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_seconds INT NOT NULL,
  ambient_track    TEXT,
  completed        BOOLEAN DEFAULT FALSE,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);


-- ============================================================
-- TABLE: support_interactions
-- Tracks when support prompts were shown and what action was taken.
-- Used to throttle prompt frequency (max once per 7 days).
-- ============================================================

CREATE TABLE IF NOT EXISTS support_interactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action     TEXT CHECK (action IN ('dismissed', 'supported', 'rated', 'shared')),
  shown_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- ROW LEVEL SECURITY
-- Every table is locked down to the authenticated user's own data.
-- scripture_verses is public read.
-- ============================================================

ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_request_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_verses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_verses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_interactions   ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- categories: see defaults (user_id IS NULL) or own
CREATE POLICY "Users can view categories"
  ON categories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- prayer_requests
CREATE POLICY "Users manage own prayer requests"
  ON prayer_requests FOR ALL
  USING (auth.uid() = user_id);

-- prayer_request_categories: access controlled via parent prayer_request
CREATE POLICY "Users manage own prayer request categories"
  ON prayer_request_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM prayer_requests pr
      WHERE pr.id = prayer_request_categories.prayer_request_id
        AND pr.user_id = auth.uid()
    )
  );

-- reminders
CREATE POLICY "Users manage own reminders"
  ON reminders FOR ALL
  USING (auth.uid() = user_id);

-- journal_entries
CREATE POLICY "Users manage own journal entries"
  ON journal_entries FOR ALL
  USING (auth.uid() = user_id);

-- scripture_verses: public read, no user writes
CREATE POLICY "Anyone can read scripture verses"
  ON scripture_verses FOR SELECT
  USING (TRUE);

-- user_favorite_verses
CREATE POLICY "Users manage own favorite verses"
  ON user_favorite_verses FOR ALL
  USING (auth.uid() = user_id);

-- prayer_sessions
CREATE POLICY "Users manage own prayer sessions"
  ON prayer_sessions FOR ALL
  USING (auth.uid() = user_id);

-- support_interactions
CREATE POLICY "Users manage own support interactions"
  ON support_interactions FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- SEED DATA: Default Categories
-- ============================================================

INSERT INTO categories (user_id, name, color_bg, color_border, icon, sort_order, is_default)
VALUES
  (NULL, 'Family',    '#E8F5E9', '#4CAF50', 'home',            0, TRUE),
  (NULL, 'Church',    '#E3F2FD', '#2196F3', 'people',           1, TRUE),
  (NULL, 'Healing',   '#FCE4EC', '#E91E63', 'heart',            2, TRUE),
  (NULL, 'Finances',  '#FFF8E1', '#FFC107', 'cash',             3, TRUE),
  (NULL, 'Missions',  '#E0F7FA', '#00BCD4', 'earth',            4, TRUE),
  (NULL, 'Nation',    '#EDE7F6', '#673AB7', 'flag',             5, TRUE),
  (NULL, 'Salvation', '#FBE9E7', '#FF5722', 'star',             6, TRUE),
  (NULL, 'Work',      '#F3E5F5', '#9C27B0', 'briefcase',        7, TRUE),
  (NULL, 'Personal',  '#E8EAF6', '#3F51B5', 'person',           8, TRUE),
  (NULL, 'Friends',   '#F1F8E9', '#8BC34A', 'people-circle',    9, TRUE)
ON CONFLICT DO NOTHING;


-- ============================================================
-- SEED DATA: Scripture Verses (KJV — Public Domain)
-- ============================================================

INSERT INTO scripture_verses (reference, verse_text, topic, is_featured, sort_order)
VALUES

  -- ── Prayer ─────────────────────────────────────────────────────────────
  ('Philippians 4:6-7',
   'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
   'Prayer', TRUE, 0),

  ('James 5:16',
   'Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.',
   'Prayer', TRUE, 1),

  ('Matthew 7:7',
   'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.',
   'Prayer', TRUE, 2),

  ('1 Thessalonians 5:17',
   'Pray without ceasing.',
   'Prayer', FALSE, 3),

  ('Matthew 21:22',
   'And all things, whatsoever ye shall ask in prayer, believing, ye shall receive.',
   'Prayer', FALSE, 4),

  ('Luke 18:1',
   'And he spake a parable unto them to this end, that men ought always to pray, and not to faint.',
   'Prayer', FALSE, 5),

  ('John 15:7',
   'If ye abide in me, and my words abide in you, ye shall ask what ye will, and it shall be done unto you.',
   'Prayer', FALSE, 6),

  ('Jeremiah 33:3',
   'Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.',
   'Prayer', TRUE, 7),

  ('1 John 5:14',
   'And this is the confidence that we have in him, that, if we ask any thing according to his will, he heareth us.',
   'Prayer', FALSE, 8),

  ('Matthew 6:9-10',
   'After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name. Thy kingdom come. Thy will be done in earth, as it is in heaven.',
   'Prayer', FALSE, 9),

  ('Romans 8:26',
   'Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought: but the Spirit itself maketh intercession for us with groanings which cannot be uttered.',
   'Prayer', FALSE, 10),

  ('Psalm 17:6',
   'I have called upon thee, for thou wilt hear me, O God: incline thine ear unto me, and hear my speech.',
   'Prayer', FALSE, 11),

  -- ── Faith ──────────────────────────────────────────────────────────────
  ('Hebrews 11:1',
   'Now faith is the substance of things hoped for, the evidence of things not seen.',
   'Faith', TRUE, 0),

  ('Romans 10:17',
   'So then faith cometh by hearing, and hearing by the word of God.',
   'Faith', TRUE, 1),

  ('Mark 11:24',
   'Therefore I say unto you, What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them.',
   'Faith', FALSE, 2),

  ('2 Corinthians 5:7',
   'For we walk by faith, not by sight.',
   'Faith', FALSE, 3),

  ('Romans 8:28',
   'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
   'Faith', TRUE, 4),

  ('Matthew 17:20',
   'And Jesus said unto them, Because of your unbelief: for verily I say unto you, If ye have faith as a grain of mustard seed, ye shall say unto this mountain, Remove hence to yonder place; and it shall remove; and nothing shall be impossible unto you.',
   'Faith', FALSE, 5),

  -- ── Healing ────────────────────────────────────────────────────────────
  ('Psalm 103:2-3',
   'Bless the LORD, O my soul, and forget not all his benefits: Who forgiveth all thine iniquities; who healeth all thy diseases.',
   'Healing', TRUE, 0),

  ('Isaiah 53:5',
   'But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.',
   'Healing', TRUE, 1),

  ('Jeremiah 17:14',
   'Heal me, O LORD, and I shall be healed; save me, and I shall be saved: for thou art my praise.',
   'Healing', FALSE, 2),

  ('3 John 1:2',
   'Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth.',
   'Healing', FALSE, 3),

  ('Psalm 147:3',
   'He healeth the broken in heart, and bindeth up their wounds.',
   'Healing', FALSE, 4),

  ('Exodus 15:26',
   'And said, If thou wilt diligently hearken to the voice of the LORD thy God, and wilt do that which is right in his sight, and wilt give ear to his commandments, and keep all his statutes, I will put none of these diseases upon thee, which I have brought upon the Egyptians: for I am the LORD that healeth thee.',
   'Healing', FALSE, 5),

  -- ── Peace ──────────────────────────────────────────────────────────────
  ('Isaiah 26:3',
   'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.',
   'Peace', TRUE, 0),

  ('John 14:27',
   'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
   'Peace', TRUE, 1),

  ('Psalm 46:10',
   'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.',
   'Peace', TRUE, 2),

  ('Romans 15:13',
   'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.',
   'Peace', FALSE, 3),

  ('Colossians 3:15',
   'And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful.',
   'Peace', FALSE, 4),

  -- ── Guidance ───────────────────────────────────────────────────────────
  ('Proverbs 3:5-6',
   'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
   'Guidance', TRUE, 0),

  ('Psalm 32:8',
   'I will instruct thee and teach thee in the way which thou shalt go: I will guide thee with mine eye.',
   'Guidance', TRUE, 1),

  ('Isaiah 30:21',
   'And thine ears shall hear a word behind thee, saying, This is the way, walk ye in it, when ye turn to the right hand, and when ye turn to the left.',
   'Guidance', FALSE, 2),

  ('James 1:5',
   'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.',
   'Guidance', FALSE, 3),

  ('Psalm 119:105',
   'Thy word is a lamp unto my feet, and a light unto my path.',
   'Guidance', TRUE, 4),

  -- ── Trust ──────────────────────────────────────────────────────────────
  ('Psalm 37:5',
   'Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.',
   'Trust', TRUE, 0),

  ('Psalm 56:3',
   'What time I am afraid, I will trust in thee.',
   'Trust', FALSE, 1),

  ('Isaiah 41:10',
   'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.',
   'Trust', TRUE, 2),

  ('Nahum 1:7',
   'The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.',
   'Trust', FALSE, 3),

  ('Psalm 9:10',
   'And they that know thy name will put their trust in thee: for thou, LORD, hast not forsaken them that seek thee.',
   'Trust', FALSE, 4),

  -- ── Praise ─────────────────────────────────────────────────────────────
  ('Psalm 150:6',
   'Let every thing that hath breath praise the LORD. Praise ye the LORD.',
   'Praise', TRUE, 0),

  ('Psalm 34:1',
   'I will bless the LORD at all times: his praise shall continually be in my mouth.',
   'Praise', TRUE, 1),

  ('Hebrews 13:15',
   'By him therefore let us offer the sacrifice of praise to God continually, that is, the fruit of our lips giving thanks to his name.',
   'Praise', FALSE, 2),

  ('Psalm 22:3',
   'But thou art holy, O thou that inhabitest the praises of Israel.',
   'Praise', FALSE, 3),

  ('Acts 16:25',
   'And at midnight Paul and Silas prayed, and sang praises unto God: and the prisoners heard them.',
   'Praise', TRUE, 4),

  -- ── Warfare ────────────────────────────────────────────────────────────
  ('Ephesians 6:12',
   'For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places.',
   'Warfare', TRUE, 0),

  ('2 Corinthians 10:4',
   'For the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds.',
   'Warfare', TRUE, 1),

  ('Isaiah 54:17',
   'No weapon that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn. This is the heritage of the servants of the LORD.',
   'Warfare', FALSE, 2),

  ('Romans 8:37',
   'Nay, in all these things we are more than conquerors through him that loved us.',
   'Warfare', FALSE, 3),

  ('1 Peter 5:8-9',
   'Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour: Whom resist stedfast in the faith, knowing that the same afflictions are accomplished in your brethren that are in the world.',
   'Warfare', FALSE, 4),

  ('James 4:7',
   'Submit yourselves therefore to God. Resist the devil, and he will flee from you.',
   'Warfare', TRUE, 5),

  -- ── Salvation ──────────────────────────────────────────────────────────
  ('John 3:16',
   'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
   'Salvation', TRUE, 0),

  ('Romans 10:9',
   'That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.',
   'Salvation', TRUE, 1),

  ('Acts 4:12',
   'Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved.',
   'Salvation', FALSE, 2),

  ('Romans 6:23',
   'For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.',
   'Salvation', FALSE, 3),

  ('Ephesians 2:8-9',
   'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.',
   'Salvation', TRUE, 4),

  -- ── Hope ───────────────────────────────────────────────────────────────
  ('Jeremiah 29:11',
   'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
   'Hope', TRUE, 0),

  ('Romans 15:4',
   'For whatsoever things were written aforetime were written for our learning, that we through patience and comfort of the scriptures might have hope.',
   'Hope', FALSE, 1),

  ('Lamentations 3:22-23',
   'It is of the LORD''s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.',
   'Hope', TRUE, 2),

  ('Romans 5:3-4',
   'And not only so, but we glory in tribulations also: knowing that tribulation worketh patience; And patience, experience; and experience, hope.',
   'Hope', FALSE, 3),

  ('Psalm 31:24',
   'Be of good courage, and he shall strengthen your heart, all ye that hope in the LORD.',
   'Hope', FALSE, 4)

ON CONFLICT DO NOTHING;


-- ============================================================
-- DONE
-- Tables: 10
-- RLS policies: 16
-- Seed categories: 10
-- Seed verses: 60+ (KJV, public domain)
-- ============================================================
