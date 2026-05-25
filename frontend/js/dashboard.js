/**
 * Dashboard Page Logic
 * Handles dashboard charts, stats, and real-time updates
 */

// Initialize Dashboard
async function initDashboard() {
    await loadDashboardStats();
    await loadDashboardCharts();
    await loadRecentActivities();
    startRealTimeUpdates();
}

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        const response = await api.getDashboardStats();
        if (response.success) {
            updateStatsCards(response.data);
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        // Fallback to demo data
        loadDemoStats();
    }
}

// Update Stats Cards with Animation
function updateStatsCards(stats) {
    const cards = [
        { id: 'totalSales', value: stats.totalSales, prefix: '$' },
        { id: 'todaySales', value: stats.todaySales, prefix: '$' },
        { id: 'monthlyProfit', value: stats.monthlyProfit, prefix: '$' },
        { id: 'totalMedicines', value: stats.totalMedicines },
        { id: 'lowStockCount', value: stats.lowStockCount },
        { id: 'expiringCount', value: stats.expiringCount },
        { id: 'totalDue', value: stats.totalDue, prefix: '$' },
        { id: 'totalCustomers', value: stats.totalCustomers }
    ];
    
    cards.forEach(card => {
        const element = document.getElementById(card.id);
        if (element) {
            animateValue(element, 0, card.value, 1000);
            if (card.prefix) {
                element.textContent = card.prefix + element.textContent;
            }
        }
    });
}

// Animate Number Counter
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const updateValue = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        } else {
            element.textContent = end;
        }
    };
    requestAnimationFrame(updateValue);
}

// Load Dashboard Charts
async function loadDashboardCharts() {
    try {
        const response = await api.getSalesAnalytics('month');
        if (response.success) {
            createSalesChart(response.data);
            createCategoryChart(response.data.categories);
        }
    } catch (error) {
        console.error('Failed to load charts:', error);
        // Create demo charts
        createDemoCharts();
    }
}

