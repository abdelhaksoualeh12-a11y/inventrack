const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file
const db = new sqlite3.Database(path.join(__dirname, 'inventrack.db'));

// Initialize tables
db.serialize(() => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'Staff',
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Categories table
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            total_products INTEGER DEFAULT 0,
            created_date DATE DEFAULT CURRENT_DATE
        )
    `);

    // Products table
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    // Suppliers table
    db.run(`
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            status TEXT DEFAULT 'Active'
        )
    `);

    // Stock movements table
    db.run(`
        CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            product_name TEXT,
            type TEXT CHECK(type IN ('IN', 'OUT')),
            quantity INTEGER,
            details TEXT,
            date DATE DEFAULT CURRENT_DATE,
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    `);

    // Insert default admin user (password: admin123)
    db.get("SELECT * FROM users WHERE email = 'admin@inventrack.com'", (err, row) => {
        if (!row) {
            const bcrypt = require('bcrypt');
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.run(`
                INSERT INTO users (name, email, password, role, status)
                VALUES ('Admin User', 'admin@inventrack.com', ?, 'Administrator', 'Active')
            `, [hashedPassword]);
        }
    });

    // Insert sample categories if empty
    db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
        if (row.count === 0) {
            const sampleCategories = [
                ['Electronics', 'Laptops, Phones, and smart devices', 135],
                ['Accessories', 'Keyboards, mice, and desk mats', 850],
                ['Peripherals', 'Monitors, printers, and scanners', 224]
            ];
            sampleCategories.forEach(cat => {
                db.run(`INSERT INTO categories (name, description, total_products) VALUES (?, ?, ?)`, cat);
            });
        }
    });

    // Insert sample products if empty
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (row.count === 0) {
            const sampleProducts = [
                ['Dell XPS 15', 'LAP-DX15-001', 'Electronics', 45, 1299.00, 'In Stock', 10],
                ['Monitor 24" 144Hz', 'MON-24-144-01', 'Peripherals', 8, 199.99, 'Low Stock', 10],
                ['Mechanical Keyboard', 'KEY-MECH-BR-01', 'Accessories', 0, 89.50, 'Out of Stock', 10],
                ['Wireless Ergonomic Mouse', 'MOU-WIR-ERG-02', 'Accessories', 120, 45.00, 'In Stock', 10]
            ];
            sampleProducts.forEach(prod => {
                db.run(`INSERT INTO products (name, sku, category, quantity, price, status, alert_qty) VALUES (?, ?, ?, ?, ?, ?, ?)`, prod);
            });
        }
    });
});

module.exports = db;