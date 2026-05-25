/**
 * API Service Layer for Pharmacy Management System
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = 'http://localhost:5000/api';
const API_VERSION = '/v1';

class API {
    constructor() {
        this.baseURL = API_BASE_URL + API_VERSION;
        this.token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
        }
    }

    // Get headers with authentication
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Handle response
    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    // GET request
    async get(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // POST request
    async post(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    // PUT request
    async put(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    // DELETE request
    async delete(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // File upload
    async upload(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });
        return this.handleResponse(response);
    }

    // ==================== AUTHENTICATION APIs ====================
    
    // Login user
    async login(email, password, role) {
        return this.post('/auth/login', { email, password, role });
    }

    // Register user
    async register(userData) {
        return this.post('/auth/register', userData);
    }

    // Forgot password
    async forgotPassword(email) {
        return this.post('/auth/forgot-password', { email });
    }

    // Reset password
    async resetPassword(token, newPassword) {
        return this.post('/auth/reset-password', { token, newPassword });
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        return this.post('/auth/change-password', { currentPassword, newPassword });
    }

    // Verify 2FA
    async verify2FA(code) {
        return this.post('/auth/verify-2fa', { code });
    }

    // Enable 2FA
    async enable2FA() {
        return this.post('/auth/enable-2fa', {});
    }

    // Get user profile
    async getProfile() {
        return this.get('/auth/profile');
    }

    // Update profile
    async updateProfile(profileData) {
        return this.put('/auth/profile', profileData);
    }

    // Logout
    async logout() {
        return this.post('/auth/logout', {});
    }

    // Get login activity
    async getLoginActivity() {
        return this.get('/auth/login-activity');
    }

    // ==================== MEDICINE APIs ====================
    
    // Get all medicines
    async getMedicines(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/medicines${queryString ? `?${queryString}` : ''}`);
    }

    // Get single medicine
    async getMedicine(id) {
        return this.get(`/medicines/${id}`);
    }

    // Create medicine
    async createMedicine(medicineData) {
        return this.post('/medicines', medicineData);
    }

    // Update medicine
    async updateMedicine(id, medicineData) {
        return this.put(`/medicines/${id}`, medicineData);
    }

    // Delete medicine
    async deleteMedicine(id) {
        return this.delete(`/medicines/${id}`);
    }

    // Search medicines
    async searchMedicines(query) {
        return this.get(`/medicines/search?q=${encodeURIComponent(query)}`);
    }

    // Get low stock medicines
    async getLowStockMedicines() {
        return this.get('/medicines/low-stock');
    }

    // Get expiring medicines
    async getExpiringMedicines(days = 30) {
        return this.get(`/medicines/expiring?days=${days}`);
    }

    // Update stock
    async updateStock(id, quantity, type) {
        return this.post(`/medicines/${id}/stock`, { quantity, type });
    }

    // Generate barcode
    async generateBarcode(id) {
        return this.get(`/medicines/${id}/barcode`);
    }

    // Bulk import medicines
    async bulkImportMedicines(file) {
        return this.upload('/medicines/bulk-import', file);
    }

    // ==================== CUSTOMER APIs ====================
    
    // Get all customers
    async getCustomers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/customers${queryString ? `?${queryString}` : ''}`);
    }

    // Get single customer
    async getCustomer(id) {
        return this.get(`/customers/${id}`);
    }

    // Create customer
    async createCustomer(customerData) {
        return this.post('/customers', customerData);
    }

    // Update customer
    async updateCustomer(id, customerData) {
        return this.put(`/customers/${id}`, customerData);
    }

    // Delete customer
    async deleteCustomer(id) {
        return this.delete(`/customers/${id}`);
    }

    // Get customer purchase history
    async getCustomerPurchases(id) {
        return this.get(`/customers/${id}/purchases`);
    }

    // Get customer ledger
    async getCustomerLedger(id) {
        return this.get(`/customers/${id}/ledger`);
    }

    // Make payment
    async makeCustomerPayment(id, paymentData) {
        return this.post(`/customers/${id}/pay`, paymentData);
    }

    // ==================== SUPPLIER APIs ====================
    
    // Get all suppliers
    async getSuppliers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/suppliers${queryString ? `?${queryString}` : ''}`);
    }

    // Get single supplier
    async getSupplier(id) {
        return this.get(`/suppliers/${id}`);
    }

    // Create supplier
    async createSupplier(supplierData) {
        return this.post('/suppliers', supplierData);
    }

    // Update supplier
    async updateSupplier(id, supplierData) {
        return this.put(`/suppliers/${id}`, supplierData);
    }

    // Delete supplier
    async deleteSupplier(id) {
        return this.delete(`/suppliers/${id}`);
    }

    // Get supplier purchases
    async getSupplierPurchases(id) {
        return this.get(`/suppliers/${id}/purchases`);
    }

    // Make supplier payment
    async makeSupplierPayment(id, paymentData) {
        return this.post(`/suppliers/${id}/pay`, paymentData);
    }

    // ==================== SALE APIs ====================
    
    // Create sale (POS)
    async createSale(saleData) {
        return this.post('/sales', saleData);
    }

    // Get all sales
    async getSales(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/sales${queryString ? `?${queryString}` : ''}`);
    }

    // Get single sale
    async getSale(id) {
        return this.get(`/sales/${id}`);
    }

    // Get sale invoice
    async getInvoice(id) {
        return this.get(`/sales/${id}/invoice`);
    }

    // Return sale item
    async returnSaleItem(id, returnData) {
        return this.post(`/sales/${id}/return`, returnData);
    }

    // Get daily sales report
    async getDailySales(date) {
        return this.get(`/sales/reports/daily?date=${date}`);
    }

    // Get monthly sales report
    async getMonthlySales(year, month) {
        return this.get(`/sales/reports/monthly?year=${year}&month=${month}`);
    }

    // ==================== PURCHASE APIs ====================
    
    // Create purchase
    async createPurchase(purchaseData) {
        return this.post('/purchases', purchaseData);
    }

    // Get all purchases
    async getPurchases(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/purchases${queryString ? `?${queryString}` : ''}`);
    }

    // Get single purchase
    async getPurchase(id) {
        return this.get(`/purchases/${id}`);
    }

    // Return purchase
    async returnPurchase(id, returnData) {
        return this.post(`/purchases/${id}/return`, returnData);
    }

    // ==================== PRESCRIPTION APIs ====================
    
    // Create prescription
    async createPrescription(prescriptionData) {
        return this.post('/prescriptions', prescriptionData);
    }

    // Get all prescriptions
    async getPrescriptions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/prescriptions${queryString ? `?${queryString}` : ''}`);
    }

    // Get single prescription
    async getPrescription(id) {
        return this.get(`/prescriptions/${id}`);
    }

    // Update prescription
    async updatePrescription(id, prescriptionData) {
        return this.put(`/prescriptions/${id}`, prescriptionData);
    }

    // Delete prescription
    async deletePrescription(id) {
        return this.delete(`/prescriptions/${id}`);
    }

    // Upload prescription image
    async uploadPrescriptionImage(id, file) {
        return this.upload(`/prescriptions/${id}/image`, file);
    }

    // Scan prescription (OCR)
    async scanPrescription(file) {
        return this.upload('/prescriptions/scan', file);
    }

    // ==================== REPORT APIs ====================
    
    // Get sales report
    async getSalesReport(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/reports/sales${queryString ? `?${queryString}` : ''}`);
    }

    // Get inventory report
    async getInventoryReport() {
        return this.get('/reports/inventory');
    }

    // Get financial report
    async getFinancialReport(year) {
        return this.get(`/reports/financial?year=${year}`);
    }

    // Get profit/loss report
    async getProfitLossReport(startDate, endDate) {
        return this.get(`/reports/profit-loss?start=${startDate}&end=${endDate}`);
    }

    // Export report to Excel
    async exportReport(reportType, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/reports/export/${reportType}${queryString ? `?${queryString}` : ''}`);
    }

    // ==================== DASHBOARD APIs ====================
    
    // Get dashboard stats
    async getDashboardStats() {
        return this.get('/dashboard/stats');
    }

    // Get recent activities
    async getRecentActivities() {
        return this.get('/dashboard/activities');
    }

    // Get sales analytics
    async getSalesAnalytics(period = 'month') {
        return this.get(`/dashboard/analytics?period=${period}`);
    }

    // Get top selling products
    async getTopSellingProducts(limit = 10) {
        return this.get(`/dashboard/top-products?limit=${limit}`);
    }

    // ==================== NOTIFICATION APIs ====================
    
    // Get notifications
    async getNotifications() {
        return this.get('/notifications');
    }

    // Mark notification as read
    async markNotificationRead(id) {
        return this.put(`/notifications/${id}/read`, {});
    }

    // Mark all notifications as read
    async markAllNotificationsRead() {
        return this.put('/notifications/read-all', {});
    }

    // Send SMS
    async sendSMS(phone, message) {
        return this.post('/notifications/sms', { phone, message });
    }

    // Send email
    async sendEmail(email, subject, message) {
        return this.post('/notifications/email', { email, subject, message });
    }

    // ==================== SETTINGS APIs ====================
    
    // Get system settings
    async getSettings() {
        return this.get('/settings');
    }

    // Update system settings
    async updateSettings(settings) {
        return this.put('/settings', settings);
    }

    // Backup database
    async backupDatabase() {
        return this.post('/settings/backup', {});
    }

    // Restore database
    async restoreDatabase(file) {
        return this.upload('/settings/restore', file);
    }

    // Get activity logs
    async getActivityLogs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/settings/activity-logs${queryString ? `?${queryString}` : ''}`);
    }
}

// Create and export API instance
const api = new API();

// Helper function to handle API errors
function handleAPIError(error) {
    console.error('API Error:', error);
    
    let message = 'An unexpected error occurred';
    
    if (error.message.includes('401')) {
        message = 'Session expired. Please login again.';
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        window.location.href = 'login.html';
    } else if (error.message.includes('403')) {
        message = 'You do not have permission to perform this action';
    } else if (error.message.includes('404')) {
        message = 'Resource not found';
    } else if (error.message.includes('500')) {
        message = 'Server error. Please try again later';
    } else {
        message = error.message || message;
    }
    
    showToast(message, 'danger');
    return { error: message };
}

// Global toast function
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.role = 'alert';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.minWidth = '300px';
    document.body.appendChild(container);
    return container;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, handleAPIError, showToast };
}