
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS friend_code text UNIQUE;

UPDATE public.profiles 
SET friend_code = UPPER(SUBSTRING(md5(user_id::text || 'salt') FROM 1 FOR 8))
WHERE friend_code IS NULL;

CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.friend_code IS NULL THEN
    NEW.friend_code := UPPER(SUBSTRING(md5(NEW.user_id::text || 'salt' || extract(epoch from now())::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_friend_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_friend_code();
