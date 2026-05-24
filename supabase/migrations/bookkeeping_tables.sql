-- Bookkeeping entries table
CREATE TABLE IF NOT EXISTS bookkeeping_entries (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  account TEXT NOT NULL,
  note TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  ledger_id TEXT DEFAULT NULL,
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookkeeping_user_date ON bookkeeping_entries(user_id, date DESC);

ALTER TABLE bookkeeping_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookkeeping entries" ON bookkeeping_entries
  FOR ALL USING (auth.uid() = user_id);

-- Bookkeeping ledgers table (for Phase 4)
CREATE TABLE IF NOT EXISTS bookkeeping_ledgers (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bookkeeping_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ledgers" ON bookkeeping_ledgers
  FOR ALL USING (auth.uid() = owner_id);

-- Ledger members table (for Phase 4 shared ledgers)
CREATE TABLE IF NOT EXISTS ledger_members (
  ledger_id TEXT REFERENCES bookkeeping_ledgers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (ledger_id, user_id)
);

ALTER TABLE ledger_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read memberships" ON ledger_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Ledger owners can manage members" ON ledger_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bookkeeping_ledgers
      WHERE bookkeeping_ledgers.id = ledger_members.ledger_id
      AND bookkeeping_ledgers.owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can read shared ledger entries" ON bookkeeping_entries
  FOR SELECT USING (
    ledger_id IS NULL AND auth.uid() = user_id
    OR ledger_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM ledger_members
      WHERE ledger_members.ledger_id = bookkeeping_entries.ledger_id
      AND ledger_members.user_id = auth.uid()
    )
  );
