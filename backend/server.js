const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = 'your-secret-key-change-this';

app.use(cors({
    origin: ['https://inventrack-frontend-5jru.onrender.com', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Root endpoint for testing
app.get('/', (req, res) => {
    res.json({ message: 'InvenTrack API is running!', status: 'online' });
});

// ============ AUTHENTICATION ============
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ PRODUCTS ============
app.get('/api/products', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM products ORDER BY created_date DESC", []);
        res.json(rows);
    } catch (error) {
        console.error('Products error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    const { name, sku, category, quantity, price, alert_qty } = req.body;
    const status = quantity === 0 ? 'Out of Stock' : quantity <= alert_qty ? 'Low Stock' : 'In Stock';
    
    try {
        const result = await db.run(
            `INSERT INTO products (name, sku, category, quantity, price, status, alert_qty) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, sku, category, quantity, price, status, alert_qty]
        );
        res.json({ id: result.lastID, message: 'Product added' });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const { name, sku, category, quantity, price, alert_qty } = req.body;
    const status = quantity === 0 ? 'Out of Stock' : quantity <= alert_qty ? 'Low Stock' : 'In Stock';
    
    try {
        await db.run(
            `UPDATE products SET name=?, sku=?, category=?, quantity=?, price=?, status=?, alert_qty=? WHERE id=?`,
            [name, sku, category, quantity, price, status, alert_qty, req.params.id]
        );
        res.json({ message: 'Product updated' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.run(`DELETE FROM products WHERE id=?`, [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ CATEGORIES ============
app.get('/api/categories', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM categories", []);
        res.json(rows);
    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', async (req, res) => {
    const { name, description, total_products } = req.body;
    
    try {
        const result = await db.run(
            `INSERT INTO categories (name, description, total_products) VALUES (?, ?, ?)`,
            [name, description, total_products || 0]
        );
        res.json({ id: result.lastID, message: 'Category added' });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    const { name, description, total_products } = req.body;
    
    try {
        await db.run(
            `UPDATE categories SET name=?, description=?, total_products=? WHERE id=?`,
            [name, description, total_products, req.params.id]
        );
        res.json({ message: 'Category updated' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        await db.run(`DELETE FROM categories WHERE id=?`, [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ SUPPLIERS ============
app.get('/api/suppliers', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM suppliers", []);
        res.json(rows);
    } catch (error) {
        console.error('Suppliers error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/suppliers', async (req, res) => {
    const { name, contact_person, email, phone, status } = req.body;
    
    try {
        const result = await db.run(
            `INSERT INTO suppliers (name, contact_person, email, phone, status) VALUES (?, ?, ?, ?, ?)`,
            [name, contact_person, email, phone, status || 'Active']
        );
        res.json({ id: result.lastID, message: 'Supplier added' });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/suppliers/:id', async (req, res) => {
    const { name, contact_person, email, phone, status } = req.body;
    
    try {
        await db.run(
            `UPDATE suppliers SET name=?, contact_person=?, email=?, phone=?, status=? WHERE id=?`,
            [name, contact_person, email, phone, status, req.params.id]
        );
        res.json({ message: 'Supplier updated' });
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        await db.run(`DELETE FROM suppliers WHERE id=?`, [req.params.id]);
        res.json({ message: 'Supplier deleted' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ STOCK MOVEMENTS ============
app.get('/api/stock-movements', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM stock_movements ORDER BY date DESC LIMIT 50", []);
        res.json(rows);
    } catch (error) {
        console.error('Stock movements error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stock-movements', async (req, res) => {
    const { product_id, product_name, type, quantity, details } = req.body;
    
    try {
        const result = await db.run(
            `INSERT INTO stock_movements (product_id, product_name, type, quantity, details) VALUES (?, ?, ?, ?, ?)`,
            [product_id, product_name, type, quantity, details]
        );
        
        // Update product quantity
        if (type === 'IN') {
            await db.run(`UPDATE products SET quantity = quantity + ? WHERE id = ?`, [quantity, product_id]);
        } else {
            await db.run(`UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?`, [quantity, product_id, quantity]);
        }
        
        res.json({ id: result.lastID, message: 'Stock movement recorded' });
    } catch (error) {
        console.error('Stock movement error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ DASHBOARD STATS ============
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const productStats = await db.get("SELECT COUNT(*) as total_products, SUM(quantity) as total_stock FROM products", []);
        const categoryStats = await db.get("SELECT COUNT(*) as total_categories FROM categories", []);
        const lowStockStats = await db.get("SELECT COUNT(*) as low_stock FROM products WHERE status = 'Low Stock'", []);
        const outOfStockStats = await db.get("SELECT COUNT(*) as out_of_stock FROM products WHERE status = 'Out of Stock'", []);
        
        res.json({
            total_products: productStats?.total_products || 0,
            total_stock: productStats?.total_stock || 0,
            total_categories: categoryStats?.total_categories || 0,
            low_stock: lowStockStats?.low_stock || 0,
            out_of_stock: outOfStockStats?.out_of_stock || 0
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ USERS ============
app.get('/api/users', async (req, res) => {
    try {
        const rows = await db.all("SELECT id, name, email, role, status, created_at FROM users", []);
        res.json(rows);
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { name, email, role, status } = req.body;
    const defaultPassword = bcrypt.hashSync('password123', 10);
    
    try {
        const result = await db.run(
            `INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)`,
            [name, email, defaultPassword, role, status || 'Active']
        );
        res.json({ id: result.lastID });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { name, email, role, status } = req.body;
    
    try {
        await db.run(
            `UPDATE users SET name=?, email=?, role=?, status=? WHERE id=?`,
            [name, email, role, status, req.params.id]
        );
        res.json({ message: 'User updated' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await db.run(`DELETE FROM users WHERE id=? AND role != 'Administrator'`, [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ INVENTORY VALUE ============
app.get('/api/inventory-value', async (req, res) => {
    try {
        const result = await db.get("SELECT SUM(quantity * price) as total_value FROM products", []);
        res.json({ total_value: result?.total_value || 0 });
    } catch (error) {
        console.error('Inventory value error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ MOST SOLD PRODUCTS ============
app.get('/api/most-sold-products', async (req, res) => {
    const range = req.query.range || 'month';
    let dateCondition = '';
    
    switch(range) {
        case 'week':
            dateCondition = "date >= date('now', '-7 days')";
            break;
        case 'month':
            dateCondition = "date >= date('now', '-30 days')";
            break;
        case 'year':
            dateCondition = "date >= date('now', '-365 days')";
            break;
        default:
            dateCondition = "date >= date('now', '-30 days')";
    }
    
    try {
        const rows = await db.all(`
            SELECT product_name, SUM(quantity) as total_sold 
            FROM stock_movements 
            WHERE type = 'OUT' AND ${dateCondition}
            GROUP BY product_name 
            ORDER BY total_sold DESC 
            LIMIT 10
        `, []);
        res.json(rows || []);
    } catch (error) {
        console.error('Most sold products error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============ DEBUG - Check database connection ============
app.get('/api/debug', async (req, res) => {
    try {
        // Test database connection
        const test = await db.get("SELECT 1 as connected", []);
        res.json({ 
            status: 'Database connected', 
            test: test,
            dbType: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'
        });
    } catch (error) {
        res.json({ 
            status: 'Database error', 
            error: error.message,
            stack: error.stack
        });
    }
});

// Debug users endpoint
app.get('/api/debug/users', async (req, res) => {
    try {
        const users = await db.all("SELECT id, name, email, role FROM users", []);
        res.json({ users, count: users.length });
    } catch (error) {
        res.json({ error: error.message });
    }
});
// ============ CREATE ADMIN (Temporary) ============
app.post('/api/setup-admin', async (req, res) => {
    try {
        // Check if admin exists
        const existing = await db.get("SELECT * FROM users WHERE email = 'admin@inventrack.com'", []);
        
        if (existing) {
            return res.json({ message: 'Admin already exists', user: existing });
        }
        
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        const result = await db.run(
            "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
            ['Admin User', 'admin@inventrack.com', hashedPassword, 'Administrator', 'Active']
        );
        
        res.json({ message: 'Admin created successfully', id: result.lastID });
    } catch (error) {
        console.error('Setup admin error:', error);
        res.status(500).json({ error: error.message });
    }
});
app.listen(PORT, () => console.log(`Server on port ${PORT}`));