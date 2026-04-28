-- Create medicines table for inventory
CREATE TABLE medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create prescriptions table to link doctor, patient, and medicines
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, dispensed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create prescription_items table for individual medicines in a prescription
CREATE TABLE prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  duration VARCHAR(100) NOT NULL
);

-- RLS Policies
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read medicines" ON medicines FOR SELECT USING (true);
CREATE POLICY "Allow all update medicines" ON medicines FOR UPDATE USING (true);
CREATE POLICY "Allow all read prescriptions" ON prescriptions FOR SELECT USING (true);
CREATE POLICY "Allow all insert prescriptions" ON prescriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update prescriptions" ON prescriptions FOR UPDATE USING (true);
CREATE POLICY "Allow all read prescription_items" ON prescription_items FOR SELECT USING (true);
CREATE POLICY "Allow all insert prescription_items" ON prescription_items FOR INSERT WITH CHECK (true);

-- Insert dummy inventory
INSERT INTO medicines (id, name, category, stock, price)
VALUES 
  (gen_random_uuid(), 'Paracetamol 500mg', 'Tablet', 1000, 2.50),
  (gen_random_uuid(), 'Amoxicillin 250mg', 'Capsule', 500, 15.00),
  (gen_random_uuid(), 'Ibuprofen 400mg', 'Tablet', 800, 5.00),
  (gen_random_uuid(), 'Cetirizine 10mg', 'Tablet', 600, 3.00),
  (gen_random_uuid(), 'Cough Syrup 100ml', 'Syrup', 200, 45.00),
  (gen_random_uuid(), 'Ashwagandha Churna', 'Ayurvedic', 300, 120.00),
  (gen_random_uuid(), 'Triphala Guggulu', 'Ayurvedic', 400, 85.00),
  (gen_random_uuid(), 'Panchakarma Oil 200ml', 'Ayurvedic', 150, 250.00);
