CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON profiles FOR ALL USING (auth.uid() = id);

INSERT INTO profiles (id, active)
SELECT id, true FROM auth.users
ON CONFLICT (id) DO NOTHING;
