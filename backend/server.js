const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = 'your-secret-key-change-this';

app.use(cors());
app.use(express.json());

// ============ AUTHENTICATION ============
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
});

// ============ PRODUCTS ============
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products ORDER BY created_date DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', (req, res) => {
    const { name, sku, category, quantity, price, alert_qty } = req.body;
    const status = quantity === 0 ? 'Out of Stock' : quantity <= alert_qty ? 'Low Stock' : 'In Stock';

    db.run(`INSERT INTO products (name, sku, category, quantity, price, status, alert_qty) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, sku, category, quantity, price, status, alert_qty],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Product added' });
        });
});

app.put('/api/products/:id', (req, res) => {
    const { name, sku, category, quantity, price, alert_qty } = req.body;
    const status = quantity === 0 ? 'Out of Stock' : quantity <= alert_qty ? 'Low Stock' : 'In Stock';

    db.run(`UPDATE products SET name=?, sku=?, category=?, quantity=?, price=?, status=?, alert_qty=? WHERE id=?`,
        [name, sku, category, quantity, price, status, alert_qty, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product updated' });
        });
});

app.delete('/api/products/:id', (req, res) => {
    db.run(`DELETE FROM products WHERE id=?`, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product deleted' });
    });
});

// ============ CATEGORIES ============
app.get('/api/categories', (req, res) => {
    db.all("SELECT * FROM categories", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/categories', (req, res) => {
    const { name, description, total_products } = req.body;
    db.run(`INSERT INTO categories (name, description, total_products) VALUES (?, ?, ?)`,
        [name, description, total_products || 0],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Category added' });
        });
});

app.put('/api/categories/:id', (req, res) => {
    const { name, description, total_products } = req.body;
    db.run(`UPDATE categories SET name=?, description=?, total_products=? WHERE id=?`,
        [name, description, total_products, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Category updated' });
        });
});

app.delete('/api/categories/:id', (req, res) => {
    db.run(`DELETE FROM categories WHERE id=?`, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Category deleted' });
    });
});

// ============ SUPPLIERS ============
app.get('/api/suppliers', (req, res) => {
    db.all("SELECT * FROM suppliers", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/suppliers', (req, res) => {
    const { name, contact_person, email, phone, status } = req.body;
    db.run(`INSERT INTO suppliers (name, contact_person, email, phone, status) VALUES (?, ?, ?, ?, ?)`,
        [name, contact_person, email, phone, status || 'Active'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Supplier added' });
        });
});

app.put('/api/suppliers/:id', (req, res) => {
    const { name, contact_person, email, phone, status } = req.body;
    db.run(`UPDATE suppliers SET name=?, contact_person=?, email=?, phone=?, status=? WHERE id=?`,
        [name, contact_person, email, phone, status, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Supplier updated' });
        });
});

app.delete('/api/suppliers/:id', (req, res) => {
    db.run(`DELETE FROM suppliers WHERE id=?`, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Supplier deleted' });
    });
});

// ============ STOCK MOVEMENTS ============
app.get('/api/stock-movements', (req, res) => {
    db.all("SELECT * FROM stock_movements ORDER BY date DESC LIMIT 50", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/stock-movements', (req, res) => {
    const { product_id, product_name, type, quantity, details } = req.body;

    db.run(`INSERT INTO stock_movements (product_id, product_name, type, quantity, details) VALUES (?, ?, ?, ?, ?)`,
        [product_id, product_name, type, quantity, details],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Update product quantity
            const updateQuery = type === 'IN'
                ? `UPDATE products SET quantity = quantity + ? WHERE id = ?`
                : `UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?`;

            if (type === 'IN') {
                db.run(updateQuery, [quantity, product_id]);
            } else {
                db.run(updateQuery, [quantity, product_id, quantity]);
            }

            res.json({ id: this.lastID, message: 'Stock movement recorded' });
        });
});

// ============ DASHBOARD STATS ============
app.get('/api/dashboard/stats', (req, res) => {
    db.get("SELECT COUNT(*) as total_products, SUM(quantity) as total_stock FROM products", (err, productStats) => {
        db.get("SELECT COUNT(*) as total_categories FROM categories", (err, categoryStats) => {
            db.get("SELECT COUNT(*) as low_stock FROM products WHERE status = 'Low Stock'", (err, lowStockStats) => {
                db.get("SELECT COUNT(*) as out_of_stock FROM products WHERE status = 'Out of Stock'", (err, outOfStockStats) => {
                    res.json({
                        total_products: productStats.total_products || 0,
                        total_stock: productStats.total_stock || 0,
                        total_categories: categoryStats.total_categories || 0,
                        low_stock: lowStockStats.low_stock || 0,
                        out_of_stock: outOfStockStats.out_of_stock || 0
                    });
                });
            });
        });
    });
});
// ============ USERS ============
app.get('/api/users', (req, res) => {
    db.all("SELECT id, name, email, role, status, created_at FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/users', (req, res) => {
    const { name, email, role, status } = req.body;
    const bcrypt = require('bcrypt');
    const defaultPassword = bcrypt.hashSync('password123', 10);

    db.run(`INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)`,
        [name, email, defaultPassword, role, status || 'Active'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

app.put('/api/users/:id', (req, res) => {
    const { name, email, role, status } = req.body;
    db.run(`UPDATE users SET name=?, email=?, role=?, status=? WHERE id=?`,
        [name, email, role, status, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'User updated' });
        });
});

app.delete('/api/users/:id', (req, res) => {
    db.run(`DELETE FROM users WHERE id=? AND role != 'Administrator'`, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted' });
    });
});
// ============ INVENTORY VALUE ============
app.get('/api/inventory-value', (req, res) => {
    db.get("SELECT SUM(quantity * price) as total_value FROM products", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total_value: result.total_value || 0 });
    });
});
// ============ MOST SOLD PRODUCTS ============
app.get('/api/most-sold-products', (req, res) => {
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
    
    db.all(`
        SELECT product_name, SUM(quantity) as total_sold 
        FROM stock_movements 
        WHERE type = 'OUT' AND ${dateCondition}
        GROUP BY product_name 
        ORDER BY total_sold DESC 
        LIMIT 10
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});
app.listen(PORT, () => console.log(`Server on port ${PORT}`));