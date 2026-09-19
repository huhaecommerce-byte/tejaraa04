DROP POLICY IF EXISTS "Authenticated users can view label templates" ON public.label_templates;

CREATE POLICY "Labelling staff can view label templates"
ON public.label_templates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_module_access(auth.uid(), 'labelling'));

DROP POLICY IF EXISTS "Owner manages own team update" ON public.team_members;

CREATE POLICY "Owner updates own team"
ON public.team_members FOR UPDATE TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Member updates own membership"
ON public.team_members FOR UPDATE TO authenticated
USING (auth.uid() = member_user_id)
WITH CHECK (auth.uid() = member_user_id);

CREATE OR REPLACE FUNCTION public.guard_team_member_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF auth.uid() = OLD.owner_id OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF auth.uid() = OLD.member_user_id THEN
    NEW.owner_id := OLD.owner_id;
    NEW.member_user_id := OLD.member_user_id;
    NEW.member_role := OLD.member_role;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_team_member_self_update ON public.team_members;
CREATE TRIGGER trg_guard_team_member_self_update
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.guard_team_member_self_update();