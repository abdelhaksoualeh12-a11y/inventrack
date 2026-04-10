const { Pool } = require('pg');

// PostgreSQL on Render only
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test connection on startup
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1); // Exit if can't connect to database
    } else {
        console.log('✅ Database connected successfully');
        release();
    }
});

// Database wrapper methods
const db = {
    query: (text, params) => pool.query(text, params),
    
    get: async (text, params) => {
        const result = await pool.query(text, params);
        return result.rows[0];
    },
    
    all: async (text, params) => {
        const result = await pool.query(text, params);
        return result.rows;
    },
    
    run: async (text, params) => {
        const result = await pool.query(text, params);
        return { lastID: result.rows[0]?.id };
    }
};

// Initialize tables
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
        
        // Insert admin user if not exists
        const result = await pool.query("SELECT * FROM users WHERE email = 'admin@inventrack.com'");
        if (result.rows.length === 0) {
            const bcrypt = require('bcrypt');
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            await pool.query(
                "INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)",
                ['Admin User', 'admin@inventrack.com', hashedPassword, 'Administrator', 'Active']
            );
            console.log('✅ Admin user created');
        } else {
            console.log('✅ Admin user already exists');
        }
        
        console.log('🎉 Database ready!');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

initDatabase();

module.exports = db;