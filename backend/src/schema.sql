CREATE TABLE IF NOT EXISTS users (
 id SERIAL PRIMARY KEY, full_name VARCHAR(120) NOT NULL, email VARCHAR(160) UNIQUE NOT NULL,
 password_hash TEXT NOT NULL, role VARCHAR(30) NOT NULL CHECK(role IN ('admin','doctor','receptionist')),
 active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS patients (
 id SERIAL PRIMARY KEY, patient_code VARCHAR(20) UNIQUE NOT NULL, full_name VARCHAR(140) NOT NULL,
 phone VARCHAR(30), cnic VARCHAR(30), gender VARCHAR(20), date_of_birth DATE, address TEXT,
 medical_history TEXT, allergies TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS appointments (
 id SERIAL PRIMARY KEY, patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
 doctor_id INT REFERENCES users(id) ON DELETE SET NULL, appointment_at TIMESTAMPTZ NOT NULL,
 reason TEXT, status VARCHAR(25) DEFAULT 'scheduled' CHECK(status IN ('scheduled','confirmed','completed','cancelled','no-show')),
 notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS treatments (
 id SERIAL PRIMARY KEY, patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
 doctor_id INT REFERENCES users(id) ON DELETE SET NULL, appointment_id INT REFERENCES appointments(id) ON DELETE SET NULL,
 treatment_date DATE DEFAULT CURRENT_DATE, tooth_no VARCHAR(30), diagnosis TEXT, procedure TEXT NOT NULL,
 prescription TEXT, clinical_notes TEXT, fee NUMERIC(12,2) DEFAULT 0 CHECK(fee>=0), created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS invoices (
 id SERIAL PRIMARY KEY, invoice_no VARCHAR(30) UNIQUE NOT NULL, patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
 treatment_id INT REFERENCES treatments(id) ON DELETE SET NULL, total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(total>=0),
 discount NUMERIC(12,2) DEFAULT 0 CHECK(discount>=0), status VARCHAR(20) DEFAULT 'unpaid' CHECK(status IN ('unpaid','partial','paid')),
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS payments (
 id SERIAL PRIMARY KEY, invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
 amount NUMERIC(12,2) NOT NULL CHECK(amount>0), method VARCHAR(30) DEFAULT 'cash', reference VARCHAR(100),
 paid_at TIMESTAMPTZ DEFAULT NOW(), received_by INT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_at ON appointments(appointment_at);
