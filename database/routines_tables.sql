-- Create routines table
CREATE TABLE IF NOT EXISTS routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create routine_exercises table
CREATE TABLE IF NOT EXISTS routine_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(routine_id, exercise_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_exercise_id ON routine_exercises(exercise_id);

-- RLS policies for routines table
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routines" ON routines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routines" ON routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines" ON routines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines" ON routines
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for routine_exercises table
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view exercises in their routines" ON routine_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM routines 
      WHERE routines.id = routine_exercises.routine_id 
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add exercises to their routines" ON routine_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines 
      WHERE routines.id = routine_exercises.routine_id 
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove exercises from their routines" ON routine_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM routines 
      WHERE routines.id = routine_exercises.routine_id 
      AND routines.user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on routines
CREATE TRIGGER update_routines_updated_at 
    BEFORE UPDATE ON routines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
