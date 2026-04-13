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

-- ADVANCED FEATURE 1: VIEWS

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

-- ADVANCED FEATURE 2: TRIGGER

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