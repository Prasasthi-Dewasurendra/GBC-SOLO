-- Migration for 8-Ball Scoring System
CREATE TABLE rack_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    rack_no INT NOT NULL,
    seq INT NOT NULL,
    type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(match_id, rack_no, seq)
);

ALTER TABLE rack_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public select" ON rack_events FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON rack_events USING (auth.role() = 'authenticated');

-- Modify racks table to act as a snapshot
ALTER TABLE racks
ADD COLUMN IF NOT EXISTS p1_group TEXT,
ADD COLUMN IF NOT EXISTS p2_group TEXT,
ADD COLUMN IF NOT EXISTS ball_in_hand INT,
ADD COLUMN IF NOT EXISTS fouls JSONB DEFAULT '{"p1": 0, "p2": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS win_reason TEXT;

CREATE OR REPLACE FUNCTION apply_event(p_match_id UUID, p_rack_no INT, p_event JSONB, p_snapshot JSONB)
RETURNS void AS $$
BEGIN
    INSERT INTO rack_events (match_id, rack_no, seq, type, payload)
    VALUES (p_match_id, p_rack_no, (p_event->>'seq')::int, p_event->>'type', p_event->'payload');

    UPDATE racks
    SET p1_group = p_snapshot->>'p1_group',
        p2_group = p_snapshot->>'p2_group',
        ball_in_hand = (p_snapshot->>'ball_in_hand')::int,
        fouls = p_snapshot->'fouls',
        winner_slot = (p_snapshot->>'winner_slot')::int,
        win_reason = p_snapshot->>'win_reason',
        phase = p_snapshot->>'phase',
        on_table = ARRAY(SELECT jsonb_array_elements_text(p_snapshot->'on_table')::int),
        potted = p_snapshot->'potted',
        shooter_slot = (p_snapshot->>'shooter_slot')::int
    WHERE match_id = p_match_id AND rack_no = p_rack_no;

    IF p_snapshot->>'phase' = 'ended' THEN
        -- Logic to update matches.p1_racks or matches.p2_racks and check for win
        IF (p_snapshot->>'winner_slot')::int = 1 THEN
            UPDATE matches SET p1_racks = p1_racks + 1 WHERE id = p_match_id;
        ELSEIF (p_snapshot->>'winner_slot')::int = 2 THEN
            UPDATE matches SET p2_racks = p2_racks + 1 WHERE id = p_match_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION undo_event(p_match_id UUID, p_rack_no INT, p_snapshot JSONB)
RETURNS void AS $$
BEGIN
    DELETE FROM rack_events 
    WHERE match_id = p_match_id AND rack_no = p_rack_no 
    AND seq = (SELECT MAX(seq) FROM rack_events WHERE match_id = p_match_id AND rack_no = p_rack_no);

    -- Restore snapshot and possibly decrement match score if reverting a win
    UPDATE racks
    SET p1_group = p_snapshot->>'p1_group',
        p2_group = p_snapshot->>'p2_group',
        ball_in_hand = (p_snapshot->>'ball_in_hand')::int,
        fouls = p_snapshot->'fouls',
        winner_slot = (p_snapshot->>'winner_slot')::int,
        win_reason = p_snapshot->>'win_reason',
        phase = p_snapshot->>'phase',
        on_table = ARRAY(SELECT jsonb_array_elements_text(p_snapshot->'on_table')::int),
        potted = p_snapshot->'potted',
        shooter_slot = (p_snapshot->>'shooter_slot')::int
    WHERE match_id = p_match_id AND rack_no = p_rack_no;
END;
$$ LANGUAGE plpgsql;
