/**
 * Medicines Management Logic
 * Handles CRUD operations for medicines
 */

let medicinesData = [];
let currentPage = 1;
const itemsPerPage = 12;
let currentEditId = null;

// Initialize Medicines Page
async function initMedicines() {
    await loadMedicines();
    setupEventListeners();
    setupSearchAndFilters();
}

// Load Medicines from API
async function loadMedicines() {
    showLoading();
    try {
        const response = await api.getMedicines();
        if (response.success) {
            medicinesData = response.data;
            displayMedicines();
            updateStats();
        } else {
            // Load demo data if API fails
            loadDemoMedicines();
        }
    } catch (error) {
        console.error('Failed to load medicines:', error);
        loadDemoMedicines();
    }
    hideLoading();
}

// Load Demo Data
function loadDemoMedicines() {
    medicinesData = [
        { id: 1, name: "Paracetamol 500mg", genericName: "Acetaminophen", brand: "Tylenol", category: "Pain Relief", batchNo: "BATCH001", barcode: "8901234567890", purchasePrice: 2.50, sellingPrice: 5.00, stock: 150, minStock: 50, mfgDate: "2024-01-01", expiryDate: "2025-12-31", rackNo: "A-12", description: "Used for pain relief and fever reduction" },
        { id: 2, name: "Amoxicillin 250mg", genericName: "Amoxicillin", brand: "Amoxil", category: "Antibiotics", batchNo: "BATCH002", barcode: "8901234567891", purchasePrice: 5.00, sellingPrice: 10.00, stock: 8, minStock: 30, mfgDate: "2024-02-01", expiryDate: "2025-06-30", rackNo: "B-05", description: "Antibiotic for bacterial infections" },
        { id: 3, name: "Vitamin C 1000mg", genericName: "Ascorbic Acid", brand: "Nature's Way", category: "Vitamins", batchNo: "BATCH003", barcode: "8901234567892", purchasePrice: 8.00, sellingPrice: 15.00, stock: 45, minStock: 20, mfgDate: "2024-03-01", expiryDate: "2025-08-31", rackNo: "C-08", description: "Immune system support" }
    ];
    displayMedicines();
    updateStats();
}

