-- Fix RLS policies for friendships to allow users to insert friend requests
-- and view/update their own friendships

DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can insert friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can update received friendships" ON public.friendships;

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friend requests"
  ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update received friendships"
  ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can read own messages" ON public.friend_messages;
ALTER TABLE public.friend_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages"
  ON public.friend_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);