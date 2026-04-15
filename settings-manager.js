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

// Currency symbols and exchange rates (relative to USD)
const currencies = {
    USD: { symbol: '$', name: 'US Dollar', rate: 1.00 },
    EUR: { symbol: '€', name: 'Euro', rate: 0.85 },
    GBP: { symbol: '£', name: 'British Pound', rate: 0.74 },
    DZD: { symbol: 'دج', name: 'Algerian Dinar', rate: 132.16 }
};

// Store original USD values for conversion
let originalPrices = new Map();

// Add conversion function
function convertCurrency(amount, fromCurrency, toCurrency) {
    const fromRate = currencies[fromCurrency]?.rate || 1;
    const toRate = currencies[toCurrency]?.rate || 1;
    return (amount / fromRate) * toRate;
}

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
    const oldSettings = getSettings();
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // Convert all prices if currency changed
    if (oldSettings.currency !== settings.currency) {
        convertAllPrices(oldSettings.currency, settings.currency);
    }
    
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
}

// Convert all price displays when currency changes
function convertAllPrices(fromCurrency, toCurrency) {
    document.querySelectorAll('[data-price]').forEach(el => {
        const originalAmount = parseFloat(el.dataset.originalPrice || el.dataset.price);
        if (!isNaN(originalAmount)) {
            // Store original USD price if not already stored
            if (!el.dataset.originalPrice) {
                el.dataset.originalPrice = originalAmount;
            }
            const convertedAmount = convertCurrency(parseFloat(el.dataset.originalPrice), 'USD', toCurrency);
            el.dataset.price = convertedAmount;
            el.innerText = formatPrice(convertedAmount);
        }
    });
    
    // Update inventory value card
    const valueCard = document.querySelector('.card-stats[style*="border-top-color: #8b5cf6"] .value');
    if (valueCard) {
        const originalAmount = parseFloat(valueCard.dataset.originalPrice || valueCard.dataset.price);
        if (!isNaN(originalAmount)) {
            if (!valueCard.dataset.originalPrice) {
                valueCard.dataset.originalPrice = originalAmount;
            }
            const convertedAmount = convertCurrency(parseFloat(valueCard.dataset.originalPrice), 'USD', toCurrency);
            valueCard.dataset.price = convertedAmount;
            valueCard.innerText = formatPrice(convertedAmount);
        }
    }
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

// Format date according to settings (without time)
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

// Format datetime according to settings (using device time)
function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const settings = getSettings();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const formattedDate = formatDate(dateStr, settings.dateFormat);

    // Use device local time instead of timezone conversion
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let timeStr = '';

    if (settings.timeFormat === '12h') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } else {
        timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    return `${formattedDate} ${timeStr}`;
}

// Format date only (without time) - alias for formatDate
function formatDateOnly(dateStr, format = null) {
    return formatDate(dateStr, format);
}

// Update all price displays on the page
function updateAllPriceDisplays() {
    const settings = getSettings();
    
    document.querySelectorAll('[data-price]').forEach(el => {
        let amount = parseFloat(el.dataset.price);
        if (!isNaN(amount)) {
            // Store original USD price
            if (!el.dataset.originalPrice) {
                el.dataset.originalPrice = amount;
            }
            // Convert from USD to selected currency
            amount = convertCurrency(parseFloat(el.dataset.originalPrice), 'USD', settings.currency);
            el.dataset.price = amount;
            el.innerText = formatPrice(amount);
        }
    });

    // Also update inventory value card
    const valueCard = document.querySelector('.card-stats[style*="border-top-color: #8b5cf6"] .value');
    if (valueCard) {
        let amount = parseFloat(valueCard.dataset.price);
        if (!isNaN(amount)) {
            if (!valueCard.dataset.originalPrice) {
                valueCard.dataset.originalPrice = amount;
            }
            amount = convertCurrency(parseFloat(valueCard.dataset.originalPrice), 'USD', settings.currency);
            valueCard.dataset.price = amount;
            valueCard.innerText = formatPrice(amount);
        }
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
window.formatDateOnly = formatDateOnly;
window.formatDateTime = formatDateTime;
window.applyGlobalSettings = applyGlobalSettings;
window.updateAllPriceDisplays = updateAllPriceDisplays;
window.updateAllDateDisplays = updateAllDateDisplays;
window.convertCurrency = convertCurrency;