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
    
    // Initialize tables - ONLY create tables, NO sample data
    async function initDatabase() {
        try {
            // Users table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'Staff',
                    status TEXT DEFAULT 'Active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Users table ready');
            
            // Categories table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS categories (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    total_products INTEGER DEFAULT 0,
                    created_date DATE DEFAULT CURRENT_DATE
                )
            `);
            console.log('✅ Categories table ready');
            
            // Products table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    sku TEXT UNIQUE NOT NULL,
                    category TEXT NOT NULL,
                    quantity INTEGER DEFAULT 0,
                    price DECIMAL(10,2) NOT NULL,
                    status TEXT DEFAULT 'In Stock',
                    alert_qty INTEGER DEFAULT 10,
                    created_date DATE DEFAULT CURRENT_DATE
                )
            `);
            console.log('✅ Products table ready');
            
            // Suppliers table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS suppliers (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    contact_person TEXT,
                    email TEXT,
                    phone TEXT,
                    status TEXT DEFAULT 'Active'
                )
            `);
            console.log('✅ Suppliers table ready');
            
            // Stock movements table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS stock_movements (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                    product_name TEXT,
                    type VARCHAR(3) CHECK (type IN ('IN', 'OUT')),
                    quantity INTEGER,
                    details TEXT,
                    date DATE DEFAULT CURRENT_DATE
                )
            `);
            console.log('✅ Stock movements table ready');
            
            // Insert ONLY the default admin user (required for login)
            const result = await pool.query("SELECT * FROM users WHERE email = 'admin@inventrack.com'");
            if (result.rows.length === 0) {
                const bcrypt = require('bcrypt');
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                await pool.query(
                    "INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)",
                    ['Admin User', 'admin@inventrack.com', hashedPassword, 'Administrator', 'Active']
                );
                console.log('✅ Default admin user created');
            }
            
            console.log('🎉 Database initialization complete - ready for your data!');
        } catch (err) {
            console.error('Database initialization error:', err);
        }
    }
    
    initDatabase();
    
} else {
    // Local development - SQLite
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'inventrack.db');
    const sqlite = new sqlite3.Database(dbPath);
    
    // Wrap SQLite methods to match PostgreSQL interface
    db = {
        query: (text, params) => {
            return new Promise((resolve, reject) => {
                if (text.toUpperCase().includes('SELECT')) {
                    sqlite.all(text, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve({ rows });
                    });
                } else {
                    sqlite.run(text, params, function(err) {
                        if (err) reject(err);
                        else resolve({ rows: [], lastID: this.lastID });
                    });
                }
            });
        },
        get: (text, params) => {
            return new Promise((resolve, reject) => {
                sqlite.get(text, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        },
        all: (text, params) => {
            return new Promise((resolve, reject) => {
                sqlite.all(text, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        },
        run: (text, params) => {
            return new Promise((resolve, reject) => {
                sqlite.run(text, params, function(err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID });
                });
            });
        }
    };
    
    // Initialize SQLite tables - ONLY tables, NO sample data
    sqlite.serialize(() => {
        sqlite.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'Staff',
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            total_products INTEGER DEFAULT 0,
            created_date DATE DEFAULT CURRENT_DATE
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sku TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            price DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'In Stock',
            alert_qty INTEGER DEFAULT 10,
            created_date DATE DEFAULT CURRENT_DATE
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            status TEXT DEFAULT 'Active'
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            product_name TEXT,
            type TEXT CHECK(type IN ('IN', 'OUT')),
            quantity INTEGER,
            details TEXT,
            date DATE DEFAULT CURRENT_DATE,
            FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
        )`);
        
        // Insert ONLY default admin user
        sqlite.get("SELECT * FROM users WHERE email = 'admin@inventrack.com'", (err, row) => {
            if (!row) {
                const bcrypt = require('bcrypt');
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                sqlite.run(`INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)`,
                    ['Admin User', 'admin@inventrack.com', hashedPassword, 'Administrator', 'Active']);
                console.log('✅ Default admin user created');
            }
        });
        
        console.log('🎉 SQLite database initialized - ready for your data!');
    });
}

module.exports = db;