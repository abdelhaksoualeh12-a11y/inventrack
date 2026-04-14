// auth.js - Role Based Access Control

document.addEventListener("DOMContentLoaded", () => {
    // Fetch user role from localStorage
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    
    // Security Check: If not logged in and not on login page, redirect
    if (!userRole && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
        return;
    }

    const currentPath = window.location.pathname;

    // ==========================================
    // 🛡️ STAFF ROLE PERMISSIONS
    // ==========================================
    if (userRole === 'Staff') {
        // Hide restricted sidebar links
        const restrictedLinks = document.querySelectorAll('a[href="dashboard.html"], a[href="reports.html"], a[href="users.html"], a[href="settings.html"]');
        restrictedLinks.forEach(link => link.style.display = 'none');
        
        // Hide all Add/Edit/Delete buttons on Products page
        const addProductBtn = document.getElementById('addProdBtn');
        if (addProductBtn) addProductBtn.style.display = 'none';
        
        // Hide all Edit and Delete buttons in tables
        const actionButtons = document.querySelectorAll('.table-actions button, .del, .fa-edit, .fa-trash-alt');
        actionButtons.forEach(btn => {
            const button = btn.closest('button') || btn;
            if (button) button.style.display = 'none';
        });
        const addCatBtn = document.getElementById('addCatBtn');
        if (addCatBtn) addCatBtn.style.display = 'none';
        const addSupplierBtn = document.getElementById('addSupplierBtn');
        if (addSupplierBtn) addSupplierBtn.style.display = 'none';
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) addUserBtn.style.display = 'none';
        if (currentPath.includes('users.html') || currentPath.includes('settings.html') || 
            currentPath.includes('reports.html') || currentPath.includes('categories.html')) {
            alert('🚫 Access Denied: You do not have permission to view this page.');
            window.location.href = 'products.html';
        }

        if (currentPath.includes('dashboard.html')) {

            const editControls = document.querySelectorAll('.btn-primary, .btn-outline, .fa-edit');
            editControls.forEach(ctrl => ctrl.style.display = 'none');
        }
    }

    // ==========================================
    // 🛡️ MANAGER ROLE PERMISSIONS
    // ==========================================
    if (userRole === 'Manager') {
        const restrictedLinks = document.querySelectorAll('a[href="users.html"], a[href="settings.html"]');
        restrictedLinks.forEach(link => link.style.display = 'none');
        
        if (currentPath.includes('users.html') || currentPath.includes('settings.html')) {
            alert('🚫 Access Denied: Managers cannot access user management or system settings.');
            window.location.href = 'dashboard.html';
        }
    }
    
    // Admin has full access 

    const userNameSpan = document.getElementById('userNameDisplay');
    if (userNameSpan && userName) {
        userNameSpan.textContent = `Welcome, ${userName}`;
    }
});