/**
 * Main Application Logic
 * Core functionality for Pharmacy Management System
 */

// Application State
const appState = {
    user: null,
    isAuthenticated: false,
    currentPage: 'dashboard',
    theme: 'light',
    language: 'en',
    notifications: [],
    cart: [],
    selectedCustomer: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Check authentication
    await checkAuth();
    
    // Initialize theme
    initTheme();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load user data
    if (appState.isAuthenticated) {
        await loadUserData();
    }
    
    // Initialize page specific functions
    initPageSpecific();
    
    // Start notification polling
    startNotificationPolling();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
}

// Authentication Check
async function checkAuth() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userData) {
        appState.isAuthenticated = true;
        appState.user = JSON.parse(userData);
        
        // Verify token with server
        try {
            const response = await api.getProfile();
            if (response.success) {
                appState.user = response.data;
                updateUserInterface();
            } else {
                logout();
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            logout();
        }
    } else {
        // Check if on protected page
        const protectedPages = ['dashboard.html', 'medicines.html', 'customers.html', 
                                'sales.html', 'purchases.html', 'suppliers.html', 
                                'prescriptions.html', 'reports.html'];
        
        const currentPage = window.location.pathname.split('/').pop();
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    appState.theme = savedTheme;
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    appState.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', appState.theme);
    
    // Update theme toggle icon
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    showToast(`${isDark ? 'Dark' : 'Light'} mode activated`, 'success');
}

// Event Listeners
function initEventListeners() {
    // Global event listeners
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // Form submissions
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
    
    // Dynamic content loading
    window.addEventListener('popstate', handlePopState);
}

function handleGlobalClick(e) {
    // Close dropdowns when clicking outside
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }
    
    // Handle dynamic buttons
    if (e.target.closest('.delete-btn')) {
        const id = e.target.closest('.delete-btn').dataset.id;
        if (confirm('Are you sure you want to delete this item?')) {
            handleDelete(id);
        }
    }
}

function handleGlobalKeydown(e) {
    // Keyboard shortcuts
    if (e.ctrlKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                if (appState.currentPage === 'sales') {
                    document.getElementById('searchProduct')?.focus();
                }
                break;
            case 'd':
                e.preventDefault();
                window.location.href = 'dashboard.html';
                break;
            case 'm':
                e.preventDefault();
                window.location.href = 'medicines.html';
                break;
            case 'c':
                e.preventDefault();
                window.location.href = 'customers.html';
                break;
            case 'p':
                e.preventDefault();
                window.location.href = 'purchases.html';
                break;
            case 'r':
                e.preventDefault();
                window.location.href = 'reports.html';
                break;
        }
    }
    
    // ESC key to close modals
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            bootstrap.Modal.getInstance(openModal).hide();
        }
    }
    
    // F1 for help
    if (e.key === 'F1') {
        e.preventDefault();
        showHelpModal();
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    // Validate form
    if (!validateForm(form)) {
        return false;
    }
    
    // Submit form data
    submitFormData(form, formData);
}

// Form Validation
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('is-invalid');
            
            // Add error message
            const errorDiv = field.nextElementSibling;
            if (!errorDiv || !errorDiv.classList.contains('invalid-feedback')) {
                const error = document.createElement('div');
                error.className = 'invalid-feedback';
                error.textContent = 'This field is required';
                field.parentNode.insertBefore(error, field.nextSibling);
            }
        } else {
            field.classList.remove('is-invalid');
            const errorDiv = field.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
                errorDiv.remove();
            }
        }
    });
    
    return isValid;
}

