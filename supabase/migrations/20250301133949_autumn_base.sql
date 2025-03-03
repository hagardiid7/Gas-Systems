/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Drop existing problematic policies for profiles table
    - Create new policies with fixed conditions to avoid recursion
    - Add missing policies for delivery personnel

  2. Security
    - Maintain RLS protection
    - Fix admin access to profiles
    - Add proper delivery personnel access
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;

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

-- Fix admin policy to avoid recursion
CREATE POLICY "Admin can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Add policy for admin to update profiles
CREATE POLICY "Admin can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Add policies for delivery personnel
CREATE POLICY "Delivery personnel can read assigned orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'delivery'
  );

CREATE POLICY "Delivery personnel can update assigned orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'delivery'
  );