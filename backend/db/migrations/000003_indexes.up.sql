CREATE INDEX IF NOT EXISTS idx_projects_owner_created_at
    ON projects (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_project_created_at
    ON tasks (project_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_tasks_project_status
    ON tasks (project_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_project_assignee
    ON tasks (project_id, assignee_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_creator
    ON tasks (project_id, creator_id);
