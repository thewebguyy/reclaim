-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable RLS on all tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create a function to get the current organisation ID from the session or a custom setting
-- For Supabase with custom claims or app-specific settings
CREATE OR REPLACE FUNCTION auth.current_organisation_id() 
RETURNS uuid AS $$
  SELECT current_setting('app.current_org_id', true)::uuid;
$$ LANGUAGE sql STABLE;

-- RLS Policies

-- Organisations: Users can only see organisations they belong to
CREATE POLICY "Users can view their own organisations" ON organisations
  FOR SELECT USING (
    id IN (
      SELECT organisation_id FROM organisation_members 
      WHERE user_id = (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'::text)
    )
  );

-- Users: Users can see themselves
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (clerk_user_id = auth.jwt()->>'sub'::text);

-- Organisation Members: Users can see members of their organisations
CREATE POLICY "Members can view other members in same org" ON organisation_members
  FOR SELECT USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members 
      WHERE user_id = (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'::text)
    )
  );

-- Tenant Data (Scoped by organisation_id)
-- Pattern: organisation_id = auth.current_organisation_id()
-- Note: In production, the API layer will set 'app.current_org_id' before querying if using the service role, 
-- or we can use Supabase auth claims.

CREATE POLICY "Org access for contacts" ON contacts FOR ALL USING (organisation_id = auth.current_organisation_id());
CREATE POLICY "Org access for quotes" ON quotes FOR ALL USING (organisation_id = auth.current_organisation_id());
CREATE POLICY "Org access for sequences" ON sequences FOR ALL USING (organisation_id = auth.current_organisation_id());
CREATE POLICY "Org access for sequence_steps" ON sequence_steps FOR ALL USING (organisation_id = auth.current_organisation_id());
CREATE POLICY "Org access for messages" ON messages FOR ALL USING (organisation_id = auth.current_organisation_id());
CREATE POLICY "Org access for inbox_threads" ON inbox_threads FOR ALL USING (organisation_id = auth.current_organisation_id());
CREATE POLICY "Org access for jobs" ON jobs FOR ALL USING (organisation_id = auth.current_organisation_id());
CREATE POLICY "Org access for reviews" ON reviews FOR ALL USING (organisation_id = auth.current_organisation_id());
CREATE POLICY "Org access for subscriptions" ON subscriptions FOR ALL USING (organisation_id = auth.current_organisation_id());
