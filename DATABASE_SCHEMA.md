# DATABASE_SCHEMA.md - Esquema Completo de Logística-Hub

## 📊 Estructura de Base de Datos PostgreSQL

### Diagrama de Relaciones

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOGÍSTICA-HUB DATABASE                        │
└─────────────────────────────────────────────────────────────────┘

users_user (1) ──────┐
                     │
                     ├──> (N) vehicles_vehicle
                     │
                     └──> (N) drivers_driver

vehicles_vehicle (1) ──────┐
                           ├──> (N) documents_vehicledocument
                           ├──> (N) fines_fine
                           ├──> (N) maintenance_maintenanceschedule
                           ├──> (N) maintenance_maintenancerecord
                           └──> (N) vehicles_authorizeddriver (M2M)

drivers_driver (1) ──────┐
                         ├──> (N) documents_driverdocument
                         ├──> (N) fines_fine
                         ├──> (N) vehicles_authorizeddriver (M2M)
                         └──> (N) audit_auditlog

workshops_workshop (1) ──> (N) maintenance_maintenancerecord

maintenance_maintenancerecord ──> maintenance_maintenancetype
                              ──> vehicles_vehicle
                              ──> workshops_workshop
                              ──> users_user

alerts_alert ──> vehicles_vehicle
             ──> drivers_driver
             ──> documents_vehicledocument
             ──> documents_driverdocument

audit_auditlog ──> users_user (User que hizo cambio)
                ──> Relación genérica a cualquier modelo
```

---

## 📋 Tablas Detalladas

### 1. users_user
```sql
CREATE TABLE users_user (
    id BIGINT PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    identification_number VARCHAR(20) UNIQUE,
    phone_number VARCHAR(20),
    role VARCHAR(20) CHOICES: 'admin', 'supervisor', 'conductor',
    avatar ImageField,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP
);

