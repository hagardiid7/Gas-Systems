/*
  # Initial Schema for LPG Ordering App

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `full_name` (text, nullable)
      - `phone_number` (text, nullable)
      - `role` (text, default 'customer')
    
    - `orders`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, references profiles)
      - `lpg_type` (text)
      - `quantity` (integer)
      - `status` (text, default 'pending')
      - `latitude` (float, nullable)
      - `longitude` (float, nullable)
      - `address` (text, nullable)
      - `assigned_to` (uuid, nullable, references profiles)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
    - Add policies for admin users to read/write all data
    - Add policies for delivery personnel to read/write assigned orders
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'customer'
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  lpg_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  latitude FLOAT,
  longitude FLOAT,
  address TEXT,
  assigned_to UUID REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Profiles policies
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

CREATE POLICY "Admin can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Orders policies
CREATE POLICY "Customers can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'delivery' AND assigned_to = id
    )
  );

CREATE POLICY "Customers can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'delivery' AND assigned_to = id
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();