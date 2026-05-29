-- =====================================================
-- ARCHIVO: scripts/init.sql
-- AUTOR: Pedro Antonio Ramírez Alcántara
-- MATERIA: Vinculación Empresarial
-- GRUPO: 2007 (2026-II)
-- DOCENTE: Aarón Velasco Agustín
-- CARRERA: Ingeniería en Computación - FES Aragón
-- BASE DE DATOS: PostgreSQL 16
-- SISTEMA: EduInspect - Gestión de Reportes
-- FUNCIÓN: Inicialización de BD para Docker (primer inicio)
-- =====================================================

-- =====================================================
-- NOTA IMPORTANTE:
-- Este script se ejecuta automáticamente la PRIMERA VEZ
-- que se levanta el contenedor de PostgreSQL.
-- Para reiniciar la BD: docker compose down -v
-- =====================================================

-- =====================================================
-- 1. TABLA DE USUARIOS
-- =====================================================
-- Almacena todos los usuarios del sistema
-- Roles: admin, coordinator, technician, inspector

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
-- Catálogo de edificios de la FES Aragón

CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. TABLA DE UBICACIONES
-- =====================================================
-- Ubicaciones específicas dentro de cada edificio
-- Tipos: classroom, bathroom, common_area, lab, office

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
-- Reportes de incidencias
-- Estados: pending, assigned, in_progress, completed, cancelled

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
-- Calificaciones de los reportes (estrellas 1-5)
-- Criterios: Limpieza del Suelo, Funcionalidad de Iluminación

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
-- Evidencias fotográficas

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
-- Asignaciones de técnicos a reportes
-- Estados: assigned, accepted, in_progress, completed, rejected

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
-- Notificaciones del sistema
-- Tipos: assignment, status_change, comment, due_date

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
-- Bitácora de acciones y comentarios
-- Acciones: creation, comment, status_change, edit

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
-- ÍNDICES DE RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_assignments_technician ON assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- =====================================================
-- DATOS DE PRUEBA (seeders)
-- =====================================================

-- -----------------------------------------------------
-- USUARIOS INICIALES
-- Contraseñas:
-- - admin123 para admin
-- - Unam26!# para los demás
-- -----------------------------------------------------

INSERT INTO users (id, name, email, password_hash, role) VALUES
    (gen_random_uuid(), 'Admin Principal', 'admin@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'admin'),
    (gen_random_uuid(), 'Juan Coordinador', 'coordinador@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'coordinator'),
    (gen_random_uuid(), 'Pedro Técnico', 'tecnico@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'technician'),
    (gen_random_uuid(), 'María Inspector', 'inspector@edusync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYrTeD4y6P2G', 'inspector');

-- -----------------------------------------------------
-- EDIFICIOS PRINCIPALES
-- -----------------------------------------------------

INSERT INTO buildings (name, description) VALUES
    ('Ala Principal', 'Edificio principal de aulas y oficinas'),
    ('Ala de Ciencias', 'Laboratorios de ciencias e ingeniería'),
    ('Biblioteca', 'Biblioteca central y salas de estudio'),
    ('Gimnasio', 'Instalaciones deportivas'),
    ('Anexo', 'Aulas y laboratorios especializados');

-- -----------------------------------------------------
-- UBICACIONES
-- -----------------------------------------------------

-- Edificio Principal
INSERT INTO locations (building_id, name, location_type, floor, code) VALUES
    ((SELECT id FROM buildings WHERE name = 'Ala Principal' LIMIT 1), 'Aula 101', 'classroom', 1, 'P-101'),
    ((SELECT id FROM buildings WHERE name = 'Ala Principal' LIMIT 1), 'Aula 102', 'classroom', 1, 'P-102'),
    ((SELECT id FROM buildings WHERE name = 'Ala Principal' LIMIT 1), 'Baño Varones', 'bathroom', 1, 'P-BV1'),
    ((SELECT id FROM buildings WHERE name = 'Ala Principal' LIMIT 1), 'Baño Mujeres', 'bathroom', 1, 'P-BM1');

-- Ala de Ciencias
INSERT INTO locations (building_id, name, location_type, floor, code) VALUES
    ((SELECT id FROM buildings WHERE name = 'Ala de Ciencias' LIMIT 1), 'Laboratorio Química', 'lab', 1, 'LAB-QUI'),
    ((SELECT id FROM buildings WHERE name = 'Ala de Ciencias' LIMIT 1), 'Laboratorio Física', 'lab', 2, 'LAB-FIS'),
    ((SELECT id FROM buildings WHERE name = 'Ala de Ciencias' LIMIT 1), 'Aula 201', 'classroom', 2, 'C-201');

-- Biblioteca
INSERT INTO locations (building_id, name, location_type, floor, code) VALUES
    ((SELECT id FROM buildings WHERE name = 'Biblioteca' LIMIT 1), 'Sala de Lectura', 'common_area', 1, 'BIB-LEC'),
    ((SELECT id FROM buildings WHERE name = 'Biblioteca' LIMIT 1), 'Sala de Cómputo', 'lab', 2, 'BIB-COMP');

-- Gimnasio
INSERT INTO locations (building_id, name, location_type, floor, code) VALUES
    ((SELECT id FROM buildings WHERE name = 'Gimnasio' LIMIT 1), 'Cancha Principal', 'common_area', 1, 'GIM-CAN');

-- -----------------------------------------------------
-- REPORTES DE PRUEBA
-- -----------------------------------------------------

INSERT INTO reports (report_number, reporter_id, location_id, report_date, inspection_date, comments, status) 
SELECT 
    'R-' || LPAD(generate_series::TEXT, 5, '0'),
    (SELECT id FROM users WHERE role = 'inspector' LIMIT 1),
    (SELECT id FROM locations ORDER BY RANDOM() LIMIT 1),
    CURRENT_DATE,
    CURRENT_DATE,
    'Se requiere mantenimiento preventivo en esta área.',
    'pending'
FROM generate_series(1, 5);

-- -----------------------------------------------------
-- EVALUACIONES DE PRUEBA
-- -----------------------------------------------------

-- Agregar evaluaciones a los reportes creados
INSERT INTO evaluations (report_id, criteria_name, rating)
SELECT 
    r.id,
    'Limpieza del Suelo',
    (floor(random() * 5) + 1)
FROM reports r
WHERE NOT EXISTS (
    SELECT 1 FROM evaluations e 
    WHERE e.report_id = r.id AND e.criteria_name = 'Limpieza del Suelo'
);

INSERT INTO evaluations (report_id, criteria_name, rating)
SELECT 
    r.id,
    'Funcionalidad de Iluminación',
    (floor(random() * 5) + 1)
FROM reports r
WHERE NOT EXISTS (
    SELECT 1 FROM evaluations e 
    WHERE e.report_id = r.id AND e.criteria_name = 'Funcionalidad de Iluminación'
);

-- =====================================================
-- CONSULTAS ÚTILES PARA VERIFICACIÓN
-- =====================================================

-- Ver todos los usuarios
-- SELECT id, name, email, role, is_active FROM users;

-- Ver todos los edificios y sus ubicaciones
-- SELECT b.name as edificio, l.name as ubicacion, l.location_type, l.floor 
-- FROM locations l JOIN buildings b ON l.building_id = b.id 
-- ORDER BY b.name, l.floor, l.name;

-- Ver todos los reportes
-- SELECT id, report_number, status, report_date FROM reports ORDER BY id DESC;

-- =====================================================
-- LIMPIEZA COMPLETA (descomentar para reiniciar)
-- =====================================================
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;
-- =====================================================