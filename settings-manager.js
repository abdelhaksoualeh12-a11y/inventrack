// settings-manager.js - Global settings management

// Default settings
const defaultSettings = {
    currency: 'USD',
    currencyPosition: 'before',
    decimalPlaces: 2,
    timezone: 'UTC',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
};

// Currency symbols
const currencies = {
    USD: { symbol: '$', name: 'US Dollar', rate: 1.00 },
    EUR: { symbol: '€', name: 'Euro', rate: 0.92 },
    GBP: { symbol: '£', name: 'British Pound', rate: 0.79 },
    DZD: { symbol: 'دج', name: 'Algerian Dinar', rate: 134.50 }
};

// Get current settings
function getSettings() {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
    }
    return defaultSettings;
}

// Save settings
function saveSettings(settings) {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
}

// Format price according to settings
function formatPrice(amount) {
    if (amount === undefined || amount === null) return '0';
    const settings = getSettings();
    const decimals = parseInt(settings.decimalPlaces);
    const formattedAmount = parseFloat(amount).toFixed(decimals);
    const currencyInfo = currencies[settings.currency];
    const symbol = currencyInfo ? currencyInfo.symbol : '$';
    
    if (settings.currencyPosition === 'before') {
        return `${symbol}${formattedAmount}`;
    } else {
        return `${formattedAmount} ${symbol}`;
    }
}

// Format date according to settings
function formatDate(dateStr, format = null) {
    if (!dateStr) return '';
    const settings = getSettings();
    const dateFormat = format || settings.dateFormat;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    switch(dateFormat) {
        case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
        case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
        default: return `${day}/${month}/${year}`;
    }
}

// Format datetime according to settings
function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const settings = getSettings();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const formattedDate = formatDate(dateStr, settings.dateFormat);
    
    const options = {
        timeZone: settings.timezone,
        hour12: settings.timeFormat === '12h',
        hour: '2-digit',
        minute: '2-digit'
    };
    const timeStr = date.toLocaleTimeString('en-US', options);
    
    return `${formattedDate} ${timeStr}`;
}

// Update all price displays on the page
function updateAllPriceDisplays() {
    document.querySelectorAll('[data-price]').forEach(el => {
        const amount = parseFloat(el.dataset.price);
        if (!isNaN(amount)) {
            el.innerText = formatPrice(amount);
        }
    });
    
    // Also update inventory value card
    const valueCard = document.querySelector('.card-stats[style*="border-top-color: #8b5cf6"] .value');
    if (valueCard && valueCard.dataset.price) {
        valueCard.innerText = formatPrice(parseFloat(valueCard.dataset.price));
    }
}

// Update all date displays on the page
function updateAllDateDisplays() {
    document.querySelectorAll('[data-date]').forEach(el => {
        const dateStr = el.dataset.date;
        if (dateStr) {
            el.innerText = formatDateTime(dateStr);
        }
    });
}

// Apply all global settings to current page
function applyGlobalSettings() {
    updateAllPriceDisplays();
    updateAllDateDisplays();
}

// Initialize settings when page loads
document.addEventListener('DOMContentLoaded', () => {
    applyGlobalSettings();
});

// Listen for settings changes
window.addEventListener('settingsChanged', (e) => {
    applyGlobalSettings();
});

// Expose globally
window.getSettings = getSettings;
window.saveSettings = saveSettings;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.applyGlobalSettings = applyGlobalSettings;
window.updateAllPriceDisplays = updateAllPriceDisplays;
window.updateAllDateDisplays = updateAllDateDisplays;