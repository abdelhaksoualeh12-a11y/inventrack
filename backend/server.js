const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = 'your-secret-key-change-this-in-production';

app.use(cors({
    origin: ['https://inventrack-frontend-5jru.onrender.com', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// ============ ROOT & TEST ENDPOINTS ============
app.get('/', (req, res) => {
    res.json({ message: 'InvenTrack API is running!', status: 'online' });
});

app.get('/api/debug', async (req, res) => {
    try {
        const test = await db.get("SELECT 1 as connected", []);
        res.json({ status: 'Database connected', test: test, dbType: 'PostgreSQL' });
    } catch (error) {
        res.json({ status: 'Database error', error: error.message });
    }
});

app.get('/api/debug/users', async (req, res) => {
    try {
        const users = await db.all("SELECT id, name, email, role FROM users", []);
        res.json({ users, count: users.length });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// ============ AUTHENTICATION ============
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.get("SELECT * FROM users WHERE email = $1", [email]);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/reset-admin', async (req, res) => {
    try {
        const newHashedPassword = bcrypt.hashSync('admin123', 10);
        await db.run(
            `INSERT INTO users (name, email, password, role, status) 
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (email) DO UPDATE SET 
             password = $3, role = $4, status = $5`,
            ['Admin User', 'admin@inventrack.com', newHashedPassword, 'Administrator', 'Active']
        );
        const user = await db.get("SELECT * FROM users WHERE email = $1", ['admin@inventrack.com']);
        res.json({ message: 'Admin reset complete', user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Reset admin error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/change-password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.id !== userId) return res.status(403).json({ error: 'You can only change your own password' });
        
        const user = await db.get("SELECT * FROM users WHERE id = $1", [userId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const validPassword = bcrypt.compareSync(currentPassword, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Current password is incorrect' });
        
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await db.run("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/reset-password', async (req, res) => {
    const { userId, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'Administrator') return res.status(403).json({ error: 'Only administrators can reset passwords' });
        
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await db.run("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Admin reset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ PRODUCTS ============
app.get('/api/products', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM products ORDER BY created_date DESC", []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    const { name, sku, category, quantity, price, alert_qty } = req.body;
    const status = quantity === 0 ? 'Out of Stock' : quantity <= alert_qty ? 'Low Stock' : 'In Stock';
    try {
        const result = await db.run(
            `INSERT INTO products (name, sku, category, quantity, price, status, alert_qty) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [name, sku, category, quantity, price, status, alert_qty]
        );
        res.json({ id: result.lastID, message: 'Product added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const { name, sku, category, quantity, price, alert_qty } = req.body;
    const status = quantity === 0 ? 'Out of Stock' : quantity <= alert_qty ? 'Low Stock' : 'In Stock';
    try {
        await db.run(
            `UPDATE products SET name=$1, sku=$2, category=$3, quantity=$4, price=$5, status=$6, alert_qty=$7 WHERE id=$8`,
            [name, sku, category, quantity, price, status, alert_qty, req.params.id]
        );
        res.json({ message: 'Product updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.run(`DELETE FROM products WHERE id=$1`, [req.params.id]);
        res.json({ message: 'Product deleted successfully' });
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
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', async (req, res) => {
    const { name, description, total_products } = req.body;
    try {
        const result = await db.run(
            `INSERT INTO categories (name, description, total_products) VALUES ($1, $2, $3)`,
            [name, description, total_products || 0]
        );
        res.json({ id: result.lastID, message: 'Category added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    const { name, description, total_products } = req.body;
    try {
        await db.run(
            `UPDATE categories SET name=$1, description=$2, total_products=$3 WHERE id=$4`,
            [name, description, total_products, req.params.id]
        );
        res.json({ message: 'Category updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        await db.run(`DELETE FROM categories WHERE id=$1`, [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ SUPPLIERS ============
app.get('/api/suppliers', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM suppliers", []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/suppliers', async (req, res) => {
    const { name, contact_person, email, phone, status } = req.body;
    try {
        const result = await db.run(
            `INSERT INTO suppliers (name, contact_person, email, phone, status) VALUES ($1, $2, $3, $4, $5)`,
            [name, contact_person, email, phone, status || 'Active']
        );
        res.json({ id: result.lastID, message: 'Supplier added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/suppliers/:id', async (req, res) => {
    const { name, contact_person, email, phone, status } = req.body;
    try {
        await db.run(
            `UPDATE suppliers SET name=$1, contact_person=$2, email=$3, phone=$4, status=$5 WHERE id=$6`,
            [name, contact_person, email, phone, status, req.params.id]
        );
        res.json({ message: 'Supplier updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        await db.run(`DELETE FROM suppliers WHERE id=$1`, [req.params.id]);
        res.json({ message: 'Supplier deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ STOCK MOVEMENTS ============
app.get('/api/stock-movements', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM stock_movements ORDER BY date DESC LIMIT 50", []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stock-movements', async (req, res) => {
    const { product_id, product_name, type, quantity, details } = req.body;
    try {
        const result = await db.run(
            `INSERT INTO stock_movements (product_id, product_name, type, quantity, details) VALUES ($1, $2, $3, $4, $5)`,
            [product_id, product_name, type, quantity, details]
        );
        if (type === 'IN') {
            await db.run(`UPDATE products SET quantity = quantity + $1 WHERE id = $2`, [quantity, product_id]);
        } else {
            await db.run(`UPDATE products SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1`, [quantity, product_id]);
        }
        res.json({ id: result.lastID, message: 'Stock movement recorded' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/stock-movements/clear-all', async (req, res) => {
    try {
        // Delete all stock movement records
        const result = await db.run(`DELETE FROM stock_movements`, []);
        
        res.json({ 
            message: 'All stock movement records have been deleted',
            deletedCount: result.rowCount || 0
        });
    } catch (error) {
        console.error('Clear stock movements error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============ DELETE STOCK MOVEMENTS FOR A SPECIFIC PRODUCT ============
app.delete('/api/stock-movements/product/:productId', async (req, res) => {
    const productId = req.params.productId;
    
    try {
        const result = await db.run(`DELETE FROM stock_movements WHERE product_id = $1`, [productId]);
        
        res.json({ 
            message: `Stock movements for product ${productId} deleted`,
            deletedCount: result.rowCount || 0
        });
    } catch (error) {
        console.error('Delete product movements error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ============ DASHBOARD ============
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const productStats = await db.get("SELECT COUNT(*) as total_products, COALESCE(SUM(quantity), 0) as total_stock FROM products", []);
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
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/inventory-value', async (req, res) => {
    try {
        const result = await db.get("SELECT COALESCE(SUM(quantity * price), 0) as total_value FROM products", []);
        res.json({ total_value: result?.total_value || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/most-sold-products', async (req, res) => {
    const range = req.query.range || 'month';
    let dateCondition = '';
    switch (range) {
        case 'week': dateCondition = "date >= CURRENT_DATE - INTERVAL '7 days'"; break;
        case 'month': dateCondition = "date >= CURRENT_DATE - INTERVAL '30 days'"; break;
        case 'year': dateCondition = "date >= CURRENT_DATE - INTERVAL '365 days'"; break;
        default: dateCondition = "date >= CURRENT_DATE - INTERVAL '30 days'";
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
        res.status(500).json({ error: error.message });
    }
});

// ============ USERS ============
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.all("SELECT id, name, email, role, status, created_at FROM users ORDER BY id", []);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { name, email, role, status, password } = req.body;
    const plainPassword = password || 'password123';
    const hashedPassword = bcrypt.hashSync(plainPassword, 10);
    try {
        const result = await db.run(
            `INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)`,
            [name, email, hashedPassword, role, status || 'Active']
        );
        res.json({ id: result.lastID, message: 'User created', temporaryPassword: !password ? 'password123' : null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { name, email, role, status } = req.body;
    try {
        await db.run(
            `UPDATE users SET name=$1, email=$2, role=$3, status=$4 WHERE id=$5`,
            [name, email, role, status, req.params.id]
        );
        res.json({ message: 'User updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await db.run(`DELETE FROM users WHERE id=$1 AND role != 'Administrator'`, [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server on port ${PORT}`));