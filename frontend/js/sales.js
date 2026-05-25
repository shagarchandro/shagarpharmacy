/**
 * POS Billing System Logic
 * Handles cart management, billing, and invoice generation
 */

let productsData = [];
let cart = [];
let selectedPaymentMethod = 'cash';
let scanMode = false;
let barcodeBuffer = '';
let lastKeyTime = 0;
let currentInvoice = null;

// Initialize POS System
async function initSales() {
    await loadProducts();
    await loadCustomers();
    setupEventListeners();
    setupKeyboardShortcuts();
    updateCartDisplay();
}

// Load Products
async function loadProducts() {
    try {
        const response = await api.getMedicines({ limit: 100 });
        if (response.success) {
            productsData = response.data;
        } else {
            loadDemoProducts();
        }
    } catch (error) {
        console.error('Failed to load products:', error);
        loadDemoProducts();
    }
    displayProducts();
}

// Load Demo Products
function loadDemoProducts() {
    productsData = [
        { id: 1, name: "Paracetamol 500mg", generic: "Acetaminophen", price: 5.00, stock: 150, barcode: "8901234567890" },
        { id: 2, name: "Amoxicillin 250mg", generic: "Amoxicillin", price: 10.00, stock: 8, barcode: "8901234567891" },
        { id: 3, name: "Vitamin C 1000mg", generic: "Ascorbic Acid", price: 15.00, stock: 45, barcode: "8901234567892" },
        { id: 4, name: "Aspirin 100mg", generic: "Acetylsalicylic Acid", price: 8.00, stock: 120, barcode: "8901234567893" },
        { id: 5, name: "Omeprazole 20mg", generic: "Omeprazole", price: 12.00, stock: 60, barcode: "8901234567894" },
        { id: 6, name: "Loratadine 10mg", generic: "Loratadine", price: 7.00, stock: 35, barcode: "8901234567895" }
    ];
}

// Load Customers for Dropdown
async function loadCustomers() {
    try {
        const response = await api.getCustomers({ limit: 50 });
        if (response.success) {
            populateCustomerDropdown(response.data);
        }
    } catch (error) {
        console.error('Failed to load customers:', error);
        populateDemoCustomers();
    }
}

function populateCustomerDropdown(customers) {
    const select = document.getElementById('customerSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="0">Walk-in Customer</option>';
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.phone})`;
        select.appendChild(option);
    });
}

function populateDemoCustomers() {
    const customers = [
        { id: 1, name: "John Doe", phone: "+1234567890" },
        { id: 2, name: "Jane Smith", phone: "+1234567891" }
    ];
    populateCustomerDropdown(customers);
}

// Display Products Grid
function displayProducts(searchTerm = '') {
    const filtered = productsData.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.generic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    );
    
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = filtered.map(p => `
        <div class="product-card" onclick="addToCart(${p.id})">
            <div class="text-center">
                <i class="fas fa-capsules fa-3x text-primary mb-2"></i>
            </div>
            <div class="fw-bold small text-center">${p.name}</div>
            <div class="text-primary fw-bold text-center mt-1">$${p.price}</div>
            <div class="text-muted small text-center">Stock: ${p.stock}</div>
        </div>
    `).join('');
}

// Add to Cart
window.addToCart = function(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock <= 0) {
        showToast('Product out of stock!', 'danger');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.quantity + 1 <= product.stock) {
            existingItem.quantity++;
            existingItem.total = existingItem.quantity * existingItem.price;
            showToast(`${product.name} quantity updated`, 'success');
        } else {
            showToast('Not enough stock!', 'warning');
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            total: product.price
        });
        showToast(`${product.name} added to cart`, 'success');
    }
    
    updateCartDisplay();
};

// Update Cart Display
function updateCartDisplay() {
    const cartContainer = document.getElementById('cartItems');
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="text-center text-muted py-5">Cart is empty</div>';
    } else {
        cartContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="fw-bold">${item.name}</div>
                        <div class="small text-muted">$${item.price} each</div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span class="fw-bold mx-2" style="min-width: 30px; text-align: center;">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        <button class="btn btn-sm btn-danger ms-2" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="text-end mt-1">
                    <span class="fw-bold">$${item.total.toFixed(2)}</span>
                </div>
            </div>
        `).join('');
    }
    
    calculateTotals();
}

// Update Quantity
window.updateQuantity = function(productId, newQuantity) {
    const product = productsData.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);
    
    if (!cartItem) return;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else if (newQuantity <= product.stock) {
        cartItem.quantity = newQuantity;
        cartItem.total = cartItem.quantity * cartItem.price;
        updateCartDisplay();
    } else {
        showToast('Not enough stock!', 'warning');
    }
};

