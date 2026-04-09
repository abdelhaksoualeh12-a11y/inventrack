// validation.js - Input validation functions

function validateProduct(product) {
    if (!product.name || product.name.trim().length < 2) {
        alert('❌ Product name must be at least 2 characters');
        return false;
    }
    if (!product.sku || product.sku.trim().length < 3) {
        alert('❌ SKU must be at least 3 characters');
        return false;
    }
    if (product.quantity < 0 || isNaN(product.quantity)) {
        alert('❌ Quantity cannot be negative');
        return false;
    }
    if (product.price <= 0 || isNaN(product.price)) {
        alert('❌ Price must be greater than 0');
        return false;
    }
    if (product.alert_qty < 1 || isNaN(product.alert_qty)) {
        alert('❌ Low stock alert must be at least 1');
        return false;
    }
    return true;
}

function validateCategory(category) {
    if (!category.name || category.name.trim().length < 2) {
        alert('❌ Category name must be at least 2 characters');
        return false;
    }
    return true;
}

function validateSupplier(supplier) {
    if (!supplier.name || supplier.name.trim().length < 2) {
        alert('❌ Supplier name must be at least 2 characters');
        return false;
    }
    if (supplier.email && !isValidEmail(supplier.email)) {
        alert('❌ Please enter a valid email address');
        return false;
    }
    if (supplier.phone && supplier.phone.length < 5) {
        alert('❌ Please enter a valid phone number');
        return false;
    }
    return true;
}

function validateUser(user) {
    if (!user.name || user.name.trim().length < 2) {
        alert('❌ User name must be at least 2 characters');
        return false;
    }
    if (!isValidEmail(user.email)) {
        alert('❌ Please enter a valid email address');
        return false;
    }
    return true;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}