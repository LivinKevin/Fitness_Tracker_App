-- ============================================================
-- Fitness Tracker App - Sample Data
-- ============================================================

USE fitness_tracker;

-- Users (Paola has NULL age and weight to show nullable columns)
INSERT INTO User (name, email, age, weight) VALUES
('Jorge Carmenate',  'jcarm@fiu.edu',    22, 175),
('Kevin Herrera',    'kherr@fiu.edu',    21, 160),
('Kevin Garcia',     'kgarc@fiu.edu',    23, 180),
('Paola Oropeza',   'porop@fiu.edu',    NULL, NULL);

-- Categories (description is nullable but we fill all here)
INSERT INTO CATEGORY (category_name, description) VALUES
('Strength',    'Resistance-based exercises targeting muscle growth and power'),
('Cardio',      'Aerobic exercises that improve cardiovascular endurance'),
('Flexibility', 'Stretching and mobility exercises for range of motion'),
('HIIT',        'High-Intensity Interval Training combining bursts of effort with rest');

-- Exercises (muscle_group and equipment_needed are nullable)
INSERT INTO EXERCISE (category_id, exercise_name, muscle_group, equipment_needed) VALUES
(1, 'Barbell Bench Press',   'Chest',         'Barbell, Bench'),
(1, 'Deadlift',              'Back / Legs',   'Barbell'),
(1, 'Squat',                 'Legs',          'Barbell, Squat Rack'),
(1, 'Overhead Press',        'Shoulders',     'Barbell'),
(1, 'Dumbbell Curl',         'Biceps',        'Dumbbells'),
(2, 'Treadmill Run',         'Legs / Cardio', 'Treadmill'),
(2, 'Jump Rope',             'Full Body',     'Jump Rope'),
(2, 'Cycling',               'Legs / Cardio', 'Stationary Bike'),
(3, 'Hamstring Stretch',     'Legs',          'None'),
(3, 'Yoga Flow',             'Full Body',     'Yoga Mat'),
(4, 'Burpees',               'Full Body',     'None'),
(4, 'Mountain Climbers',     'Core / Cardio', 'None');

-- Workouts (boundary: duration_minutes = 0 for Ana's workout)
INSERT INTO Workout (workout_date, duration_minutes, workout_type, user_id) VALUES
('2025-03-01', 60, 'Strength',    1),
('2025-03-02', 45, 'Cardio',      1),
('2025-03-01', 30, 'Flexibility', 2),
('2025-03-03', 50, 'HIIT',        3),
('2025-03-04', 0,  'Strength',    4);

-- Sessions (exercise_id is NULL for the cooldown session, notes is NULL for one row)
INSERT INTO Session (workout_id, exercise_id, session_date, start_time, end_time, notes) VALUES
(1, 1,    '2025-03-01', '08:00:00', '08:20:00', 'Heavy bench day - 4x5'),
(1, 2,    '2025-03-01', '08:25:00', '08:45:00', 'Deadlift working sets'),
(1, 3,    '2025-03-01', '08:50:00', '09:10:00', 'Squats to finish'),
(2, 6,    '2025-03-02', '07:00:00', '07:30:00', '30 min treadmill run'),
(2, 7,    '2025-03-02', '07:30:00', '07:45:00', 'Jump rope intervals'),
(3, 9,    '2025-03-01', '18:00:00', '18:15:00', 'Hamstring stretches'),
(3, 10,   '2025-03-01', '18:15:00', '18:30:00', 'Evening yoga flow'),
(4, 11,   '2025-03-03', '06:30:00', '06:50:00', 'Burpee sets'),
(4, 12,   '2025-03-03', '06:50:00', '07:10:00', NULL),
(4, NULL, '2025-03-03', '07:10:00', '07:20:00', 'Cooldown - no specific exercise');