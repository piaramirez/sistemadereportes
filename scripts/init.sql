-- =====================================================
-- SISTEMA DE GESTIÓN DE REPORTES - EDUINSPECT (UNAM)
-- Base de datos: PostgreSQL 16
-- =====================================================

-- 1. TABLA DE USUARIOS
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

-- 2. TABLA DE EDIFICIOS
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE UBICACIONES
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('classroom', 'bathroom', 'common_area', 'lab', 'office')),
    floor INTEGER,
    code VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE REPORTES
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

-- 5. TABLA DE EVALUACIONES
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    criteria_name VARCHAR(100) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA DE IMÁGENES
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLA DE ASIGNACIONES
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

-- 8. TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('assignment', 'status_change', 'comment', 'due_date')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABLA DE HISTORIAL
CREATE TABLE IF NOT EXISTS report_history (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_assignments_technician ON assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- =====================================================
-- INSERCIÓN DE DATOS DE PRUEBA E INFRAESTRUCTURA UNAM
-- =====================================================

-- Usuarios Iniciales (Contraseña hash cifrada correspondiente a: admin123)
INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES
    (gen_random_uuid(), 'Pedro Ramirez (Admin)', 'pia@edusync.com', '$2b$12$VyEGdrMeM9XfF55Y2SFEkebHSReQ2o6djmWw6Xo9pw/3DLlQV6Kf6', 'admin', NOW(), NOW()),
    (gen_random_uuid(), 'Alonso Coordinador', 'coordinador@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'coordinator', NOW(), NOW()),
    (gen_random_uuid(), 'Ismael Tecnico', 'tecnico@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'technician', NOW(), NOW()),
    (gen_random_uuid(), 'Maria Inspectora', 'inspector@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'inspector', NOW(), NOW());

-- Infraestructura de Edificios Principales y Áreas Especiales
INSERT INTO buildings (name, description) VALUES
    ('Edificio A1', 'Aulas generales y cubículos de ingeniería'),
    ('Edificio A2', 'Aulas generales de tronco común'),
    ('Edificio A3', 'Aulas generales'),
    ('Edificio A4', 'Aulas generales'),
    ('Edificio A5', 'Aulas generales'),
    ('Edificio A6', 'Aulas generales'),
    ('Edificio A7', 'Aulas generales'),
    ('Edificio A8', 'Aulas generales'),
    ('Biblioteca Central', 'Área de estudio, acervo y salas de cómputo'),
    ('Idiomas', 'Coordinación y laboratorios de idiomas'),
    ('Anexo', 'Aulas de especialidad, laboratorios pesados y auditorio'),
    ('Canchas Deportivas', 'Zonas de recreación y deportes al aire libre'),
    ('Gimnasio', 'Área deportiva techada y entrenamiento'),
    ('Áreas Comunes y Jardineras', 'Pasillos generales y zonas verdes de la facultad'),
    ('Estacionamiento', 'Zonas de control vehicular');

-- Procedimiento Automático para Sembrar 14 Salones y 2 Baños por Edificio (A1 a A8)
DO $$
DECLARE
    b_id INTEGER;
    edificio_nombre VARCHAR;
    i INTEGER;
BEGIN
    FOR b_id, edificio_nombre IN SELECT id, name FROM buildings WHERE name LIKE 'Edificio A%' LOOP
        
        -- Insertar 14 salones por cada edificio de la serie
        FOR i IN 1..14 LOOP
            INSERT INTO locations (building_id, name, location_type, floor, code)
            VALUES (
                b_id, 
                'Salón ' || i, 
                'classroom', 
                CASE WHEN i <= 7 THEN 1 ELSE 2 END, -- Piso 1 salones 1-7, Piso 2 salones 8-14
                edificio_nombre || '-S' || LPAD(i::text, 2, '0')
            );
        END LOOP;

        -- Insertar Baño de Hombres (Piso 1)
        INSERT INTO locations (building_id, name, location_type, floor, code)
        VALUES (b_id, 'Baño de Hombres', 'bathroom', 1, edificio_nombre || '-BH1');

        -- Insertar Baño de Mujeres (Piso 2)
        INSERT INTO locations (building_id, name, location_type, floor, code)
        VALUES (b_id, 'Baño de Mujeres', 'bathroom', 2, edificio_nombre || '-BM2');

    END LOOP;
END $$;

-- Ubicaciones Específicas en Áreas Especiales, Laboratorios y Áreas Verdes
INSERT INTO locations (building_id, name, location_type, floor, code) VALUES
    ((SELECT id FROM buildings WHERE name = 'Biblioteca Central'), 'Pasillo Principal', 'common_area', 1, 'BIB-PAS'),
    ((SELECT id FROM buildings WHERE name = 'Biblioteca Central'), 'Sala de Cómputo', 'lab', 1, 'BIB-COMP'),
    ((SELECT id FROM buildings WHERE name = 'Anexo'), 'Laboratorio de Electricidad', 'lab', 1, 'ANX-LAB-EL'),
    ((SELECT id FROM buildings WHERE name = 'Anexo'), 'Laboratorio de Ingeniería', 'lab', 1, 'ANX-LAB-ING'),
    ((SELECT id FROM buildings WHERE name = 'Anexo'), 'Laboratorio de Mecánica', 'lab', 2, 'ANX-LAB-MEC'),
    ((SELECT id FROM buildings WHERE name = 'Áreas Comunes y Jardineras'), 'Jardineras Centrales', 'common_area', 1, 'COM-JARD'),
    ((SELECT id FROM buildings WHERE name = 'Estacionamiento'), 'Acceso Principal Estacionamiento', 'common_area', 1, 'EST-ACC');

-- Generación de 10 Reportes Iniciales Aleatorios vinculados a la Infraestructura Creada
INSERT INTO reports (report_number, reporter_id, location_id, report_date, inspection_date, comments, status) 
SELECT 
    'R-' || LPAD(generate_series::TEXT, 5, '0'),
    (SELECT id FROM users WHERE role = 'inspector' LIMIT 1),
    (SELECT id FROM locations ORDER BY RANDOM() LIMIT 1),
    CURRENT_DATE,
    CURRENT_DATE,
    'Reporte automatizado de mantenimiento preventivo/correctivo.',
    CASE WHEN generate_series % 2 = 0 THEN 'pending' ELSE 'completed' END
FROM generate_series(1, 10);