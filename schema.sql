-- =====================================================
-- SISTEMA DE GESTIÓN DE REPORTES - EDUINSPECT
-- Base de datos: PostgreSQL 16
-- =====================================================

-- =====================================================
-- 1. TABLA DE USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'coordinator', 'technician', 'inspector')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. TABLA DE EDIFICIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. TABLA DE UBICACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('classroom', 'bathroom', 'common_area', 'lab', 'office')),
    floor INTEGER,
    code VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. TABLA DE REPORTES
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_number VARCHAR(20) UNIQUE NOT NULL,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id),
    report_date DATE NOT NULL,
    inspection_date DATE NOT NULL,
    comments TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. TABLA DE EVALUACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    criteria_name VARCHAR(100) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. TABLA DE IMÁGENES
-- =====================================================
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. TABLA DE ASIGNACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    resolution_notes TEXT,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'rejected'))
);

-- =====================================================
-- 8. TABLA DE NOTIFICACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('assignment', 'status_change', 'comment', 'due_date')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. TABLA DE HISTORIAL
-- =====================================================
CREATE TABLE IF NOT EXISTS report_history (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_assignments_technician ON assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- =====================================================
-- DATOS DE PRUEBA
-- =====================================================

-- Usuarios
INSERT INTO users (id, name, email, password_hash, role) VALUES
    (gen_random_uuid(), 'Admin Principal', 'admin@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'admin'),
    (gen_random_uuid(), 'Juan Coordinador', 'coordinador@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'coordinator'),
    (gen_random_uuid(), 'Pedro Técnico', 'tecnico@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'technician'),
    (gen_random_uuid(), 'María Inspector', 'inspector@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'inspector');

-- Edificios
INSERT INTO buildings (name, description) VALUES
    ('Ala Principal', 'Edificio principal de aulas'),
    ('Ala de Ciencias', 'Laboratorios'),
    ('Biblioteca', 'Biblioteca central');

-- Ubicaciones
INSERT INTO locations (building_id, name, location_type, floor, code) VALUES
    (1, 'Aula 101', 'classroom', 1, 'P-101'),
    (1, 'Aula 102', 'classroom', 1, 'P-102'),
    (1, 'Baño Varones', 'bathroom', 1, 'P-BV1');

-- Reportes
INSERT INTO reports (report_number, reporter_id, location_id, report_date, inspection_date, comments, status) 
SELECT 
    'R-' || LPAD(generate_series::TEXT, 5, '0'),
    (SELECT id FROM users WHERE role = 'inspector' LIMIT 1),
    (SELECT id FROM locations ORDER BY RANDOM() LIMIT 1),
    CURRENT_DATE,
    CURRENT_DATE,
    'Problemas de limpieza y mantenimiento encontrados.',
    'pending'
FROM generate_series(1, 5);