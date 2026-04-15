
function createToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    return container;
}

// Toast types with their configurations
const toastConfigs = {
    success: {
        icon: 'fa-check-circle',
        bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        iconColor: '#10b981'
    },
    error: {
        icon: 'fa-exclamation-circle',
        bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        iconColor: '#ef4444'
    },
    warning: {
        icon: 'fa-exclamation-triangle',
        bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        iconColor: '#f59e0b'
    },
    info: {
        icon: 'fa-info-circle',
        bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        iconColor: '#3b82f6'
    }
};

// Show a toast notification
function showToast(message, type = 'success', duration = 3000) {
    const container = createToastContainer();
    const config = toastConfigs[type] || toastConfigs.success;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
        padding: 14px 20px;
        min-width: 280px;
        max-width: 400px;
        transform: translateX(400px);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        border-left: 4px solid ${config.iconColor};
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.95);
        pointer-events: auto;
    `;
    
    // Icon
    const icon = document.createElement('i');
    icon.className = `fas ${config.icon}`;
    icon.style.cssText = `
        font-size: 22px;
        color: ${config.iconColor};
        flex-shrink: 0;
    `;
    
    // Message container
    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        color: #0f172a;
        line-height: 1.4;
    `;
    messageContainer.textContent = message;
    
    // Close button
    const closeBtn = document.createElement('i');
    closeBtn.className = 'fas fa-times';
    closeBtn.style.cssText = `
        font-size: 14px;
        color: #94a3b8;
        cursor: pointer;
        transition: color 0.2s;
        flex-shrink: 0;
    `;
    closeBtn.onmouseover = () => closeBtn.style.color = '#ef4444';
    closeBtn.onmouseout = () => closeBtn.style.color = '#94a3b8';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        removeToast(toast);
    };
    
    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: ${config.iconColor};
        width: 100%;
        border-radius: 0 0 0 12px;
        transition: width ${duration}ms linear;
    `;
    
    toast.appendChild(icon);
    toast.appendChild(messageContainer);
    toast.appendChild(closeBtn);
    toast.appendChild(progressBar);
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Start progress bar animation
    setTimeout(() => {
        progressBar.style.width = '0%';
    }, 50);
    
    // Auto remove
    const timeout = setTimeout(() => {
        removeToast(toast);
    }, duration);
    
    // Allow clicking to dismiss
    toast.onclick = (e) => {
        if (e.target !== closeBtn) {
            clearTimeout(timeout);
            removeToast(toast);
        }
    };
    
    return toast;
}

function removeToast(toast) {
    toast.style.transform = 'translateX(400px)';
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Convenience methods
function showSuccess(message, duration) {
    return showToast(message, 'success', duration);
}

function showError(message, duration) {
    return showToast(message, 'error', duration);
}

function showWarning(message, duration) {
    return showToast(message, 'warning', duration);
}

function showInfo(message, duration) {
    return showToast(message, 'info', duration);
}

// Override native alert for better UX (optional)
window.alert = function(message) {
    showWarning(message, 3000);
};

// Export for use
window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;