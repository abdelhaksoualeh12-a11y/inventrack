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
    // 🛡️ STAFF ROLE PERMISSIONS (View Only)
    // ==========================================
    if (userRole === 'Staff') {
        // Hide Users and Settings
        const restrictedLinks = document.querySelectorAll('a[href="users.html"], a[href="settings.html"]');
        restrictedLinks.forEach(link => link.style.display = 'none');
        
        // Hide all Add/Edit/Delete buttons across all pages
        const addProductBtn = document.getElementById('addProdBtn');
        if (addProductBtn) addProductBtn.style.display = 'none';
        
        const addCatBtn = document.getElementById('addCatBtn');
        if (addCatBtn) addCatBtn.style.display = 'none';
        
        const addSupplierBtn = document.getElementById('addSupplierBtn');
        if (addSupplierBtn) addSupplierBtn.style.display = 'none';
        
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) addUserBtn.style.display = 'none';
        
        // Hide all Edit and Delete buttons in tables
        const actionButtons = document.querySelectorAll('.table-actions button, .del, .fa-edit, .fa-trash-alt');
        actionButtons.forEach(btn => {
            const button = btn.closest('button') || btn;
            if (button) button.style.display = 'none';
        });
        
        // Prevent access to Users and Settings pages
        if (currentPath.includes('users.html') || currentPath.includes('settings.html')) {
            alert('🚫 Access Denied: You do not have permission to view this page.');
            window.location.href = 'dashboard.html';
        }
    }

    // ==========================================
    // 🛡️ MANAGER ROLE PERMISSIONS
    // ==========================================
    if (userRole === 'Manager') {
        // Only hide Settings (Managers can see Users page)
        const restrictedLinks = document.querySelectorAll('a[href="settings.html"]');
        restrictedLinks.forEach(link => link.style.display = 'none');
        
        // Prevent access to Settings page only
        if (currentPath.includes('settings.html')) {
            alert('🚫 Access Denied: Managers cannot access system settings.');
            window.location.href = 'dashboard.html';
        }
    }
    
    // Admin has full access - no restrictions
    
    // Display user name in sidebar if element exists
    const userNameSpan = document.getElementById('userNameDisplay');
    if (userNameSpan && userName) {
        userNameSpan.textContent = `Welcome, ${userName}`;
    }
});