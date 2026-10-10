-- Add rack_winners to matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS rack_winners smallint[] DEFAULT array[]::smallint[];

-- Recreate score_match RPC with Third Place logic and rack_winners
CREATE OR REPLACE FUNCTION public.score_match(
  p_match_id uuid,
  p_player_number integer,
  p_delta integer default 1
)
RETURNS SETOF public.matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_match public.matches;
  next_match public.matches;
  next_slot integer;
  new_p1_racks integer;
  new_p2_racks integer;
  new_winner_id uuid;
  loser_id uuid;
  race_target integer;
  new_rack_winners smallint[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_player_number NOT IN (1, 2) OR p_delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Invalid scoring request';
  END IF;

  SELECT * INTO current_match
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF current_match.status <> 'live' THEN
    RAISE EXCEPTION 'Only live matches can be scored';
  END IF;

  new_p1_racks := current_match.p1_racks;
  new_p2_racks := current_match.p2_racks;
  new_rack_winners := COALESCE(current_match.rack_winners, ARRAY[]::smallint[]);

  IF p_delta = 1 THEN
    IF p_player_number = 1 THEN new_p1_racks := new_p1_racks + 1; END IF;
    IF p_player_number = 2 THEN new_p2_racks := new_p2_racks + 1; END IF;
    new_rack_winners := array_append(new_rack_winners, p_player_number::smallint);
  ELSE
    IF p_player_number = 1 THEN new_p1_racks := new_p1_racks - 1; END IF;
    IF p_player_number = 2 THEN new_p2_racks := new_p2_racks - 1; END IF;
    IF array_length(new_rack_winners, 1) > 0 THEN
      new_rack_winners := new_rack_winners[1 : array_length(new_rack_winners, 1) - 1];
    END IF;
  END IF;

  IF new_p1_racks < 0 OR new_p2_racks < 0 THEN
    RAISE EXCEPTION 'Rack score cannot be negative';
  END IF;

  race_target := ceil(current_match.best_of::numeric / 2)::integer;
  new_winner_id := NULL;

  IF new_p1_racks >= race_target AND new_p1_racks > new_p2_racks THEN
    new_winner_id := current_match.player1_id;
  ELSIF new_p2_racks >= race_target AND new_p2_racks > new_p1_racks THEN
    new_winner_id := current_match.player2_id;
  END IF;

  UPDATE public.matches
  SET p1_racks = new_p1_racks,
      p2_racks = new_p2_racks,
      rack_winners = new_rack_winners,
      status = CASE WHEN new_winner_id IS NULL THEN 'live' ELSE 'done' END,
      winner_id = new_winner_id
  WHERE id = p_match_id;

  IF new_winner_id IS NOT NULL THEN
    IF current_match.round < 5 THEN
      next_slot := floor(current_match.slot / 2.0)::integer;

      SELECT * INTO next_match
      FROM public.matches
      WHERE round = current_match.round + 1 AND slot = next_slot
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Next-round match does not exist';
      END IF;

      IF next_match.status <> 'pending' THEN
        RAISE EXCEPTION 'Next-round match has already started';
      END IF;

      IF mod(current_match.slot, 2) = 0 THEN
        UPDATE public.matches SET player1_id = new_winner_id WHERE id = next_match.id;
      ELSE
        UPDATE public.matches SET player2_id = new_winner_id WHERE id = next_match.id;
      END IF;
      
      IF current_match.round = 4 THEN
        loser_id := CASE WHEN new_winner_id = current_match.player1_id THEN current_match.player2_id ELSE current_match.player1_id END;
        IF mod(current_match.slot, 2) = 0 THEN
          UPDATE public.matches SET player1_id = loser_id WHERE round = 5 AND slot = 1;
        ELSE
          UPDATE public.matches SET player2_id = loser_id WHERE round = 5 AND slot = 1;
        END IF;
      END IF;

      UPDATE public.tournament
      SET live_match_id = NULL
      WHERE id = 1 AND live_match_id = p_match_id;
    ELSE
      UPDATE public.tournament
      SET state = 'finished', live_match_id = NULL
      WHERE id = 1;
    END IF;
  END IF;

  RETURN QUERY SELECT * FROM public.matches WHERE id = p_match_id;
END;
$$;
