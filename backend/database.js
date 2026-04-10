const { Pool } = require('pg');
const path = require('path');

// Use PostgreSQL on Render, fallback to SQLite locally
let db;

if (process.env.DATABASE_URL) {
    // Production - PostgreSQL on Render
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    db = {
        query: (text, params) => pool.query(text, params),
        get: (text, params) => pool.query(text, params).then(res => res.rows[0]),
        all: (text, params) => pool.query(text, params).then(res => res.rows),
        run: (text, params) => pool.query(text, params)
    };
    
    // Initialize tables
    const initQueries = [
        `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'Staff',
            status TEXT DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            total_products INTEGER DEFAULT 0,
            created_date DATE DEFAULT CURRENT_DATE
        )`,
        `CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            sku TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            price DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'In Stock',
            alert_qty INTEGER DEFAULT 10,
            created_date DATE DEFAULT CURRENT_DATE
        )`,
        `CREATE TABLE IF NOT EXISTS suppliers (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            status TEXT DEFAULT 'Active'
        )`,
        `CREATE TABLE IF NOT EXISTS stock_movements (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES products(id),
            product_name TEXT,
            type TEXT CHECK(type IN ('IN', 'OUT')),
            quantity INTEGER,
            details TEXT,
            date DATE DEFAULT CURRENT_DATE
        )`
    ];
    
    Promise.all(initQueries.map(q => pool.query(q))).then(() => {
        // Insert default admin
        pool.query("SELECT * FROM users WHERE email = 'admin@inventrack.com'").then(result => {
            if (result.rows.length === 0) {
                const bcrypt = require('bcrypt');
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                pool.query(
                    "INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)",
                    ['Admin User', 'admin@inventrack.com', hashedPassword, 'Administrator', 'Active']
                );
            }
        });
    });
} else {
    // Local development - SQLite
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(path.join(__dirname, 'inventrack.db'));
    
    // ... existing SQLite initialization code
}

module.exports = db;