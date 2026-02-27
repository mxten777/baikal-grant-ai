-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin', 'user', 'reviewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Programs (Grant Support Programs)
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    apply_start_date TIMESTAMP WITH TIME ZONE,
    apply_end_date TIMESTAMP WITH TIME ZONE,
    budget_amount DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'closed'
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forms (Form definitions linked to programs)
CREATE TABLE forms (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Form Fields (Dynamic questions)
CREATE TABLE form_fields (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'select', 'checkbox', 'date', 'file', 'agreement'
    label VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL, -- internal identifier
    description TEXT,
    options JSONB, -- For select/checkbox/radio options
    is_required BOOLEAN DEFAULT FALSE,
    app_order INTEGER DEFAULT 0, -- Display order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Applications (Submissions)
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'under_review', 'revision_requested', 'approved', 'rejected', 'completed'
    submission_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    application_number VARCHAR(50) UNIQUE -- generated reference number
);

-- Application Answers (The actual data submitted)
CREATE TABLE application_answers (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES form_fields(id),
    value TEXT, -- Store answer as text, parse based on field_type
    value_json JSONB, -- For complex answers if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Application Files (Uploaded documents)
CREATE TABLE application_files (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES form_fields(id), -- If linked to specific question
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- S3/MinIO path
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Logs (History tracking)
CREATE TABLE workflow_logs (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'submit', 'review_start', 'status_change', 'comment'
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
