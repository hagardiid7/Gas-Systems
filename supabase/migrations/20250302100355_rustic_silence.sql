/*
  # Add delivery personnel access policies

  1. New Policies
    - Add policy for admins to read delivery personnel profiles
    - Ensure proper access control for delivery personnel data

  2. Security
    - Maintain existing RLS protection
    - Only allow admins to access delivery personnel list
*/

-- Create policy for admins to read delivery personnel profiles
CREATE POLICY "Admins can read delivery personnel profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin' AND
    role = 'delivery'
  );