// Display Medicines Grid
function displayMedicines() {
    const searchTerm = document.getElementById('searchMedicine')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const stockFilter = document.getElementById('stockFilter')?.value || '';
    
    let filtered = medicinesData.filter(med => {
        const matchesSearch = med.name.toLowerCase().includes(searchTerm) ||
                             (med.genericName && med.genericName.toLowerCase().includes(searchTerm)) ||
                             (med.brand && med.brand.toLowerCase().includes(searchTerm)) ||
                             (med.batchNo && med.batchNo.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryFilter || med.category === categoryFilter;
        
        let matchesStock = true;
        if (stockFilter === 'low') matchesStock = med.stock <= med.minStock;
        if (stockFilter === 'expiring') {
            const daysToExpiry = Math.ceil((new Date(med.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            matchesStock = daysToExpiry <= 30 && daysToExpiry > 0;
        }
        if (stockFilter === 'expired') matchesStock = new Date(med.expiryDate) < new Date();
        
        return matchesSearch && matchesCategory && matchesStock;
    });
    
    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    // Render grid
    const grid = document.getElementById('medicinesGrid');
    if (grid) {
        grid.innerHTML = paginated.map(med => {
            const daysToExpiry = Math.ceil((new Date(med.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            let stockClass = 'stock-good';
            if (med.stock <= med.minStock) stockClass = 'stock-low';
            if (med.stock === 0) stockClass = 'stock-out';
            
            return `
                <div class="col-md-6 col-lg-4 col-xl-3">
                    <div class="card medicine-card h-100">
                        <div class="position-relative">
                            <span class="stock-badge ${stockClass}">
                                ${med.stock === 0 ? 'Out of Stock' : med.stock <= med.minStock ? 'Low Stock' : `${med.stock} in stock`}
                            </span>
                            <div class="text-center pt-3">
                                <i class="fas fa-capsules fa-4x text-primary"></i>
                            </div>
                        </div>
                        <div class="card-body">
                            <h6 class="card-title fw-bold">${med.name}</h6>
                            <p class="text-muted small mb-2">${med.genericName || ''} | ${med.brand || ''}</p>
                            <div class="mb-2">
                                <span class="badge bg-info">${med.category}</span>
                                <span class="badge ${daysToExpiry < 30 ? 'bg-danger' : 'bg-secondary'}">
                                    Exp: ${med.expiryDate}
                                </span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="fw-bold text-primary">$${med.sellingPrice}</span>
                                    <small class="text-muted d-block">MRP</small>
                                </div>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-primary" onclick="editMedicine(${med.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" onclick="showQR('${med.barcode}')">
                                        <i class="fas fa-qrcode"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMedicine(${med.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Update pagination
    updatePagination(totalPages);
}

// Update Pagination
function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
        ${Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) return '';
            }
            return `<li class="page-item ${currentPage === pageNum ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${pageNum})">${pageNum}</a>
                    </li>`;
        }).join('')}
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;
}

// Change Page
window.changePage = function(page) {
    currentPage = page;
    displayMedicines();
};

// Update Statistics
function updateStats() {
    const totalMedicines = medicinesData.length;
    const lowStockCount = medicinesData.filter(m => m.stock <= m.minStock).length;
    const expiringCount = medicinesData.filter(m => {
        const days = Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days <= 30 && days > 0;
    }).length;
    const totalValue = medicinesData.reduce((sum, m) => sum + (m.stock * m.purchasePrice), 0);
    
    document.getElementById('totalMedicines').textContent = totalMedicines;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    document.getElementById('expiringCount').textContent = expiringCount;
    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
}

// Save Medicine
window.saveMedicine = async function() {
    const medicineData = {
        name: document.getElementById('medName')?.value,
        genericName: document.getElementById('genericName')?.value,
        brand: document.getElementById('brandName')?.value,
        category: document.getElementById('category')?.value,
        batchNo: document.getElementById('batchNo')?.value,
        barcode: document.getElementById('barcode')?.value || generateBarcode(),
        purchasePrice: parseFloat(document.getElementById('purchasePrice')?.value || 0),
        sellingPrice: parseFloat(document.getElementById('sellingPrice')?.value),
        wholesalePrice: parseFloat(document.getElementById('wholesalePrice')?.value || 0),
        stock: parseInt(document.getElementById('stock')?.value || 0),
        minStock: parseInt(document.getElementById('minStock')?.value || 10),
        mfgDate: document.getElementById('mfgDate')?.value,
        expiryDate: document.getElementById('expiryDate')?.value,
        rackNo: document.getElementById('rackNo')?.value,
        description: document.getElementById('description')?.value
    };
    
    if (!medicineData.name || !medicineData.sellingPrice) {
        showToast('Please fill all required fields', 'warning');
        return;
    }
    
    try {
        let response;
        if (currentEditId) {
            response = await api.updateMedicine(currentEditId, medicineData);
            if (response.success) {
                showToast('Medicine updated successfully!', 'success');
            }
        } else {
            response = await api.createMedicine(medicineData);
            if (response.success) {
                showToast('Medicine added successfully!', 'success');
                medicinesData.push(response.data);
            }
        }
        
        if (response.success) {
            resetMedicineForm();
            displayMedicines();
            updateStats();
            closeModal('addMedicineModal');
        }
    } catch (error) {
        console.error('Save medicine error:', error);
        // Fallback to local save
        if (currentEditId) {
            const index = medicinesData.findIndex(m => m.id === currentEditId);
            if (index !== -1) {
                medicineData.id = currentEditId;
                medicinesData[index] = medicineData;
                showToast('Medicine updated locally!', 'success');
            }
        } else {
            medicineData.id = medicinesData.length + 1;
            medicinesData.push(medicineData);
            showToast('Medicine added locally!', 'success');
        }
        resetMedicineForm();
        displayMedicines();
        updateStats();
        closeModal('addMedicineModal');
    }
    
    currentEditId = null;
};

// Edit Medicine
window.editMedicine = function(id) {
    const medicine = medicinesData.find(m => m.id === id);
    if (!medicine) return;
    
    currentEditId = id;
    
    document.getElementById('medName').value = medicine.name;
    document.getElementById('genericName').value = medicine.genericName || '';
    document.getElementById('brandName').value = medicine.brand || '';
    document.getElementById('category').value = medicine.category;
    document.getElementById('batchNo').value = medicine.batchNo || '';
    document.getElementById('barcode').value = medicine.barcode || '';
    document.getElementById('purchasePrice').value = medicine.purchasePrice || '';
    document.getElementById('sellingPrice').value = medicine.sellingPrice;
    document.getElementById('wholesalePrice').value = medicine.wholesalePrice || '';
    document.getElementById('stock').value = medicine.stock;
    document.getElementById('minStock').value = medicine.minStock;
    document.getElementById('mfgDate').value = medicine.mfgDate || '';
    document.getElementById('expiryDate').value = medicine.expiryDate;
    document.getElementById('rackNo').value = medicine.rackNo || '';
    document.getElementById('description').value = medicine.description || '';
    
    // Change modal title
    const modalTitle = document.querySelector('#addMedicineModal .modal-title');
    if (modalTitle) modalTitle.textContent = 'Edit Medicine';
    
    openModal('addMedicineModal');
};

// Delete Medicine
window.deleteMedicine = async function(id) {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    
    try {
        const response = await api.deleteMedicine(id);
        if (response.success) {
            showToast('Medicine deleted successfully!', 'success');
            medicinesData = medicinesData.filter(m => m.id !== id);
            displayMedicines();
            updateStats();
        }
    } catch (error) {
        console.error('Delete medicine error:', error);
        // Fallback to local delete
        medicinesData = medicinesData.filter(m => m.id !== id);
        showToast('Medicine deleted locally!', 'success');
        displayMedicines();
        updateStats();
    }
};

// Generate Barcode
function generateBarcode() {
    const barcode = Math.random().toString(36).substr(2, 12).toUpperCase();
    const barcodeInput = document.getElementById('barcode');
    if (barcodeInput) barcodeInput.value = barcode;
    return barcode;
}

// Show QR Code
window.showQR = function(barcode) {
    const qrContainer = document.getElementById('qrCode');
    if (qrContainer) {
        qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${barcode}" alt="QR Code">`;
        openModal('qrModal');
    }
};

// Reset Form
function resetMedicineForm() {
    const form = document.getElementById('medicineForm');
    if (form) form.reset();
    currentEditId = null;
    
    const modalTitle = document.querySelector('#addMedicineModal .modal-title');
    if (modalTitle) modalTitle.textContent = 'Add New Medicine';
}

// Setup Event Listeners
function setupEventListeners() {
    // Add medicine button
    const addBtn = document.querySelector('[data-bs-target="#addMedicineModal"]');
    if (addBtn) {
        addBtn.addEventListener('click', resetMedicineForm);
    }
    
    // Generate barcode button
    const generateBtn = document.getElementById('generateBarcode');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateBarcode);
    }
}

// Setup Search and Filters
function setupSearchAndFilters() {
    const searchInput = document.getElementById('searchMedicine');
    const categoryFilter = document.getElementById('categoryFilter');
    const stockFilter = document.getElementById('stockFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            displayMedicines();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentPage = 1;
            displayMedicines();
        });
    }
    
    if (stockFilter) {
        stockFilter.addEventListener('change', () => {
            currentPage = 1;
            displayMedicines();
        });
    }
}

// Modal Helpers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    }
}

// Loading Indicators
function showLoading() {
    const grid = document.getElementById('medicinesGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading medicines...</p>
            </div>
        `;
    }
}

function hideLoading() {
    // Loading will be replaced by displayMedicines
}

// Export for initialization
window.initMedicines = initMedicines;