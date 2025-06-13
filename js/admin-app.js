class AdminApp {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('Starting AdminApp initialization...');
            
            // Initialize Firebase if not already initialized
            if (!window.firebase.apps.length) {
                console.log('Initializing Firebase...');
                await this.initializeFirebase();
            }
            
            // Get Firestore instance
            this.db = window.firebase.firestore();
            console.log('Firestore initialized');
            
            // Load initial data
            await this.loadInitialData();
            
            // Load products table
            await this.loadProductsTable();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('AdminApp initialization complete');
            
        } catch (error) {
            console.error('Error initializing AdminApp:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Add product form submission
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.addProduct();
            });
        }
    }

    async addProduct() {
        try {
            const title = document.getElementById('productTitle').value;
            const category = document.getElementById('productCategory').value;
            const description = document.getElementById('productDescription').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const imageUrl = document.getElementById('productImageUrl').value;
            const inStock = document.getElementById('productInStock').checked;

            // Validate required fields
            if (!title || !category || !description || !price || !imageUrl) {
                this.showAlert('Please fill in all required fields', 'warning');
                return;
            }

            // Add product to Firestore
            await this.db.collection('artworks').add({
                title,
                category,
                description,
                price,
                imageUrl,
                inStock,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            modal.hide();
            document.getElementById('addProductForm').reset();

            // Show success message
            this.showAlert('Product added successfully', 'success');

            // Reload products table
            await this.loadProductsTable();
            await this.loadInitialData(); // Update counts

        } catch (error) {
            console.error('Error adding product:', error);
            this.showAlert('Error adding product: ' + error.message, 'danger');
        }
    }

    async editProduct(id) {
        try {
            const doc = await this.db.collection('artworks').doc(id).get();
            if (!doc.exists) {
                this.showAlert('Product not found', 'danger');
                return;
            }

            const product = doc.data();
            
            // Populate the edit form
            document.getElementById('editProductId').value = id;
            document.getElementById('editProductTitle').value = product.title;
            document.getElementById('editProductCategory').value = product.category;
            document.getElementById('editProductDescription').value = product.description;
            document.getElementById('editProductPrice').value = product.price;
            document.getElementById('editProductImageUrl').value = product.imageUrl;
            document.getElementById('editProductInStock').checked = product.inStock;

            // Show the edit modal
            const editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
            editModal.show();

        } catch (error) {
            console.error('Error loading product for edit:', error);
            this.showAlert('Error loading product: ' + error.message, 'danger');
        }
    }

    async updateProduct() {
        try {
            const id = document.getElementById('editProductId').value;
            const title = document.getElementById('editProductTitle').value;
            const category = document.getElementById('editProductCategory').value;
            const description = document.getElementById('editProductDescription').value;
            const price = parseFloat(document.getElementById('editProductPrice').value);
            const imageUrl = document.getElementById('editProductImageUrl').value;
            const inStock = document.getElementById('editProductInStock').checked;

            // Validate required fields
            if (!title || !category || !description || !price || !imageUrl) {
                this.showAlert('Please fill in all required fields', 'warning');
                return;
            }

            // Update product in Firestore
            await this.db.collection('artworks').doc(id).update({
                title,
                category,
                description,
                price,
                imageUrl,
                inStock,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
            modal.hide();

            // Show success message
            this.showAlert('Product updated successfully', 'success');

            // Reload products table
            await this.loadProductsTable();
            await this.loadInitialData(); // Update counts

        } catch (error) {
            console.error('Error updating product:', error);
            this.showAlert('Error updating product: ' + error.message, 'danger');
        }
    }

    async deleteProduct(id, title) {
        try {
            // Show confirmation modal
            document.getElementById('productToDeleteTitle').textContent = title;
            const deleteModal = new bootstrap.Modal(document.getElementById('deleteProductModal'));
            deleteModal.show();

            // Set up delete confirmation
            const confirmBtn = document.getElementById('confirmDeleteProductBtn');
            confirmBtn.onclick = async () => {
                try {
                    await this.db.collection('artworks').doc(id).delete();
                    deleteModal.hide();
                    this.showAlert('Product deleted successfully', 'success');
                    await this.loadProductsTable();
                    await this.loadInitialData(); // Update counts
                } catch (error) {
                    console.error('Error deleting product:', error);
                    this.showAlert('Error deleting product: ' + error.message, 'danger');
                }
            };

        } catch (error) {
            console.error('Error preparing to delete product:', error);
            this.showAlert('Error preparing to delete product: ' + error.message, 'danger');
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }
    }

    async initializeFirebase() {
        try {
            // Initialize Firebase
            window.firebase.initializeApp({
                apiKey: "AIzaSyDxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
                authDomain: "seadon-white-portfolio.firebaseapp.com",
                projectId: "seadon-white-portfolio",
                storageBucket: "seadon-white-portfolio.appspot.com",
                messagingSenderId: "123456789012",
                appId: "1:123456789012:web:1234567890123456789012"
            });
            
            console.log('Firebase initialized successfully');
            
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            throw error;
        }
    }

    async loadInitialData() {
        try {
            console.log('Loading initial data...');
            
            // Load products count (using artworks collection)
            const productsSnapshot = await this.db.collection('artworks').get();
            document.getElementById('totalProducts').textContent = productsSnapshot.size;
            
            // Load orders count
            const ordersSnapshot = await this.db.collection('orders').get();
            document.getElementById('totalOrders').textContent = ordersSnapshot.size;
            
            // Load gallery items count
            const gallerySnapshot = await this.db.collection('Gallery').get();
            document.getElementById('totalGalleryItems').textContent = gallerySnapshot.size;
            
            // Calculate total revenue
            let totalRevenue = 0;
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                if (order.total) {
                    totalRevenue += order.total;
                }
            });
            document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
            
            console.log('Initial data loaded successfully');
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            throw error;
        }
    }

    async loadProductsTable() {
        try {
            console.log('Loading products table...');
            const productsTable = document.getElementById('productsTable');
            if (!productsTable) {
                console.error('Products table element not found');
                return;
            }

            const tbody = productsTable.querySelector('tbody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </td>
                </tr>
            `;

            const snapshot = await this.db.collection('artworks').get();
            
            if (snapshot.empty) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4">
                            <p class="text-muted mb-0">No products found. Add your first product!</p>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = '';
            snapshot.forEach(doc => {
                const product = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="width: 100px;">
                        <img src="${product.imageUrl || ''}" 
                             alt="${product.title}" 
                             class="img-thumbnail"
                             style="width: 80px; height: 80px; object-fit: cover;">
                    </td>
                    <td>
                        <div class="fw-bold">${product.title}</div>
                        <small class="text-muted">${product.category || 'Uncategorized'}</small>
                    </td>
                    <td>$${product.price ? product.price.toFixed(2) : '0.00'}</td>
                    <td>
                        <span class="badge ${product.inStock ? 'bg-success' : 'bg-danger'}">
                            ${product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="window.adminApp.editProduct('${doc.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="window.adminApp.deleteProduct('${doc.id}', '${product.title}')">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });

            console.log('Products table loaded successfully');
            
        } catch (error) {
            console.error('Error loading products table:', error);
            const tbody = productsTable.querySelector('tbody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="alert alert-danger mb-0">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Error loading products: ${error.message}
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

// Export the AdminApp class
window.AdminApp = AdminApp; 