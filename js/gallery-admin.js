// Gallery Management Functions

// Use window object to store our instances
if (!window.galleryAdmin) {
    window.galleryAdmin = {
        initialized: false,
        db: null,
        auth: null,
        showAlert: null,
        isLoadingArtworks: false
    };
}

// Wait for Firebase to be initialized
function ensureFirebaseInitialized() {
    if (!window.firebase) {
        console.error('Firebase not loaded');
        return false;
    }
    
    if (!window.galleryAdmin.db) {
        window.galleryAdmin.db = firebase.firestore();
    }
    
    if (!window.galleryAdmin.auth) {
        window.galleryAdmin.auth = firebase.auth();
    }
    
    if (!window.galleryAdmin.showAlert) {
        window.galleryAdmin.showAlert = function(message, type = 'info') {
            const alertContainer = document.getElementById('alertContainer');
            if (alertContainer) {
                alertContainer.innerHTML = `
                    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                        ${message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `;
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        };
    }
    
    return true;
}

// Initialize gallery management
window.initGalleryManagement = function() {
    console.log('Initializing gallery management...');
    
    // Load initial gallery items
    loadGalleryItems();
    
    // Set up event listener for the Add Gallery Item button
    const addGalleryItemBtn = document.getElementById('addGalleryItemBtn');
    if (addGalleryItemBtn) {
        console.log('Found Add Gallery Item button, setting up click handler');
        addGalleryItemBtn.addEventListener('click', function() {
            console.log('Add Gallery Item button clicked');
            // Clear the form
            document.getElementById('galleryTitle').value = '';
            document.getElementById('galleryCategory').value = '';
            document.getElementById('galleryDescription').value = '';
            document.getElementById('galleryImageUrl').value = '';
            // Show the modal
            const addModal = new bootstrap.Modal(document.getElementById('addGalleryItemModal'));
            addModal.show();
        });
    } else {
        console.error('Add Gallery Item button not found');
    }
    
    // Set up event listeners for the add gallery item form
    const addGalleryItemForm = document.getElementById('addGalleryItemForm');
    if (addGalleryItemForm) {
        console.log('Found Add Gallery Item form, setting up submit handler');
        addGalleryItemForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Add Gallery Item form submitted');
            await addGalleryItem();
        });
    } else {
        console.error('Add Gallery Item form not found');
    }
    
    // Set up event listeners for the edit gallery item form
    const editGalleryItemForm = document.getElementById('editGalleryItemForm');
    if (editGalleryItemForm) {
        console.log('Found Edit Gallery Item form, setting up submit handler');
        editGalleryItemForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateGalleryItem();
        });
    } else {
        console.error('Edit Gallery Item form not found');
    }
    
    console.log('Gallery management initialized');
};

// Make initGalleryManagement available globally
window.initGalleryManagement = initGalleryManagement;

// Initialize when Firebase is ready
if (window.firebase) {
    if (window.galleryAdmin.authStateListener) {
        window.firebase.auth().removeAuthStateListener(window.galleryAdmin.authStateListener);
    }
    
    window.galleryAdmin.authStateListener = firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('User authenticated, initializing gallery management...');
            initGalleryManagement();
        }
    });
}

