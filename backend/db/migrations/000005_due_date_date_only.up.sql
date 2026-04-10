ALTER TABLE tasks
ALTER COLUMN due_date TYPE DATE
USING CASE
    WHEN due_date IS NULL THEN NULL
    ELSE due_date::date
END;