// Create Sales Chart
let salesChart = null;
function createSalesChart(data) {
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if (!ctx) return;
    
    if (salesChart) salesChart.destroy();
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Sales Revenue',
                data: data.sales || [12500, 14200, 15800, 16400, 17200, 18500, 19200, 20400, 21800, 22500, 23800, 25200],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }, {
                label: 'Profit',
                data: data.profit || [3800, 4250, 4750, 4920, 5160, 5550, 5760, 6120, 6540, 6750, 7140, 7560],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + context.parsed.y.toLocaleString();
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Create Category Distribution Chart
let categoryChart = null;
function createCategoryChart(categories) {
    const ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctx) return;
    
    if (categoryChart) categoryChart.destroy();
    
    const defaultCategories = {
        labels: ['Pain Relief', 'Antibiotics', 'Vitamins', 'First Aid', 'Chronic Care'],
        data: [35, 25, 20, 12, 8]
    };
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories?.labels || defaultCategories.labels,
            datasets: [{
                data: categories?.data || defaultCategories.data,
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${percentage}%`;
                        }
                    }
                }
            }
        }
    });
}

// Create Demo Charts (Fallback)
function createDemoCharts() {
    const demoData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        sales: [12500, 14200, 15800, 16400, 17200, 18500, 19200, 20400, 21800, 22500, 23800, 25200],
        profit: [3800, 4250, 4750, 4920, 5160, 5550, 5760, 6120, 6540, 6750, 7140, 7560]
    };
    createSalesChart(demoData);
    createCategoryChart(null);
}

// Load Recent Activities
async function loadRecentActivities() {
    try {
        const response = await api.getRecentActivities();
        if (response.success) {
            displayActivities(response.data);
        }
    } catch (error) {
        console.error('Failed to load activities:', error);
        displayDemoActivities();
    }
}

function displayActivities(activities) {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item d-flex align-items-start gap-3 p-3 border-bottom">
            <div class="activity-icon ${activity.type}">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="flex-grow-1">
                <p class="mb-1">${activity.description}</p>
                <small class="text-muted">${formatTimeAgo(activity.createdAt)}</small>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        'sale': 'fa-shopping-cart',
        'purchase': 'fa-truck',
        'customer': 'fa-user-plus',
        'medicine': 'fa-capsules',
        'payment': 'fa-dollar-sign',
        'alert': 'fa-bell'
    };
    return icons[type] || 'fa-info-circle';
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
}

function displayDemoActivities() {
    const demoActivities = [
        { type: 'sale', description: 'New sale completed - Invoice #INV-001', createdAt: new Date() },
        { type: 'purchase', description: 'Purchase order received from MediSource Pharma', createdAt: new Date(Date.now() - 3600000) },
        { type: 'alert', description: 'Low stock alert: Paracetamol 500mg', createdAt: new Date(Date.now() - 7200000) },
        { type: 'customer', description: 'New customer registered: John Doe', createdAt: new Date(Date.now() - 86400000) }
    ];
    displayActivities(demoActivities);
}

// Load Top Selling Products
async function loadTopSellingProducts() {
    try {
        const response = await api.getTopSellingProducts(5);
        if (response.success) {
            displayTopProducts(response.data);
        }
    } catch (error) {
        console.error('Failed to load top products:', error);
        displayDemoTopProducts();
    }
}

function displayTopProducts(products) {
    const container = document.getElementById('topProducts');
    if (!container) return;
    
    container.innerHTML = products.map((product, index) => `
        <div class="top-product-item d-flex justify-content-between align-items-center p-2">
            <div class="d-flex align-items-center gap-3">
                <span class="badge bg-primary rounded-circle">${index + 1}</span>
                <div>
                    <div class="fw-semibold">${product.name}</div>
                    <small class="text-muted">${product.category}</small>
                </div>
            </div>
            <div class="text-end">
                <div class="fw-bold">${product.quantity} units</div>
                <small class="text-success">$${product.revenue}</small>
            </div>
        </div>
    `).join('');
}

function displayDemoTopProducts() {
    const demoProducts = [
        { name: 'Paracetamol 500mg', category: 'Pain Relief', quantity: 1250, revenue: 6250 },
        { name: 'Amoxicillin 250mg', category: 'Antibiotics', quantity: 980, revenue: 9800 },
        { name: 'Vitamin C 1000mg', category: 'Vitamins', quantity: 870, revenue: 13050 },
        { name: 'Aspirin 100mg', category: 'Pain Relief', quantity: 650, revenue: 5200 }
    ];
    displayTopProducts(demoProducts);
}

// Load Low Stock Alerts
async function loadLowStockAlerts() {
    try {
        const response = await api.getLowStockMedicines();
        if (response.success && response.data.length > 0) {
            displayLowStockAlerts(response.data);
        } else {
            displayNoAlerts('lowStockAlerts', 'No low stock items');
        }
    } catch (error) {
        console.error('Failed to load low stock alerts:', error);
        displayDemoLowStockAlerts();
    }
}

function displayLowStockAlerts(medicines) {
    const container = document.getElementById('lowStockAlerts');
    if (!container) return;
    
    if (medicines.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-3">No low stock items</div>';
        return;
    }
    
    container.innerHTML = medicines.map(medicine => `
        <div class="alert-card alert-lowstock mb-2">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${medicine.name}</strong>
                    <br>
                    <small class="text-muted">Stock: ${medicine.stock} / Min: ${medicine.minStock}</small>
                </div>
                <button class="btn btn-sm btn-warning" onclick="reorderMedicine(${medicine.id})">
                    <i class="fas fa-shopping-cart me-1"></i>Order Now
                </button>
            </div>
        </div>
    `).join('');
}

// Load Expiry Alerts
async function loadExpiryAlerts() {
    try {
        const response = await api.getExpiringMedicines(30);
        if (response.success && response.data.length > 0) {
            displayExpiryAlerts(response.data);
        } else {
            displayNoAlerts('expiryAlerts', 'No expiring medicines');
        }
    } catch (error) {
        console.error('Failed to load expiry alerts:', error);
        displayDemoExpiryAlerts();
    }
}

function displayExpiryAlerts(medicines) {
    const container = document.getElementById('expiryAlerts');
    if (!container) return;
    
    container.innerHTML = medicines.map(medicine => {
        const daysLeft = Math.ceil((new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return `
            <div class="alert-card alert-expiry mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${medicine.name}</strong>
                        <br>
                        <small class="text-muted">Expires in ${daysLeft} days (${medicine.expiryDate})</small>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="markForDiscount(${medicine.id})">
                        <i class="fas fa-tags me-1"></i>Mark for Sale
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function displayNoAlerts(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="text-center text-muted py-3">${message}</div>`;
    }
}

function displayDemoLowStockAlerts() {
    const demoAlerts = [
        { id: 1, name: 'Paracetamol 500mg', stock: 15, minStock: 50 },
        { id: 2, name: 'Amoxicillin 250mg', stock: 8, minStock: 30 }
    ];
    displayLowStockAlerts(demoAlerts);
}

function displayDemoExpiryAlerts() {
    const demoAlerts = [
        { id: 1, name: 'Aspirin 100mg', expiryDate: '2025-12-15', daysLeft: 10 },
        { id: 2, name: 'Omeprazole 20mg', expiryDate: '2025-12-20', daysLeft: 15 }
    ];
    displayExpiryAlerts(demoAlerts);
}

// Real-time Updates
let realtimeInterval = null;

function startRealTimeUpdates() {
    if (realtimeInterval) clearInterval(realtimeInterval);
    
    realtimeInterval = setInterval(() => {
        refreshDashboardData();
    }, 60000); // Refresh every minute
}

async function refreshDashboardData() {
    await loadDashboardStats();
    await loadLowStockAlerts();
    await loadExpiryAlerts();
    await loadRecentActivities();
}

// Global Functions for Button Actions
window.reorderMedicine = async function(medicineId) {
    showToast('Order placed for medicine', 'success');
    // In real app, this would create a purchase order
};

window.markForDiscount = async function(medicineId) {
    showToast('Medicine marked for discount sale', 'success');
};

// Export for initialization
window.initDashboard = initDashboard;