// Load gallery items
async function loadGalleryItems() {
    if (!ensureFirebaseInitialized()) {
        console.error('Firebase not initialized. Cannot load gallery items.');
        return;
    }
    
    try {
        console.log('Loading gallery items...');
        const galleryTableBody = document.getElementById('galleryTableBody');
        if (!galleryTableBody) {
            console.error('Gallery table body element not found');
            return;
        }

        // Show loading state
        galleryTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;

        // Get gallery items from Firestore
        const snapshot = await window.galleryAdmin.db.collection('Gallery').get();
        
        if (snapshot.empty) {
            galleryTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <p class="text-muted mb-0">No gallery items found. Add your first item!</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Clear the table
        galleryTableBody.innerHTML = '';

        // Add each gallery item to the table
        snapshot.forEach(doc => {
            const item = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="width: 100px;">
                    <img src="${item.imageUrl || ''}" 
                         alt="${item.title}" 
                         class="img-thumbnail"
                         style="width: 80px; height: 80px; object-fit: cover;">
                </td>
                <td>
                    <div class="fw-bold">${item.title}</div>
                    <small class="text-muted">${item.description || ''}</small>
                </td>
                <td>
                    <span class="badge bg-primary">${item.category || 'Uncategorized'}</span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editGalleryItem('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteGalleryItem('${doc.id}', '${item.title}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            galleryTableBody.appendChild(row);
        });

        console.log('Gallery items loaded successfully');
        
    } catch (error) {
        console.error('Error loading gallery items:', error);
        const galleryTableBody = document.getElementById('galleryTableBody');
        if (galleryTableBody) {
            galleryTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <div class="alert alert-danger mb-0">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Error loading gallery items: ${error.message}
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

// Edit gallery item
async function editGalleryItem(id) {
    if (!ensureFirebaseInitialized()) {
        console.error('Firebase not initialized. Cannot edit gallery item.');
        return;
    }
    
    try {
        console.log('Loading gallery item for edit:', id);
        // Get the gallery item
        const doc = await window.galleryAdmin.db.collection('Gallery').doc(id).get();
        
        if (!doc.exists) {
            window.galleryAdmin.showAlert('Gallery item not found', 'danger');
            return;
        }
        
        const item = doc.data();
        console.log('Gallery item data:', item);
        
        // Populate the edit form
        document.getElementById('editGalleryItemId').value = id;
        document.getElementById('editGalleryTitle').value = item.title || '';
        document.getElementById('editGalleryCategory').value = item.category || '';
        document.getElementById('editGalleryDescription').value = item.description || '';
        document.getElementById('editGalleryImageUrl').value = item.imageUrl || '';
        
        // Show the edit modal
        const editModal = new bootstrap.Modal(document.getElementById('editGalleryItemModal'));
        editModal.show();
        
    } catch (error) {
        console.error('Error loading gallery item for edit:', error);
        window.galleryAdmin.showAlert('Error loading gallery item: ' + error.message, 'danger');
    }
}

// Delete gallery item
async function deleteGalleryItem(id, title) {
    if (!ensureFirebaseInitialized()) {
        console.error('Firebase not initialized. Cannot delete gallery item.');
        return;
    }
    
    try {
        console.log('Preparing to delete gallery item:', id);
        // Show confirmation modal
        document.getElementById('galleryItemToDeleteTitle').textContent = title;
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteGalleryItemModal'));
        deleteModal.show();
        
        // Set up delete confirmation
        const confirmBtn = document.getElementById('confirmDeleteGalleryItemBtn');
        confirmBtn.onclick = async () => {
            try {
                console.log('Deleting gallery item:', id);
                await window.galleryAdmin.db.collection('Gallery').doc(id).delete();
                deleteModal.hide();
                window.galleryAdmin.showAlert('Gallery item deleted successfully', 'success');
                loadGalleryItems();
            } catch (error) {
                console.error('Error deleting gallery item:', error);
                window.galleryAdmin.showAlert('Error deleting gallery item: ' + error.message, 'danger');
            }
        };
        
    } catch (error) {
        console.error('Error preparing to delete gallery item:', error);
        window.galleryAdmin.showAlert('Error preparing to delete gallery item: ' + error.message, 'danger');
    }
}

// Update gallery item
async function updateGalleryItem() {
    if (!ensureFirebaseInitialized()) {
        console.error('Firebase not initialized. Cannot update gallery item.');
        return;
    }
    
    try {
        console.log('Updating gallery item...');
        const id = document.getElementById('editGalleryItemId').value;
        const title = document.getElementById('editGalleryTitle').value;
        const category = document.getElementById('editGalleryCategory').value;
        const description = document.getElementById('editGalleryDescription').value;
        const imageUrl = document.getElementById('editGalleryImageUrl').value;
        
        console.log('Form values:', { id, title, category, description, imageUrl });
        
        if (!title || !category || !description || !imageUrl) {
            window.galleryAdmin.showAlert('Please fill in all fields', 'warning');
            return;
        }
        
        // Update the gallery item
        await window.galleryAdmin.db.collection('Gallery').doc(id).update({
            title,
            category,
            description,
            imageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Gallery item updated successfully');
        
        // Hide the modal
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editGalleryItemModal'));
        if (editModal) {
            editModal.hide();
        }
        
        // Show success message
        window.galleryAdmin.showAlert('Gallery item updated successfully', 'success');
        
        // Reload gallery items
        loadGalleryItems();
        
    } catch (error) {
        console.error('Error updating gallery item:', error);
        window.galleryAdmin.showAlert('Error updating gallery item: ' + error.message, 'danger');
    }
}

// Add a flag to track submission state
let isSubmitting = false;

// Add gallery item
async function addGalleryItem() {
    if (!ensureFirebaseInitialized()) {
        console.error('Firebase not initialized. Cannot add gallery item.');
        return;
    }
    
    // Prevent double submission
    if (isSubmitting) {
        console.log('Already submitting, ignoring duplicate submission');
        return;
    }
    
    try {
        isSubmitting = true;
        console.log('Adding new gallery item...');
        
        // Disable the submit button
        const submitButton = document.querySelector('#addGalleryItemForm button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Adding...';
        }
        
        const title = document.getElementById('galleryTitle').value;
        const category = document.getElementById('galleryCategory').value;
        const description = document.getElementById('galleryDescription').value;
        const imageUrl = document.getElementById('galleryImageUrl').value;
        
        console.log('Form values:', { title, category, description, imageUrl });
        
        if (!title || !category || !description || !imageUrl) {
            window.galleryAdmin.showAlert('Please fill in all fields', 'warning');
            return;
        }
        
        // Add the gallery item
        await window.galleryAdmin.db.collection('Gallery').add({
            title,
            category,
            description,
            imageUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Gallery item added successfully');
        
        // Get the form and reset it
        const form = document.getElementById('addGalleryItemForm');
        if (form) {
            form.reset();
        }
        
        // Hide the modal
        const addModal = bootstrap.Modal.getInstance(document.getElementById('addGalleryItemModal'));
        if (addModal) {
            addModal.hide();
            // Remove any backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            // Remove modal-open class from body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        
        // Show success message
        window.galleryAdmin.showAlert('Gallery item added successfully', 'success');
        
        // Reload gallery items
        loadGalleryItems();
        
    } catch (error) {
        console.error('Error adding gallery item:', error);
        window.galleryAdmin.showAlert('Error adding gallery item: ' + error.message, 'danger');
    } finally {
        // Reset submission state and re-enable button
        isSubmitting = false;
        const submitButton = document.querySelector('#addGalleryItemForm button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-plus me-2"></i>Add Item';
        }
    }
}

// Make functions available globally
window.loadGalleryItems = loadGalleryItems;
window.editGalleryItem = editGalleryItem;
window.deleteGalleryItem = deleteGalleryItem;
window.updateGalleryItem = updateGalleryItem;
window.addGalleryItem = addGalleryItem;
