-- Add user_id column to teleprompter_scripts
ALTER TABLE public.teleprompter_scripts 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Allow all operations on teleprompter_scripts" ON public.teleprompter_scripts;

-- Create RLS policies for user-owned scripts
CREATE POLICY "Users can view their own scripts"
ON public.teleprompter_scripts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scripts"
ON public.teleprompter_scripts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
ON public.teleprompter_scripts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts"
ON public.teleprompter_scripts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);