// Remove from Cart
window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    showToast('Item removed from cart', 'info');
};

// Calculate Totals
function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountPercent')?.value || 0);
    const discount = subtotal * (discountPercent / 100);
    const tax = (subtotal - discount) * 0.10; // 10% VAT
    const total = subtotal - discount + tax;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('discount').textContent = `-$${discount.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    
    return { subtotal, discount, tax, total };
}

// Apply Discount
window.applyDiscount = function() {
    calculateTotals();
};

// Process Payment
window.processPayment = async function() {
    if (cart.length === 0) {
        showToast('Cart is empty!', 'warning');
        return;
    }
    
    const { total } = calculateTotals();
    const customerId = document.getElementById('customerSelect')?.value || '0';
    const paymentMethod = selectedPaymentMethod;
    
    let cashAmount = 0;
    let change = 0;
    
    if (paymentMethod === 'cash') {
        cashAmount = parseFloat(document.getElementById('cashAmount')?.value);
        if (isNaN(cashAmount) || cashAmount < total) {
            showToast('Insufficient cash amount!', 'danger');
            return;
        }
        change = cashAmount - total;
        document.getElementById('changeAmount').innerHTML = `<small class="text-success">Change: $${change.toFixed(2)}</small>`;
    }
    
    // Create sale record
    const saleData = {
        customerId: customerId === '0' ? null : customerId,
        items: cart.map(item => ({
            medicineId: item.id,
            quantity: item.quantity,
            price: item.price,
            total: item.total
        })),
        subtotal: total / 1.1,
        discount: total * 0.0476,
        tax: total * 0.0952,
        total: total,
        paymentMethod: paymentMethod,
        paidAmount: paymentMethod === 'cash' ? cashAmount : total,
        change: change
    };
    
    try {
        const response = await api.createSale(saleData);
        if (response.success) {
            currentInvoice = response.data;
            showInvoice(currentInvoice);
            
            // Update stock locally
            cart.forEach(item => {
                const product = productsData.find(p => p.id === item.id);
                if (product) product.stock -= item.quantity;
            });
            
            clearCart();
            displayProducts();
            showToast('Payment processed successfully!', 'success');
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        // Fallback: generate local invoice
        generateLocalInvoice(saleData);
    }
};

// Generate Local Invoice (Fallback)
function generateLocalInvoice(saleData) {
    currentInvoice = {
        invoiceNo: 'INV-' + Date.now(),
        date: new Date().toLocaleString(),
        customer: saleData.customerId === '0' ? 'Walk-in Customer' : 'Customer',
        items: cart,
        subtotal: saleData.subtotal,
        discount: saleData.discount,
        tax: saleData.tax,
        total: saleData.total,
        paymentMethod: saleData.paymentMethod,
        cashAmount: saleData.paidAmount,
        change: saleData.change
    };
    
    showInvoice(currentInvoice);
    clearCart();
    displayProducts();
    showToast('Invoice generated (offline mode)', 'success');
}

// Show Invoice
function showInvoice(invoice) {
    const invoiceHtml = `
        <div class="text-center mb-4">
            <h3 class="fw-bold">MediCare Pharmacy</h3>
            <p class="mb-0">123 Healthcare Street, Medical District</p>
            <p>Phone: +1234567890 | Email: info@medicare.com</p>
            <hr>
            <h5>INVOICE</h5>
            <p><strong>Invoice No:</strong> ${invoice.invoiceNo}<br>
            <strong>Date:</strong> ${invoice.date}<br>
            <strong>Customer:</strong> ${invoice.customer}</p>
            <hr>
        </div>
        
        <table class="table table-bordered">
            <thead class="table-light">
                <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.total.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" class="text-end fw-bold">Subtotal:</td>
                    <td>$${invoice.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="3" class="text-end fw-bold">Discount:</td>
                    <td>$${invoice.discount.toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="3" class="text-end fw-bold">Tax (VAT 10%):</td>
                    <td>$${invoice.tax.toFixed(2)}</td>
                </tr>
                <tr class="table-primary">
                    <td colspan="3" class="text-end fw-bold fs-5">Total:</td>
                    <td class="fw-bold fs-5">$${invoice.total.toFixed(2)}</td>
                </tr>
                ${invoice.paymentMethod === 'cash' ? `
                    <tr>
                        <td colspan="3" class="text-end">Cash:</td>
                        <td>$${invoice.cashAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="text-end">Change:</td>
                        <td>$${invoice.change.toFixed(2)}</td>
                    </tr>
                ` : ''}
            </tfoot>
        </table>
        
        <div class="text-center mt-4">
            <p>Payment Method: ${invoice.paymentMethod.toUpperCase()}</p>
            <p class="fw-bold">Thank you for shopping with us!</p>
            <small class="text-muted">** This is a computer generated invoice **</small>
        </div>
    `;
    
    const invoiceContent = document.getElementById('invoiceContent');
    if (invoiceContent) {
        invoiceContent.innerHTML = invoiceHtml;
        openModal('invoiceModal');
    }
}

// Print Invoice
window.printInvoice = function() {
    const invoiceContent = document.getElementById('invoiceContent');
    if (!invoiceContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Invoice</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { padding: 20px; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    ${invoiceContent.innerHTML}
                </div>
                <script>
                    window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
};

// Download PDF Invoice
window.downloadInvoicePDF = function() {
    const element = document.getElementById('invoiceContent');
    if (!element) return;
    
    html2pdf()
        .set({
            margin: 10,
            filename: `invoice_${Date.now()}.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(element)
        .save();
};

// Clear Cart
window.clearCart = function() {
    if (cart.length > 0 && confirm('Clear all items from cart?')) {
        cart = [];
        updateCartDisplay();
        showToast('Cart cleared', 'info');
    }
};

// Toggle Scan Mode
window.toggleScanMode = function() {
    scanMode = !scanMode;
    const indicator = document.getElementById('scanModeIndicator');
    const searchInput = document.getElementById('searchProduct');
    
    if (scanMode) {
        if (indicator) indicator.style.display = 'block';
        if (searchInput) {
            searchInput.placeholder = 'Scanner Mode - Scan barcode...';
            searchInput.classList.add('scan-mode');
        }
        showToast('Scanner mode activated. Scan a barcode to add product.', 'success');
    } else {
        if (indicator) indicator.style.display = 'none';
        if (searchInput) {
            searchInput.placeholder = 'Search by name or scan barcode...';
            searchInput.classList.remove('scan-mode');
        }
    }
};

// Setup Event Listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchProduct');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (!scanMode) {
                displayProducts(e.target.value);
            }
        });
        
        // Barcode scanner handler
        searchInput.addEventListener('keypress', (e) => {
            if (scanMode) {
                const currentTime = new Date().getTime();
                if (currentTime - lastKeyTime > 100) {
                    barcodeBuffer = '';
                }
                lastKeyTime = currentTime;
                
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const barcode = barcodeBuffer;
                    barcodeBuffer = '';
                    
                    const product = productsData.find(p => p.barcode === barcode);
                    if (product) {
                        addToCart(product.id);
                        showToast(`${product.name} added to cart!`, 'success');
                    } else {
                        showToast('Product not found!', 'danger');
                    }
                    searchInput.value = '';
                } else {
                    barcodeBuffer += e.key;
                }
            }
        });
    }
    
    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', () => {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
            method.classList.add('active');
            selectedPaymentMethod = method.dataset.method;
            
            const cashDiv = document.getElementById('cashAmountDiv');
            if (cashDiv) {
                cashDiv.style.display = selectedPaymentMethod === 'cash' ? 'block' : 'none';
            }
        });
    });
    
    // Discount input
    const discountInput = document.getElementById('discountPercent');
    if (discountInput) {
        discountInput.addEventListener('input', calculateTotals);
    }
    
    // Cash amount input
    const cashAmount = document.getElementById('cashAmount');
    if (cashAmount) {
        cashAmount.addEventListener('input', () => {
            const total = parseFloat(document.getElementById('total')?.textContent.replace('$', '') || 0);
            const cash = parseFloat(cashAmount.value) || 0;
            const change = cash - total;
            const changeSpan = document.getElementById('changeAmount');
            if (changeSpan) {
                changeSpan.innerHTML = change >= 0 ? `<small class="text-success">Change: $${change.toFixed(2)}</small>` : '<small class="text-danger">Insufficient amount</small>';
            }
        });
    }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // F2 for scan mode
        if (e.key === 'F2') {
            e.preventDefault();
            toggleScanMode();
        }
        
        // Ctrl + C to clear cart
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            clearCart();
        }
        
        // Ctrl + P to print
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            if (currentInvoice) printInvoice();
        }
        
        // Enter on product search
        if (e.key === 'Enter' && document.activeElement === document.getElementById('searchProduct')) {
            e.preventDefault();
            const searchTerm = document.getElementById('searchProduct').value;
            displayProducts(searchTerm);
        }
    });
}

// Modal Helpers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

// Show Toast
function showToast(message, type) {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
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

// Export for initialization
window.initSales = initSales;