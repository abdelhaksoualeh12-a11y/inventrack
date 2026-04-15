// auth.js - Role Based Access Control with Active Page Highlighting

(function () {
    // Check authentication immediately before DOM loads
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const currentPath = window.location.pathname;
    const isIndexPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');
    const isLoginPage = currentPath.endsWith('index.html') || currentPath.endsWith('login.html');

    // If not on login page and no token, redirect to login
    if (!isLoginPage && !token) {
        window.location.href = 'index.html';
        return;
    }

    // If on login page but already logged in, redirect to dashboard
    if (isLoginPage && token && userRole) {
        if (userRole === 'Staff') {
            window.location.href = 'products.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        return;
    }

    // Only run DOM manipulations after DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
        // Double-check authentication for protected pages
        if (!isIndexPage && !token) {
            window.location.href = 'index.html';
            return;
        }

        // ==========================================
        // 🎯 ACTIVE PAGE HIGHLIGHTING
        // ==========================================
        function highlightActivePage() {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const sidebarLinks = document.querySelectorAll('.sidebar a');

            sidebarLinks.forEach(link => {
                const href = link.getAttribute('href');
                // Remove active class from all links
                link.classList.remove('active');

                // Add active class to matching link
                if (href === currentPage) {
                    link.classList.add('active');
                }
                // Special case for index.html (login page)
                if (currentPage === '' || currentPage === '/' || currentPage === 'index.html') {
                    if (href === 'index.html') {
                        link.classList.add('active');
                    }
                }
            });
        }

        // Call the highlight function
        highlightActivePage();

        // ==========================================
        // 🛡️ STAFF ROLE PERMISSIONS (View Only)
        // ==========================================
        if (userRole === 'Staff') {
            // Hide Users and Settings links
            const restrictedLinks = document.querySelectorAll('a[href="users.html"], a[href="settings.html"]');
            restrictedLinks.forEach(link => link.style.display = 'none');

            // Hide all Add buttons
            const addButtons = [
                'addProdBtn', 'addCatBtn', 'addSupplierBtn', 'addUserBtn'
            ];
            addButtons.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.style.display = 'none';
            });

            // Hide all Edit and Delete buttons in tables (run after small delay to ensure tables are populated)
            setTimeout(() => {
                const actionButtons = document.querySelectorAll('.table-actions button, .del, .fa-edit, .fa-trash-alt');
                actionButtons.forEach(btn => {
                    const button = btn.closest('button') || btn;
                    if (button) button.style.display = 'none';
                });
            }, 500);

            // Prevent access to Users and Settings pages
            if (currentPath.includes('users.html') || currentPath.includes('settings.html')) {
                showWarning('Access Denied: You do not have permission to view this page.');
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
                showWarning('Access Denied: Managers cannot access system settings.');
                window.location.href = 'dashboard.html';
            }
        }

        // Admin has full access - no restrictions

        // Display user name in sidebar if element exists
        const userNameSpan = document.getElementById('userNameDisplay');
        if (userNameSpan && userName) {
            userNameSpan.innerHTML = `<i class="fas fa-user-circle"></i> Welcome, ${userName}`;
        }
    });

    // Also check before page unload
    window.addEventListener('pageshow', (event) => {
        const currentToken = localStorage.getItem('token');
        if (!isIndexPage && !currentToken) {
            window.location.href = 'index.html';
        }
    });
})();