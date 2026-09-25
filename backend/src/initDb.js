import { pool } from './config/db.js'; import fs from 'fs'; import bcrypt from 'bcryptjs';
const sql=fs.readFileSync(new URL('./schema.sql',import.meta.url),'utf8');
await pool.query(sql);
const hash=await bcrypt.hash('ChangeMe123!',12);
await pool.query(`INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,'admin') ON CONFLICT(email) DO NOTHING`,['Clinic Administrator','admin@thedentallounge.local',hash]);
console.log('Database initialized. Default admin: admin@thedentallounge.local / ChangeMe123! (change immediately)'); await pool.end();
