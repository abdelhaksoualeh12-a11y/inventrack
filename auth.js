// auth.js - Role Based Access Control Simulation

document.addEventListener("DOMContentLoaded", () => {
    // 1. Fetch the user's role from temporary browser storage
    const userRole = localStorage.getItem('userRole');
    
    // 2. Security Check: If they bypassed the login page, kick them back
    if (!userRole && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
        return;
    }

    // 3. Define the current page
    const currentPath = window.location.pathname;

    // ==========================================
    // 🛡️ STAFF ROLE PERMISSIONS
    // ==========================================
    if (userRole === 'Staff') {
        // Remove restricted sidebar links (Dashboard, Reports, Users, Settings)
        const restrictedLinks = document.querySelectorAll('a[href="dashboard.html"], a[href="reports.html"], a[href="users.html"], a[href="settings.html"]');
        restrictedLinks.forEach(link => link.style.display = 'none');

        // 🗑️ REMOVE ALL DELETE/TRASH BUTTONS GLOBALLY
        const delButtons = document.querySelectorAll('.del, .fa-trash-alt');
        delButtons.forEach(icon => {
            const btn = icon.closest('button') || icon;
            btn.style.display = 'none';
        });

        // 🚨 Anti-Bypass: Prevent manual URL typing
        if (currentPath.includes('dashboard.html') || currentPath.includes('reports.html') || currentPath.includes('users.html') || currentPath.includes('settings.html')) {
            alert('🚫 Access Denied: You do not have permission as Staff to view this page.');
            window.location.href = 'products.html';
        }
    }

    // ==========================================
    // 🛡️ MANAGER ROLE PERMISSIONS
    // ==========================================
    if (userRole === 'Manager') {
        // Managers cannot access system configuration or user management
        const restrictedLinks = document.querySelectorAll('a[href="users.html"], a[href="settings.html"]');
        restrictedLinks.forEach(link => link.style.display = 'none');

        // 🚨 Anti-Bypass: Prevent manual URL typing
        if (currentPath.includes('users.html') || currentPath.includes('settings.html')) {
            alert('🚫 Access Denied: Managers cannot alter system configurations.');
            window.location.href = 'dashboard.html';
        }
    }
    
    // Admin naturally bypasses all above filters and sees everything.
});
