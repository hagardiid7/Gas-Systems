/*
  # Fix recursive policies

  1. Changes
     - Drop existing problematic policies for profiles
     - Create new non-recursive policies for profiles
     - Fix admin and delivery personnel policies
     - Add additional helper function for role checking

  2. Security
     - Maintain RLS protection while avoiding recursion
     - Ensure proper access control for different user roles
*/

-- Create a function to safely check user roles without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Direct query without going through RLS
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

-- Create fixed policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Fix admin policy to avoid recursion by using the helper function
CREATE POLICY "Admin can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Add policy for admin to update profiles
CREATE POLICY "Admin can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Drop and recreate problematic order policies
DROP POLICY IF EXISTS "Customers can read own orders" ON orders;
DROP POLICY IF EXISTS "Customers can update own orders" ON orders;
DROP POLICY IF EXISTS "Delivery personnel can read assigned orders" ON orders;
DROP POLICY IF EXISTS "Delivery personnel can update assigned orders" ON orders;

-- Create fixed order policies
CREATE POLICY "Customers can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    public.get_user_role(auth.uid()) = 'admin' OR
    (public.get_user_role(auth.uid()) = 'delivery' AND assigned_to = auth.uid())
  );

CREATE POLICY "Customers can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    public.get_user_role(auth.uid()) = 'admin' OR
    (public.get_user_role(auth.uid()) = 'delivery' AND assigned_to = auth.uid())
  );

-- Add policies for delivery personnel
CREATE POLICY "Delivery personnel can read assigned orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    public.get_user_role(auth.uid()) = 'delivery'
  );

CREATE POLICY "Delivery personnel can update assigned orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() AND
    public.get_user_role(auth.uid()) = 'delivery'
  );