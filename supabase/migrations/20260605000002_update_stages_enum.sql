-- SP 2026 ima 12 skupin (A–L) in nov Krog 32 (Round of 32)
-- Dodamo manjkajoče vrednosti v enum match_stage

ALTER TYPE match_stage ADD VALUE IF NOT EXISTS 'Group I';
ALTER TYPE match_stage ADD VALUE IF NOT EXISTS 'Group J';
ALTER TYPE match_stage ADD VALUE IF NOT EXISTS 'Group K';
ALTER TYPE match_stage ADD VALUE IF NOT EXISTS 'Group L';
ALTER TYPE match_stage ADD VALUE IF NOT EXISTS 'Round of 32';