// Submit Form Data
async function submitFormData(form, formData) {
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    
    try {
        const action = form.dataset.action || form.action;
        const method = form.method || 'POST';
        
        let response;
        switch(method.toUpperCase()) {
            case 'POST':
                response = await api.post(action, Object.fromEntries(formData));
                break;
            case 'PUT':
                response = await api.put(action, Object.fromEntries(formData));
                break;
            case 'DELETE':
                response = await api.delete(action);
                break;
            default:
                response = await api.get(action);
        }
        
        if (response.success) {
            showToast('Form submitted successfully!', 'success');
            form.reset();
            
            // Close modal if any
            const modal = form.closest('.modal');
            if (modal) {
                bootstrap.Modal.getInstance(modal).hide();
            }
            
            // Reload data
            if (window.loadData) {
                window.loadData();
            }
        } else {
            showToast(response.message || 'Form submission failed', 'danger');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showToast('An error occurred. Please try again.', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// User Interface Updates
function updateUserInterface() {
    if (!appState.user) return;
    
    // Update user name and avatar
    const userNameElements = document.querySelectorAll('.user-name');
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    const userRoleElements = document.querySelectorAll('.user-role');
    
    userNameElements.forEach(el => {
        el.textContent = appState.user.name;
    });
    
    userAvatarElements.forEach(el => {
        if (el.tagName === 'IMG') {
            el.src = appState.user.avatar || 'https://via.placeholder.com/40';
        }
    });
    
    userRoleElements.forEach(el => {
        el.textContent = appState.user.role.toUpperCase();
    });
    
    // Show/hide elements based on role
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    const pharmacistOnlyElements = document.querySelectorAll('.pharmacist-only');
    const staffOnlyElements = document.querySelectorAll('.staff-only');
    
    adminOnlyElements.forEach(el => {
        el.style.display = appState.user.role === 'admin' ? 'block' : 'none';
    });
    
    pharmacistOnlyElements.forEach(el => {
        el.style.display = appState.user.role === 'pharmacist' ? 'block' : 'none';
    });
    
    staffOnlyElements.forEach(el => {
        el.style.display = appState.user.role === 'staff' ? 'block' : 'none';
    });
}

// Load User Data
async function loadUserData() {
    try {
        const response = await api.getProfile();
        if (response.success) {
            appState.user = response.data;
            updateUserInterface();
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
    }
}

// Notification Polling
let notificationInterval = null;

function startNotificationPolling() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    
    notificationInterval = setInterval(async () => {
        if (appState.isAuthenticated) {
            await checkNotifications();
        }
    }, 30000); // Check every 30 seconds
}

async function checkNotifications() {
    try {
        const response = await api.getNotifications();
        if (response.success && response.data.length > 0) {
            const unreadCount = response.data.filter(n => !n.read).length;
            updateNotificationBadge(unreadCount);
            
            if (unreadCount > 0) {
                showNotificationToast(response.data[0]);
            }
        }
    } catch (error) {
        console.error('Notification check failed:', error);
    }
}

function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function showNotificationToast(notification) {
    const toastHTML = `
        <div class="toast align-items-center text-white bg-${notification.type === 'alert' ? 'danger' : 'primary'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${notification.title}</strong><br>
                    <small>${notification.message}</small>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toast = toastContainer.lastElementChild;
    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 5000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// Logout Function
async function logout() {
    try {
        await api.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Reset app state
        appState.isAuthenticated = false;
        appState.user = null;
        
        // Redirect to login
        window.location.href = 'login.html';
    }
}

// Help Modal
function showHelpModal() {
    const modalHTML = `
        <div class="modal fade" id="helpModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-gradient text-white">
                        <h5 class="modal-title"><i class="fas fa-question-circle me-2"></i>Keyboard Shortcuts</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Navigation</h6>
                                <ul class="list-unstyled">
                                    <li class="mb-2"><kbd>Ctrl + D</kbd> - Dashboard</li>
                                    <li class="mb-2"><kbd>Ctrl + M</kbd> - Medicines</li>
                                    <li class="mb-2"><kbd>Ctrl + C</kbd> - Customers</li>
                                    <li class="mb-2"><kbd>Ctrl + S</kbd> - POS Sales</li>
                                    <li class="mb-2"><kbd>Ctrl + P</kbd> - Purchases</li>
                                    <li class="mb-2"><kbd>Ctrl + R</kbd> - Reports</li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6>Actions</h6>
                                <ul class="list-unstyled">
                                    <li class="mb-2"><kbd>F1</kbd> - Help</li>
                                    <li class="mb-2"><kbd>F2</kbd> - Search</li>
                                    <li class="mb-2"><kbd>F5</kbd> - Refresh</li>
                                    <li class="mb-2"><kbd>ESC</kbd> - Close Modal</li>
                                    <li class="mb-2"><kbd>Ctrl + N</kbd> - New Item</li>
                                    <li class="mb-2"><kbd>Ctrl + S</kbd> - Save</li>
                                </ul>
                            </div>
                        </div>
                        <hr>
                        <div class="text-center">
                            <p class="text-muted mb-0">For more help, contact support at support@medicare.com</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('helpModal'));
    modal.show();
    
    document.getElementById('helpModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('helpModal').remove();
    });
}

// Setup Keyboard Shortcuts
function setupKeyboardShortcuts() {
    // Add help button if not exists
    if (!document.querySelector('.help-btn')) {
        const helpBtn = document.createElement('button');
        helpBtn.className = 'btn btn-link help-btn position-fixed';
        helpBtn.style.bottom = '20px';
        helpBtn.style.right = '20px';
        helpBtn.style.zIndex = '999';
        helpBtn.innerHTML = '<i class="fas fa-question-circle fa-2x text-primary"></i>';
        helpBtn.title = 'Help (F1)';
        helpBtn.onclick = showHelpModal;
        document.body.appendChild(helpBtn);
    }
}

// Page Specific Initialization
function initPageSpecific() {
    const currentPath = window.location.pathname;
    const page = currentPath.split('/').pop().replace('.html', '');
    appState.currentPage = page;
    
    switch(page) {
        case 'dashboard':
            if (window.initDashboard) window.initDashboard();
            break;
        case 'medicines':
            if (window.initMedicines) window.initMedicines();
            break;
        case 'customers':
            if (window.initCustomers) window.initCustomers();
            break;
        case 'sales':
            if (window.initSales) window.initSales();
            break;
        case 'purchases':
            if (window.initPurchases) window.initPurchases();
            break;
        case 'suppliers':
            if (window.initSuppliers) window.initSuppliers();
            break;
        case 'prescriptions':
            if (window.initPrescriptions) window.initPrescriptions();
            break;
        case 'reports':
            if (window.initReports) window.initReports();
            break;
    }
}

// Handle Pop State (Browser Back/Forward)
function handlePopState() {
    initPageSpecific();
}

// Offline Support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('ServiceWorker registration successful');
    }).catch(error => {
        console.log('ServiceWorker registration failed:', error);
    });
}

// PWA Installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            });
        });
    }
});

// Export for global use
window.appState = appState;
window.logout = logout;
window.showToast = showToast;
window.api = api;