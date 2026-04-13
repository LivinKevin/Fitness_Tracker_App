DROP DATABASE IF EXISTS fitness_tracker;
 
CREATE DATABASE IF NOT EXISTS fitness_tracker;
USE fitness_tracker;
 
CREATE TABLE User (
    user_id   INT          AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    email     VARCHAR(100) NOT NULL UNIQUE,
    age       INT          CHECK (age > 0 AND age < 150),
    weight    INT          CHECK (weight > 0 AND weight < 1000)
);
 
CREATE TABLE CATEGORY (
    category_id   INT          AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50)  NOT NULL UNIQUE,
    description   TEXT
);
 
CREATE TABLE Workout (
    workout_id       INT          AUTO_INCREMENT PRIMARY KEY,
    workout_date     DATE         NOT NULL,
    duration_minutes INT          CHECK (duration_minutes >= 0),
    workout_type     VARCHAR(50),
    user_id          INT          NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);
 
CREATE TABLE EXERCISE (
    exercise_id      INT          AUTO_INCREMENT PRIMARY KEY,
    category_id      INT          NOT NULL,
    exercise_name    VARCHAR(100) NOT NULL,
    muscle_group     VARCHAR(50),
    equipment_needed VARCHAR(100),
    FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id) ON DELETE CASCADE
);
 
CREATE TABLE Session (
    session_id   INT          AUTO_INCREMENT PRIMARY KEY,
    workout_id   INT          NOT NULL,
    exercise_id  INT,
    session_date DATE         NOT NULL,
    start_time   TIME,
    end_time     TIME,
    notes        TEXT,
    FOREIGN KEY (workout_id)  REFERENCES Workout(workout_id)   ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES EXERCISE(exercise_id) ON DELETE SET NULL
);
 
-- ============================================================
-- SAMPLE DATA
-- ============================================================
 
INSERT INTO User (name, email, age, weight) VALUES
('Jorge Carmenate',  'jcarm@fiu.edu',    22, 175),
('Kevin Herrera',    'kherr@fiu.edu',    21, 160),
('Kevin Garcia',     'kgarc@fiu.edu',    23, 180),
('Paola Oropeza',   'porop@fiu.edu',    22, NULL);
 
INSERT INTO CATEGORY (category_name, description) VALUES
('Strength',    'Resistance-based exercises targeting muscle growth and power'),
('Cardio',      'Aerobic exercises that improve cardiovascular endurance'),
('Flexibility', 'Stretching and mobility exercises for range of motion'),
('HIIT',        'High-Intensity Interval Training combining bursts of effort with rest');
 
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
 
INSERT INTO Workout (workout_date, duration_minutes, workout_type, user_id) VALUES
('2025-03-01', 60, 'Strength',    1),
('2025-03-02', 45, 'Cardio',      1),
('2025-03-01', 30, 'Flexibility', 2),
('2025-03-03', 50, 'HIIT',        3),
('2025-03-04', 0,  'Strength',    4);
 
INSERT INTO Session (workout_id, exercise_id, session_date, start_time, end_time, notes) VALUES
(1, 1,    '2025-03-01', '08:00:00', '08:20:00', 'Heavy bench day - 4x5'),
(1, 2,    '2025-03-01', '08:25:00', '08:45:00', 'Deadlift working sets'),
(1, 3,    '2025-03-01', '08:50:00', '09:10:00', 'Squats to finish'),
(2, 6,    '2025-03-02', '07:00:00', '07:30:00', '30 min treadmill run'),
(2, 7,    '2025-03-02', '07:30:00', '07:45:00', 'Jump rope intervals'),
(3, 9,    '2025-03-01', '18:00:00', '18:15:00', 'Hamstring stretches'),
(3, 10,   '2025-03-01', '18:15:00', '18:30:00', 'Evening yoga flow'),
(4, 11,   '2025-03-03', '06:30:00', '06:50:00', 'Burpee sets'),
(4, 12,   '2025-03-03', '06:50:00', '07:10:00', 'Mountain climber finisher'),
(4, NULL, '2025-03-03', '07:10:00', '07:20:00', 'Cooldown - no specific exercise');
 
-- ============================================================
-- ADVANCED FEATURE 1: VIEWS
-- ============================================================
 
CREATE VIEW workout_summary AS
SELECT w.workout_id, w.workout_date, w.duration_minutes, w.workout_type,
       u.user_id, u.name AS user_name,
       COUNT(s.session_id) AS session_count
FROM Workout w
INNER JOIN User u ON w.user_id = u.user_id
LEFT JOIN Session s ON w.workout_id = s.workout_id
GROUP BY w.workout_id, w.workout_date, w.duration_minutes,
         w.workout_type, u.user_id, u.name;
 
CREATE VIEW exercise_stats AS
SELECT e.exercise_id, e.exercise_name, c.category_name,
       e.muscle_group, COUNT(s.session_id) AS times_used
FROM EXERCISE e
INNER JOIN CATEGORY c ON e.category_id = c.category_id
LEFT JOIN Session s ON e.exercise_id = s.exercise_id
GROUP BY e.exercise_id, e.exercise_name, c.category_name, e.muscle_group;
 
-- ============================================================
-- ADVANCED FEATURE 2: TRIGGER
-- Recalculates workout duration when a session is deleted directly
-- ============================================================
 
DELIMITER //
 
CREATE TRIGGER update_workout_duration_after_delete
AFTER DELETE ON Session
FOR EACH ROW
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE Workout
    SET duration_minutes = (
        SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time)), 0)
        FROM Session s
        WHERE s.workout_id = OLD.workout_id
          AND s.start_time IS NOT NULL
          AND s.end_time IS NOT NULL
    )
    WHERE workout_id = OLD.workout_id;
END//
 
DELIMITER ;