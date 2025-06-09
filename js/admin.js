// Admin panel JavaScript
// auth-service.js is loaded as a traditional script before this file

// Global variables to store references to functions
let _updateArtworkCount = null;

// Make authService globally available for debugging
if (!window.authService) {
    window.authService = authService;
}

// Function to load artwork from Firestore
async function loadArtwork() {
    console.log('Loading artwork from Firestore...');
    const artworkList = document.getElementById('artworkList');
    
    if (!artworkList) {
        console.error('Artwork list element not found');
        throw new Error('Artwork list element not found');
    }
    
    // Show loading state
    artworkList.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading artwork...</p>
        </div>
    `;
    
    try {
        // Get artwork from Firestore
        const querySnapshot = await firebase.firestore().collection('artworks')
            .orderBy('createdAt', 'desc')
            .get();
        
        console.log(`Found ${querySnapshot.size} artworks`);
        
        if (querySnapshot.empty) {
            console.log('No artwork found');
            artworkList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-images fs-1 text-muted mb-3"></i>
                    <h5>No Artwork Found</h5>
                    <p class="text-muted">Add your first piece of artwork to get started!</p>
                    <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#addArtworkModal">
                        <i class="fas fa-plus-circle me-2"></i>Add Artwork
                    </button>
                </div>
            `;
            return 0;
        }
        
        // Clear loading state
        artworkList.innerHTML = '';
        
        // Process each artwork
        querySnapshot.forEach((doc) => {
            const artwork = { 
                id: doc.id, 
                ...doc.data(),
                title: doc.data().title || 'Untitled',
                category: doc.data().category || 'Uncategorized',
                price: parseFloat(doc.data().price) || 0,
                inStock: doc.data().inStock !== undefined ? doc.data().inStock : true,
                imageUrl: doc.data().imageUrl || '',
                createdAt: doc.data().createdAt || new Date()
            };
            
            const artworkCard = document.createElement('div');
            artworkCard.className = 'col-12 col-md-6 col-lg-4 col-xl-3 mb-4';
            
            // Format the price
            const formattedPrice = artwork.price.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            // Format the date
            const formattedDate = artwork.createdAt.toDate 
                ? artwork.createdAt.toDate().toLocaleDateString() 
                : new Date(artwork.createdAt).toLocaleDateString();
            
            // Create the card HTML with improved image handling
            artworkCard.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="position-relative" style="padding-top: 100%; overflow: hidden;">
                        <img src="${artwork.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}" 
                             class="card-img-top position-absolute top-0 start-0 w-100 h-100 object-fit-cover" 
                             alt="${artwork.title.replace(/"/g, '&quot;')}"
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Image+Not+Found'"
                             loading="lazy">
                        <div class="position-absolute top-0 end-0 m-2">
                            <span class="badge ${artwork.inStock ? 'bg-success' : 'bg-secondary'}">
                                ${artwork.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title text-truncate" title="${artwork.title.replace(/"/g, '&quot;')}">
                            ${artwork.title}
                        </h5>
                        <p class="card-text text-muted mb-1">
                            <i class="fas fa-tag me-1"></i>${artwork.category}
                        </p>
                        <p class="card-text fw-bold text-primary mb-2">${formattedPrice}</p>
                        <p class="card-text small text-muted mt-auto mb-0">
                            <i class="fas fa-calendar me-1"></i>Added: ${formattedDate}
                        </p>
                    </div>
                    <div class="card-footer bg-transparent border-top-0 pt-0">
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-sm btn-outline-primary edit-artwork" 
                                    data-id="${artwork.id}"
                                    title="Edit artwork">
                                <i class="fas fa-pencil-alt me-1"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-artwork" 
                                    data-id="${artwork.id}" 
                                    data-title="${artwork.title.replace(/"/g, '&quot;')}"
                                    title="Delete artwork">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            artworkList.appendChild(artworkCard);
        });
        
        // Set up event listeners for edit and delete buttons
        setupArtworkEventListeners();
        
        console.log(`Successfully loaded ${querySnapshot.size} artworks`);
        return querySnapshot.size;
        
    } catch (error) {
        console.error('Error loading artwork:', error);
        artworkList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-exclamation-triangle me-3 fs-4"></i>
                        <div>
                            <h5 class="alert-heading">Error Loading Artwork</h5>
                            <p class="mb-0">${error.message || 'An error occurred while loading artwork. Please try again.'}</p>
                        </div>
                    </div>
                    <div class="d-flex justify-content-end mt-3">
                        <button class="btn btn-sm btn-outline-secondary" onclick="window.location.reload()">
                            <i class="fas fa-sync-alt me-1"></i> Try Again
                        </button>
                    </div>
                </div>
            </div>
        `;
        throw error;
    }
}

// Function to update artwork count
async function updateArtworkCount() {
    try {
        const snapshot = await firebase.firestore().collection('artworks').get();
        const count = snapshot.size;
        const countElement = document.getElementById('artworkCount');
        if (countElement) {
            countElement.textContent = count;
        }
    } catch (error) {
        console.error('Error updating artwork count:', error);
    }
}

// Function to set up artwork event listeners
function setupArtworkEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-artwork').forEach(button => {
        button.addEventListener('click', (e) => {
            const artworkId = e.currentTarget.dataset.id;
            editArtwork(artworkId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-artwork').forEach(button => {
        button.addEventListener('click', (e) => {
            const artworkId = e.currentTarget.dataset.id;
            const artworkTitle = e.currentTarget.dataset.title;
            deleteArtwork(artworkId, artworkTitle);
        });
    });
}

// Admin-specific functions
class AdminApp {
    constructor() {
        this.initialized = false;
        this.unsubscribe = null;
    }

    async initialize() {
        if (this.initialized) return;
        
        console.log('Initializing admin...');
        
        try {
            // Wait for auth service to be ready
            if (!window.authService) {
                console.log('Waiting for auth service...');
                await window.authServiceReady;
            }
            
            // Wait for auth service to be fully initialized
            await window.authService.authReady;
            
            // Initial auth check
            const user = await window.authService.getCurrentUser();
            console.log('Current user:', user ? {
                uid: user.uid,
                email: user.email,
                isAdmin: user.isAdmin
            } : 'No user');
            
            if (!user) {
                console.log('No user, redirecting to login...');
                window.location.replace('../login.html');
                return;
            }
            
            // Check if user is admin using the auth service
            const isAdmin = await window.authService.isAdmin();
            console.log('User is admin:', isAdmin);
            
            if (!isAdmin) {
                console.log('User is not an admin, redirecting to shop...');
                window.location.replace('../shop.html');
                return;
            }
            
            // User is admin, initialize the UI
            await this.initializeUI();
            this.initialized = true;
            
            // Set up auth state listener
            this.unsubscribe = window.authService.onAuthStateChanged(async (user) => {
                console.log('Auth state changed:', user ? {
                    uid: user.uid,
                    email: user.email
                } : 'No user');
                
                if (!user) {
                    console.log('User signed out, redirecting to login...');
                    window.location.replace('../login.html');
                    return;
                }
                
                // Check admin status again
                const isAdmin = await window.authService.isAdmin();
                if (!isAdmin) {
                    console.log('User is no longer admin, redirecting to shop...');
                    window.location.replace('../shop.html');
                    return;
                }
            });
            
        } catch (error) {
            console.error('Error initializing admin:', error);
            this.showError('Failed to initialize admin panel. Please try again.');
        }
    }
    
    async initializeUI() {
        console.log('Initializing admin UI...');
        
        // Load artwork
        try {
            const artworkCount = await loadArtwork();
            console.log(`Loaded ${artworkCount} artworks`);
            
            // Update artwork count
            await updateArtworkCount();
            
            // Set up event listeners
            setupEventListeners();
            
            // Set up delete confirmation
            setupDeleteConfirmation();
            
            console.log('Admin UI initialized successfully');
        } catch (error) {
            console.error('Error initializing admin UI:', error);
            throw error;
        }
    }
    
    showError(message) {
        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-exclamation-triangle me-3 fs-4"></i>
                        <div>
                            <h5 class="alert-heading">Error</h5>
                            <p class="mb-0">${message}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.initialized = false;
    }
}

// Make AdminApp available globally
window.AdminApp = AdminApp;

// Set up event listeners for admin panel
function setupEventListeners() {
    // Sign out button
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Error signing out: ', error);
            });
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadArtwork();
            loadOrders();
        });
    }
    
    // Add Artwork button
    const addArtworkBtn = document.getElementById('addArtworkBtn');
    if (addArtworkBtn) {
        addArtworkBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('addArtworkModal'));
            modal.show();
        });
    }
    
    // Add Artwork form submission
    const addArtworkForm = document.getElementById('addArtworkForm');
    if (addArtworkForm) {
        addArtworkForm.addEventListener('submit', handleAddArtwork);
    }
    
    // Edit Artwork form submission
    const editArtworkForm = document.getElementById('editArtworkForm');
    if (editArtworkForm) {
        editArtworkForm.addEventListener('submit', handleEditArtwork);
    }
}

// Example function to load orders
function loadOrders() {
    const ordersTable = document.getElementById('ordersTableBody');
    if (!ordersTable) return;
    
    // Clear existing content
    ordersTable.innerHTML = '<tr><td colspan="6">Loading orders...</td></tr>';
    
    // Get orders from Firestore
    firebase.firestore().collection('orders')
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                ordersTable.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
                return;
            }
            
            // Clear loading message
            ordersTable.innerHTML = '';
            
            // Add each order to the table
            querySnapshot.forEach((doc) => {
                const order = doc.data();
                const row = document.createElement('tr');
                
                // Format the date
                const date = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
                
                // Create table cells
                row.innerHTML = `
                    <td>${doc.id}</td>
                    <td>${order.customerName || 'N/A'}</td>
                    <td>${date}</td>
                    <td>$${order.total ? order.total.toFixed(2) : '0.00'}</td>
                    <td>${order.status || 'Processing'}</td>
                    <td>
                        <button class="btn btn-sm btn-view" onclick="viewOrder('${doc.id}')">View</button>
                    </td>
                `;
                
                ordersTable.appendChild(row);
            });
        })
        .catch((error) => {
            console.error('Error loading orders:', error);
            ordersTable.innerHTML = '<tr><td colspan="6">Error loading orders. Please try again.</td></tr>';
        });
}

// Example function to view order details
function viewOrder(orderId) {
    // Implement order details view
    console.log('Viewing order:', orderId);
    alert('View order: ' + orderId);
}

// Handle add artwork form submission
async function handleAddArtwork(e) {
    e.preventDefault();
    
    const form = e.target;
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    try {
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        
        // Get form data
        const artworkData = {
            title: form.title.value.trim(),
            description: form.description.value.trim(),
            price: parseFloat(form.price.value),
            category: form.category.value,
            inStock: form.inStock.checked,
            imageUrl: form.image.value.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add to Firestore
        const docRef = await firebase.firestore().collection('artworks').add(artworkData);
        
        // Update the ID field
        await docRef.update({ id: docRef.id });
        
        // Reset form and validation state
        form.reset();
        form.classList.remove('was-validated');
        
        // Show success message
        showNotification('Artwork added successfully!', 'success');
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addArtworkModal'));
        modal.hide();
        
        // Refresh the artwork list
        await loadArtwork();
        
    } catch (error) {
        console.error('Error adding artwork: ', error);
        showNotification('Failed to add artwork. Please try again.', 'error');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Edit artwork
async function editArtwork(artworkId) {
    console.log('editArtwork called with ID:', artworkId);
    try {
        // Get artwork data
        const doc = await firebase.firestore().collection('artworks').doc(artworkId).get();
        if (!doc.exists) {
            showNotification('Artwork not found', 'error');
            return;
        }
        
        const artwork = doc.data();
        
        // Get the edit form elements
        const form = document.getElementById('editArtworkForm');
        if (!form) {
            showNotification('Edit form not found', 'error');
            return;
        }
        
        // Set form values
        form.querySelector('#editArtworkId').value = artworkId;
        form.querySelector('#editTitle').value = artwork.title || '';
        form.querySelector('#editDescription').value = artwork.description || '';
        form.querySelector('#editPrice').value = artwork.price || '';
        form.querySelector('#editCategory').value = artwork.category || 'paintings';
        form.querySelector('#editImageUrl').value = artwork.imageUrl || '';
        form.querySelector('#editInStock').checked = artwork.inStock !== false;
        
        // Show the modal
        const modalElement = document.getElementById('editArtworkModal');
        const modal = new bootstrap.Modal(modalElement);
        
        // Set up modal cleanup when hidden
        modalElement.addEventListener('hidden.bs.modal', function cleanupModal() {
            // Reset form
            form.reset();
            form.classList.remove('was-validated');
            
            // Remove the event listener to prevent duplicates
            modalElement.removeEventListener('hidden.bs.modal', cleanupModal);
            
            // Clean up modal backdrop and body classes
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            // Remove any remaining modal backdrop
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
        }, { once: true }); // Use once: true to ensure the listener is removed after first execution
        
        modal.show();
        
    } catch (error) {
        console.error('Error preparing to edit artwork: ', error);
        showNotification('Error loading artwork details', 'error');
    }
}

// Handle edit artwork form submission
async function handleEditArtwork(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = document.getElementById('updateArtworkBtn');
    const originalButtonText = submitButton.innerHTML;
    const artworkId = form.querySelector('#editArtworkId').value;
    
    try {
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        // Get form data
        const artworkData = {
            title: form.querySelector('#editTitle').value.trim(),
            description: form.querySelector('#editDescription').value.trim(),
            price: parseFloat(form.querySelector('#editPrice').value),
            category: form.querySelector('#editCategory').value,
            inStock: form.querySelector('#editInStock').checked,
            imageUrl: form.querySelector('#editImageUrl').value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update in Firestore
        await firebase.firestore().collection('artworks').doc(artworkId).update(artworkData);
        
        // Show success message
        showNotification('Artwork updated successfully!', 'success');
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editArtworkModal'));
        if (modal) {
            modal.hide();
        }
        
        // Refresh the artwork list
        await loadArtwork();
        
    } catch (error) {
        console.error('Error updating artwork: ', error);
        showNotification('Failed to update artwork. Please try again.', 'error');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Global variable to store the artwork to be deleted
let artworkToDelete = null;

// Show delete confirmation modal
function showDeleteConfirmation(artworkId, artworkTitle) {
    artworkToDelete = artworkId;
    document.getElementById('artworkToDeleteTitle').textContent = artworkTitle || 'Untitled Artwork';
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    deleteModal.show();
}

// Handle delete confirmation
function setupDeleteConfirmation() {
    const deleteModal = document.getElementById('deleteConfirmationModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Reset state when modal is hidden
    deleteModal.addEventListener('hidden.bs.modal', () => {
        // Reset state
        artworkToDelete = null;
        if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = '<i class="fas fa-trash-alt me-1"></i> Delete Permanently';
        }
        
        // Clean up modal backdrop and body classes
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Remove any remaining modal backdrop
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
    });
    
    // Handle confirm button
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!artworkToDelete) return;
        
        try {
            // Disable button and show loading state
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Deleting...';
            
            // Delete from Firestore
            await firebase.firestore().collection('artworks').doc(artworkToDelete).delete();
            
            // Hide modal and reset state
            const modal = bootstrap.Modal.getInstance(deleteModal);
            if (modal) {
                modal.hide();
            }
            
            // Show success message
            showNotification('Artwork deleted successfully', 'success');
            
            // Refresh the artwork list
            await loadArtwork();
            
        } catch (error) {
            console.error('Error deleting artwork: ', error);
            showNotification('Failed to delete artwork. Please try again.', 'error');
        } finally {
            // Reset button state
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = '<i class="fas fa-trash-alt me-1"></i> Delete Permanently';
            artworkToDelete = null;
        }
    });
}

// Delete artwork (kept for backward compatibility)
async function deleteArtwork(artworkId, artworkTitle) {
    showDeleteConfirmation(artworkId, artworkTitle);
}

// Show notification message
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }, 100);
}

// Initialize any UI components when the page loads
function initAdminUI() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Set up form submission handlers
    const addForm = document.getElementById('addArtworkForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddArtwork);
    }
    
    // Set up edit artwork button click handler
    const updateArtworkBtn = document.getElementById('updateArtworkBtn');
    if (updateArtworkBtn) {
        updateArtworkBtn.addEventListener('click', () => {
            const form = document.getElementById('editArtworkForm');
            if (form) {
                handleEditArtwork({ preventDefault: () => {}, target: form });
            }
        });
    }
    
    // Set up image URL validation
    const imageInputs = document.querySelectorAll('input[type="url"][pattern]');
    imageInputs.forEach(input => {
        input.addEventListener('input', function() {
            const pattern = this.getAttribute('pattern');
            const regex = new RegExp(pattern);
            if (this.value && !regex.test(this.value)) {
                this.setCustomValidity('Please enter a valid image URL (jpg, jpeg, png, gif, webp, bmp, svg)');
            } else {
                this.setCustomValidity('');
            }
        });
    });
}

// Set up event listeners for artwork cards
function setupArtworkEventListeners() {
    const artworkList = document.getElementById('artworkList');
    if (!artworkList) return;
    
    // Use event delegation for edit and delete buttons
    artworkList.addEventListener('click', (e) => {
        // Handle edit button click
        const editButton = e.target.closest('.edit-artwork');
        if (editButton) {
            e.preventDefault();
            const artworkId = editButton.dataset.id;
            if (artworkId) {
                editArtwork(artworkId);
            }
            return;
        }
        
        // Handle delete button click
        const deleteButton = e.target.closest('.delete-artwork');
        if (deleteButton) {
            e.preventDefault();
            const artworkId = deleteButton.dataset.id;
            const artworkTitle = deleteButton.dataset.title || 'this artwork';
            if (artworkId) {
                showDeleteConfirmation(artworkId, artworkTitle);
            }
            return;
        }
    });
}

// Debug: Log all scripts on the page
console.log('=== LOADED SCRIPTS ===');
Array.from(document.scripts).forEach((script, i) => {
    console.log(`Script ${i + 1}:`, script.src || 'inline script');
});

// Debug: Check if our element exists and its current content
setTimeout(() => {
    const el = document.getElementById('totalArtworks');
    console.log('Debug - totalArtworks element:', el);
    if (el) {
        console.log('Debug - current content:', el.textContent);
        console.log('Debug - innerHTML:', el.innerHTML);
        console.log('Debug - computed styles:', window.getComputedStyle(el));
    }
}, 1500);

// Initialize admin app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing admin app...');
    
    try {
        const adminApp = new AdminApp();
        await adminApp.initialize();
    } catch (error) {
        console.error('Error initializing admin app:', error);
    }
});

// Clean up when the page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.adminApp && typeof window.adminApp.destroy === 'function') {
        window.adminApp.destroy();
    }
});
