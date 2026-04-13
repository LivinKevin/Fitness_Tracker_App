-- ============================================================
-- Fitness Tracker App - Application Queries
-- These queries are all executed through the Express backend
-- ============================================================

USE fitness_tracker;

-- ---------------------------------------------------------------
-- QUERY 1: Get all exercises with their category (INNER JOIN)
-- ---------------------------------------------------------------
SELECT e.exercise_id, e.exercise_name, e.category_id,
       c.category_name, e.muscle_group, e.equipment_needed
FROM EXERCISE e
INNER JOIN CATEGORY c ON e.category_id = c.category_id
ORDER BY c.category_name, e.exercise_name;


-- ---------------------------------------------------------------
-- QUERY 2: Get exercises filtered by category (WHERE + JOIN)
-- ---------------------------------------------------------------
SELECT e.exercise_id, e.exercise_name, e.category_id,
       c.category_name, e.muscle_group, e.equipment_needed
FROM EXERCISE e
INNER JOIN CATEGORY c ON e.category_id = c.category_id
WHERE e.category_id = 1
ORDER BY e.exercise_name;


-- ---------------------------------------------------------------
-- QUERY 3: Search exercises by muscle group (LIKE / pattern match)
-- ---------------------------------------------------------------
SELECT e.exercise_id, e.exercise_name, e.category_id,
       c.category_name, e.muscle_group, e.equipment_needed
FROM EXERCISE e
INNER JOIN CATEGORY c ON e.category_id = c.category_id
WHERE e.muscle_group LIKE '%Legs%'
ORDER BY e.exercise_name;


-- ---------------------------------------------------------------
-- QUERY 4: Get all workouts with user name (INNER JOIN)
-- ---------------------------------------------------------------
SELECT w.workout_id, w.workout_date, w.duration_minutes,
       w.workout_type, w.user_id, u.name AS user_name
FROM Workout w
INNER JOIN User u ON w.user_id = u.user_id
ORDER BY w.workout_date DESC;


-- ---------------------------------------------------------------
-- QUERY 5: Get all sessions with workout and exercise info (multiple JOINs)
-- ---------------------------------------------------------------
SELECT s.session_id, s.workout_id, s.exercise_id, s.session_date,
       s.start_time, s.end_time, s.notes,
       w.workout_type,
       e.exercise_name, e.muscle_group
FROM Session s
INNER JOIN Workout w ON s.workout_id = w.workout_id
LEFT JOIN EXERCISE e ON s.exercise_id = e.exercise_id
ORDER BY s.session_date DESC, s.start_time DESC;


-- ---------------------------------------------------------------
-- QUERY 6: Count exercises per category (GROUP BY + aggregate)
-- ---------------------------------------------------------------
SELECT c.category_name, COUNT(*) AS exercise_count
FROM EXERCISE e
INNER JOIN CATEGORY c ON e.category_id = c.category_id
GROUP BY c.category_name
ORDER BY exercise_count DESC;


-- ---------------------------------------------------------------
-- QUERY 7: Get a user's total workout minutes (aggregate + WHERE)
-- ---------------------------------------------------------------
SELECT u.name, SUM(w.duration_minutes) AS total_minutes,
       COUNT(w.workout_id) AS workout_count
FROM User u
INNER JOIN Workout w ON u.user_id = w.user_id
WHERE u.user_id = 1
GROUP BY u.name;


-- ---------------------------------------------------------------
-- QUERY 8: Get single user with their workouts (nested lookup)
-- ---------------------------------------------------------------
SELECT u.user_id, u.name, u.email, u.age, u.weight,
       w.workout_id, w.workout_date, w.duration_minutes, w.workout_type
FROM User u
LEFT JOIN Workout w ON u.user_id = w.user_id
WHERE u.user_id = 1
ORDER BY w.workout_date DESC;


-- ---------------------------------------------------------------
-- QUERY 9: Get exercises that require no equipment (simple WHERE)
-- ---------------------------------------------------------------
SELECT exercise_name, muscle_group
FROM EXERCISE
WHERE equipment_needed = 'None';


-- ---------------------------------------------------------------
-- QUERY 10: Find users who have not logged any workouts (LEFT JOIN + NULL check)
-- ---------------------------------------------------------------
SELECT u.user_id, u.name, u.email
FROM User u
LEFT JOIN Workout w ON u.user_id = w.user_id
WHERE w.workout_id IS NULL;