-- Índices
CREATE INDEX idx_users_user_username ON users_user(username);
CREATE INDEX idx_users_user_email ON users_user(email);
CREATE INDEX idx_users_user_role ON users_user(role);
```

### 2. users_userloginhistory
```sql
CREATE TABLE users_userloginhistory (
    id BIGINT PRIMARY KEY,
    user_id BIGINT REFERENCES users_user(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_timestamp TIMESTAMP,
    logout_timestamp TIMESTAMP,
    is_active BOOLEAN
);

CREATE INDEX idx_userloginhistory_user ON users_userloginhistory(user_id);
```

### 3. vehicles_vehicle
```sql
CREATE TABLE vehicles_vehicle (
    id BIGINT PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    internal_number VARCHAR(50),
    brand VARCHAR(100),
    line VARCHAR(100),
    model VARCHAR(100),
    vehicle_type VARCHAR(20) CHOICES: 'carga', 'pasajeros', 'mixto', 'especial',
    vin VARCHAR(50) UNIQUE,
    engine_number VARCHAR(50),
    capacity INT,
    owner VARCHAR(200),
    status VARCHAR(20) CHOICES: 'operativo', 'mantenimiento', 'fuera_servicio',
    current_km INT DEFAULT 0,
    soat_expiration_date DATE,
    rtm_expiration_date DATE,
    primary_driver_id BIGINT REFERENCES drivers_driver(id) ON DELETE SET NULL,
    last_maintenance_date DATE,
    last_maintenance_km INT,
    next_maintenance_date DATE,
    registration_date DATE,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Índices
CREATE INDEX idx_vehicles_license_plate ON vehicles_vehicle(license_plate);
CREATE INDEX idx_vehicles_primary_driver ON vehicles_vehicle(primary_driver_id);
CREATE INDEX idx_vehicles_status ON vehicles_vehicle(status);
CREATE INDEX idx_vehicles_soat_expiration ON vehicles_vehicle(soat_expiration_date);
CREATE INDEX idx_vehicles_rtm_expiration ON vehicles_vehicle(rtm_expiration_date);
```

### 4. vehicles_authorizeddriver
```sql
CREATE TABLE vehicles_authorizeddriver (
    id BIGINT PRIMARY KEY,
    vehicle_id BIGINT REFERENCES vehicles_vehicle(id) ON DELETE CASCADE,
    driver_id BIGINT REFERENCES drivers_driver(id) ON DELETE CASCADE,
    assigned_date TIMESTAMP,
    created_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_vehicles_authorizeddriver_unique 
    ON vehicles_authorizeddriver(vehicle_id, driver_id);
```

### 5. drivers_driver
```sql
CREATE TABLE drivers_driver (
    id BIGINT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    identification_number VARCHAR(20) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(254),
    license_number VARCHAR(20) UNIQUE,
    license_category VARCHAR(10) CHOICES: 'A1', 'A2', 'A', 'B', 'C', 'D', 'E',
    license_expiration_date DATE,
    date_of_birth DATE,
    entry_date DATE,
    status VARCHAR(20) CHOICES: 'activo', 'inactivo', 'suspendido', 'jubilado',
    violations_count INT DEFAULT 0,
    accidents_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Índices
CREATE INDEX idx_drivers_identification ON drivers_driver(identification_number);
CREATE INDEX idx_drivers_license_number ON drivers_driver(license_number);
CREATE INDEX idx_drivers_license_expiration ON drivers_driver(license_expiration_date);
CREATE INDEX idx_drivers_status ON drivers_driver(status);
```

### 6. maintenance_maintenancetype
```sql
CREATE TABLE maintenance_maintenancetype (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) CHOICES: 'preventivo', 'correctivo', 'predictivo', 'legal',
    description TEXT,
    created_at TIMESTAMP
);
```

### 7. maintenance_maintenanceschedule
```sql
CREATE TABLE maintenance_maintenanceschedule (
    id BIGINT PRIMARY KEY,
    vehicle_id BIGINT REFERENCES vehicles_vehicle(id) ON DELETE CASCADE,
    maintenance_type_id BIGINT REFERENCES maintenance_maintenancetype(id) ON DELETE PROTECT,
    frequency INT NOT NULL,
    frequency_unit VARCHAR(10) CHOICES: 'days', 'km', 'months',
    last_maintenance_date DATE,
    last_maintenance_km INT,
    next_maintenance_date DATE,
    next_maintenance_km INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_maintenance_schedule_unique 
    ON maintenance_maintenanceschedule(vehicle_id, maintenance_type_id);
```

### 8. maintenance_maintenancerecord
```sql
CREATE TABLE maintenance_maintenancerecord (
    id BIGINT PRIMARY KEY,
    vehicle_id BIGINT REFERENCES vehicles_vehicle(id) ON DELETE CASCADE,
    schedule_id BIGINT REFERENCES maintenance_maintenanceschedule(id) ON DELETE SET NULL,
    maintenance_type_id BIGINT REFERENCES maintenance_maintenancetype(id) ON DELETE PROTECT,
    workshop_id BIGINT REFERENCES workshops_workshop(id) ON DELETE SET NULL,
    date DATE,
    km INT,
    description TEXT,
    cost DECIMAL(10,2),
    parts_cost DECIMAL(10,2) DEFAULT 0,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) CHOICES: 'pendiente', 'en_proceso', 'completado', 'cancelado',
    responsible_id BIGINT REFERENCES users_user(id) ON DELETE SET NULL,
    invoice FileField,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_maintenance_record_vehicle ON maintenance_maintenancerecord(vehicle_id);
CREATE INDEX idx_maintenance_record_date ON maintenance_maintenancerecord(date);
CREATE INDEX idx_maintenance_record_status ON maintenance_maintenancerecord(status);
```

### 9. documents_vehicledocument
```sql
CREATE TABLE documents_vehicledocument (
    id BIGINT PRIMARY KEY,
    vehicle_id BIGINT REFERENCES vehicles_vehicle(id) ON DELETE CASCADE,
    document_type VARCHAR(50) CHOICES: 'soat', 'rtm', 'propiedad', 'seguro', 'factura', 'otro',
    issue_date DATE,
    expiration_date DATE,
    document_number VARCHAR(100),
    file FileField,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_vehicledocument_vehicle ON documents_vehicledocument(vehicle_id);
CREATE INDEX idx_vehicledocument_expiration ON documents_vehicledocument(expiration_date);
```

### 10. documents_driverdocument
```sql
CREATE TABLE documents_driverdocument (
    id BIGINT PRIMARY KEY,
    driver_id BIGINT REFERENCES drivers_driver(id) ON DELETE CASCADE,
    document_type VARCHAR(50) CHOICES: 'licencia', 'cedula', 'certificado_aptitud', 'afiliacion', 'otro',
    issue_date DATE,
    expiration_date DATE,
    document_number VARCHAR(100),
    file FileField,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_driverdocument_driver ON documents_driverdocument(driver_id);
CREATE INDEX idx_driverdocument_expiration ON documents_driverdocument(expiration_date);
```

### 11. fines_fine
```sql
CREATE TABLE fines_fine (
    id BIGINT PRIMARY KEY,
    vehicle_id BIGINT REFERENCES vehicles_vehicle(id) ON DELETE CASCADE,
    driver_id BIGINT REFERENCES drivers_driver(id) ON DELETE SET NULL,
    violation_code VARCHAR(50),
    description TEXT,
    amount DECIMAL(10,2),
    fine_date DATE,
    status VARCHAR(20) CHOICES: 'pendiente', 'pagada', 'en_impugnacion', 'anulada',
    officer_name VARCHAR(200),
    location VARCHAR(200),
    ticket_attachment FileField,
    payment_proof FileField,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_fine_vehicle ON fines_fine(vehicle_id);
CREATE INDEX idx_fine_driver ON fines_fine(driver_id);
CREATE INDEX idx_fine_status ON fines_fine(status);
CREATE INDEX idx_fine_date ON fines_fine(fine_date);
```

### 12. workshops_workshop
```sql
CREATE TABLE workshops_workshop (
    id BIGINT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    nit VARCHAR(50) UNIQUE NOT NULL,
    address VARCHAR(300),
    phone_number VARCHAR(20),
    email VARCHAR(254),
    contact_person VARCHAR(200),
    specialties VARCHAR(500),  -- JSON field: ['mecanica', 'electronica', 'llantas', etc]
    rating DECIMAL(3,2) DEFAULT 0,  -- 0-5 stars
    service_history INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_workshop_nit ON workshops_workshop(nit);
CREATE INDEX idx_workshop_active ON workshops_workshop(is_active);
```

### 13. alerts_alert
```sql
CREATE TABLE alerts_alert (
    id BIGINT PRIMARY KEY,
    alert_type VARCHAR(50) CHOICES: 'soat_vencimiento', 'rtm_vencimiento', 'licencia_vencimiento', 
                                    'mantenimiento_vencido', 'multa_pendiente', 'documento_faltante',
    priority VARCHAR(20) CHOICES: 'baja', 'media', 'alta', 'critica',
    vehicle_id BIGINT REFERENCES vehicles_vehicle(id) ON DELETE CASCADE,
    driver_id BIGINT REFERENCES drivers_driver(id) ON DELETE SET NULL,
    vehicle_document_id BIGINT REFERENCES documents_vehicledocument(id) ON DELETE CASCADE,
    driver_document_id BIGINT REFERENCES documents_driverdocument(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) CHOICES: 'activa', 'resuelta', 'ignorada',
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_email_sent BOOLEAN DEFAULT FALSE,
    email_recipients TEXT,  -- JSON: ['email1@example.com', 'email2@example.com']
    resolution_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_alert_vehicle ON alerts_alert(vehicle_id);
CREATE INDEX idx_alert_driver ON alerts_alert(driver_id);
CREATE INDEX idx_alert_status ON alerts_alert(status);
CREATE INDEX idx_alert_type ON alerts_alert(alert_type);
CREATE INDEX idx_alert_created ON alerts_alert(created_at);
```

### 14. audit_auditlog
```sql
CREATE TABLE audit_auditlog (
    id BIGINT PRIMARY KEY,
    user_id BIGINT REFERENCES users_user(id) ON DELETE SET NULL,
    action VARCHAR(50) CHOICES: 'crear', 'actualizar', 'eliminar', 'ver', 'login', 'logout',
    model_name VARCHAR(100),
    object_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    changes JSONB,  -- JSON con cambios: {"campo": {"old": "valor_viejo", "new": "valor_nuevo"}}
    created_at TIMESTAMP
);

CREATE INDEX idx_auditlog_user ON audit_auditlog(user_id);
CREATE INDEX idx_auditlog_action ON audit_auditlog(action);
CREATE INDEX idx_auditlog_model ON audit_auditlog(model_name);
CREATE INDEX idx_auditlog_created ON audit_auditlog(created_at);
```

---

## 🔍 Vistas SQL para KPIs

### Vista: Cumplimiento Documental por Vehículo
```sql
CREATE VIEW v_compliance_by_vehicle AS
SELECT 
    v.id,
    v.license_plate,
    v.brand,
    CASE 
        WHEN v.soat_expiration_date > CURRENT_DATE THEN 1 
        ELSE 0 
    END as soat_valid,
    CASE 
        WHEN v.rtm_expiration_date > CURRENT_DATE THEN 1 
        ELSE 0 
    END as rtm_valid,
    (CASE 
        WHEN v.soat_expiration_date > CURRENT_DATE THEN 1 
        ELSE 0 
    END + CASE 
        WHEN v.rtm_expiration_date > CURRENT_DATE THEN 1 
        ELSE 0 
    END) * 50 as compliance_percentage,
    v.updated_at
FROM vehicles_vehicle v;
```

### Vista: Costo Promedio de Mantenimiento
```sql
CREATE VIEW v_maintenance_cost_analysis AS
SELECT 
    v.id,
    v.license_plate,
    COUNT(mr.id) as total_maintenance,
    AVG(mr.cost) as avg_cost,
    SUM(mr.cost) as total_cost,
    AVG(mr.cost * 1000 / (v.current_km - COALESCE(mr.km, v.current_km))) as cost_per_km
FROM vehicles_vehicle v
LEFT JOIN maintenance_maintenancerecord mr ON v.id = mr.vehicle_id
GROUP BY v.id, v.license_plate;
```

### Vista: Reporte de Multas
```sql
CREATE VIEW v_fines_report AS
SELECT 
    DATE_TRUNC('month', f.fine_date)::DATE as month,
    COUNT(f.id) as total_fines,
    SUM(f.amount) as total_amount,
    COUNT(CASE WHEN f.status = 'pagada' THEN 1 END) as fines_paid,
    COUNT(CASE WHEN f.status = 'pendiente' THEN 1 END) as fines_pending
FROM fines_fine f
GROUP BY DATE_TRUNC('month', f.fine_date);
```

---

## 📊 Estadísticas de Tablas

| Tabla | Registros Estimados | Índices |
|-------|-------------------|---------|
| users_user | 50-100 | 3 |
| vehicles_vehicle | 200+ | 5 |
| drivers_driver | 300+ | 4 |
| maintenance_* | 2000+ | 3 |
| documents_* | 1000+ | 2 |
| fines_fine | 500+ | 4 |
| alerts_alert | 100+ | 4 |
| audit_auditlog | 10000+ | 3 |

---

## 🔐 Privilegios de Roles

```sql
-- Admin: Acceso completo
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO admin;

-- Supervisor: Lectura total, escritura parcial
GRANT SELECT ON ALL TABLES IN SCHEMA public TO supervisor;
GRANT INSERT, UPDATE ON vehicles_vehicle, drivers_driver TO supervisor;

-- Conductor: Solo datos propios
GRANT SELECT ON vehicles_vehicle, drivers_driver TO conductor;
```

---

## ⚡ Optimizaciones

✅ Índices en columnas de búsqueda frecuente
✅ Índices en fechas de vencimiento
✅ Índices en relaciones FK
✅ Particionamiento por fecha (alertas, auditoría) opcional
✅ Vacuum y Analyze periódicos
✅ Estadísticas actualizadas automáticamente

