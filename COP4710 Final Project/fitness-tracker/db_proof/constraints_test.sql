-- ============================================================
-- Fitness Tracker App - Constraint Enforcement Tests
-- Each statement below is designed to FAIL to prove constraints work
-- ============================================================

USE fitness_tracker;

-- ---------------------------------------------------------------
-- TEST 1: UNIQUE constraint on User.email
-- Trying to insert a user with an email that already exists
-- ---------------------------------------------------------------
INSERT INTO User (name, email, age, weight)
VALUES ('Fake Jorge', 'jcarm@fiu.edu', 25, 180);

-- EXPECTED ERROR:
-- Error Code: 1062. Duplicate entry 'jcarm@fiu.edu' for key 'user.email'


-- ---------------------------------------------------------------
-- TEST 2: FOREIGN KEY constraint on Workout.user_id
-- Trying to create a workout for a user that doesn't exist
-- ---------------------------------------------------------------
INSERT INTO Workout (workout_date, duration_minutes, workout_type, user_id)
VALUES ('2025-04-01', 30, 'Cardio', 999);

-- EXPECTED ERROR:
-- Error Code: 1452. Cannot add or update a child row: a foreign key constraint fails 
-- (`fitness_tracker`.`workout`, CONSTRAINT `workout_ibfk_1` FOREIGN KEY (`user_id`) 
-- REFERENCES `user` (`user_id`) ON DELETE CASCADE)



-- ---------------------------------------------------------------
-- TEST 3: NOT NULL constraint on User.name
-- Trying to insert a user without a name
-- ---------------------------------------------------------------
INSERT INTO User (name, email, age, weight)
VALUES (NULL, 'test@fiu.edu', 20, 150);

-- EXPECTED ERROR:
-- Error Code: 1048. Column 'name' cannot be null


-- ---------------------------------------------------------------
-- TEST 4: CHECK constraint on User.age
-- Trying to insert a user with a negative age
-- ---------------------------------------------------------------
INSERT INTO User (name, email, age, weight)
VALUES ('Bad Age', 'badage@fiu.edu', -5, 150);

-- EXPECTED ERROR:
-- Error Code: 3819. Check constraint 'user_chk_1' is violated.


-- ---------------------------------------------------------------
-- TEST 5: FOREIGN KEY constraint on EXERCISE.category_id
-- Trying to add an exercise with a category that doesn't exist
-- ---------------------------------------------------------------
INSERT INTO EXERCISE (category_id, exercise_name, muscle_group, equipment_needed)
VALUES (999, 'Fake Exercise', 'Arms', 'None');

-- EXPECTED ERROR:
-- Error Code: 1452. Cannot add or update a child row: a foreign key constraint fails 
-- (`fitness_tracker`.`exercise`, CONSTRAINT `exercise_ibfk_1` FOREIGN KEY (`category_id`) 
-- REFERENCES `category` (`category_id`) ON DELETE CASCADE)

