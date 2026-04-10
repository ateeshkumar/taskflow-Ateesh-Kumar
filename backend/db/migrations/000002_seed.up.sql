INSERT INTO users (id, name, email, password_hash) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Seed User', 'test@example.com', '$2a$12$lPrRHXqTM1r6gksYMf/dpeqcptqU4I78C54T9raMAJTiYk6yG5GEC');

INSERT INTO projects (id, name, description, owner_id) VALUES
    ('00000000-0000-0000-0000-000000000010', 'Demo Project', 'A seeded project for testing', '00000000-0000-0000-0000-000000000001');

INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, creator_id, due_date) VALUES
    ('00000000-0000-0000-0000-000000000100', 'Write seed data', 'Create initial tasks for the app', 'todo', 'medium', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-04-30'),
    ('00000000-0000-0000-0000-000000000101', 'Review project', 'Inspect seeded project and tasks', 'in_progress', 'high', '00000000-0000-0000-0000-000000000010', NULL, '00000000-0000-0000-0000-000000000001', '2026-05-02'),
    ('00000000-0000-0000-0000-000000000102', 'Complete backend', 'Finish API endpoints and migrations', 'done', 'high', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-05-01');
