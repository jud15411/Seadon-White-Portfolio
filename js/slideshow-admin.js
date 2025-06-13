// Slideshow management functionality
class SlideshowAdmin {
    constructor() {
        this.db = firebase.firestore();
        this.storage = firebase.storage();
        this.slideshowList = document.getElementById('slideshowList');
        this.noSlidesMessage = document.getElementById('noSlidesMessage');
        this.addSlideshowForm = document.getElementById('addSlideshowForm');
        this.saveSlideBtn = document.getElementById('saveSlideBtn');
        this.confirmDeleteSlide = document.getElementById('confirmDeleteSlide');
        this.slideToDelete = null;
        
        // Bind methods
        this.loadSlideshow = this.loadSlideshow.bind(this);
        this.addSlide = this.addSlide.bind(this);
        this.deleteSlide = this.deleteSlide.bind(this);
        this.showDeleteConfirmation = this.showDeleteConfirmation.bind(this);
        this.showAlert = this.showAlert.bind(this);
        
        // Initialize
        this.initialize();
    }
    
    async initialize() {
        try {
            console.log('Initializing slideshow management...');
            console.log('Firebase initialized:', !!window.firebase);
            console.log('Firestore instance:', !!this.db);
            
            // Set up event listeners
            this.setupEventListeners();
            console.log('Event listeners set up');
            
            // Load initial slideshow data
            await this.loadSlideshow();
            console.log('Initial slideshow data loaded');
            
            console.log('Slideshow management initialized successfully');
        } catch (error) {
            console.error('Error initializing slideshow management:', error);
            this.showAlert('Error initializing slideshow management: ' + error.message, 'danger');
        }
    }
    
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshSlideshow');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadSlideshow());
        }
        
        // Save slide button
        if (this.saveSlideBtn) {
            console.log('Found save button, setting up click handler');
            this.saveSlideBtn.addEventListener('click', async () => {
                console.log('Save button clicked');
                try {
                    this.saveSlideBtn.disabled = true;
                    const spinner = this.saveSlideBtn.querySelector('.spinner-border');
                    if (spinner) spinner.classList.remove('d-none');
                    
                    console.log('Calling addSlide function');
                    await this.addSlide();
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addSlideshowModal'));
                    if (modal) modal.hide();
                    
                    // Reset form
                    this.addSlideshowForm.reset();
                    
                } catch (error) {
                    console.error('Error saving slide:', error);
                    this.showAlert('Error saving slide: ' + error.message, 'danger');
                } finally {
                    this.saveSlideBtn.disabled = false;
                    const spinner = this.saveSlideBtn.querySelector('.spinner-border');
                    if (spinner) spinner.classList.add('d-none');
                }
            });
        } else {
            console.error('Save button not found');
        }
        
        // Delete confirmation
        if (this.confirmDeleteSlide) {
            this.confirmDeleteSlide.addEventListener('click', async () => {
                if (!this.slideToDelete) return;
                
                try {
                    this.confirmDeleteSlide.disabled = true;
                    const spinner = this.confirmDeleteSlide.querySelector('.spinner-border');
                    if (spinner) spinner.classList.remove('d-none');
                    
                    await this.deleteSlide(this.slideToDelete);
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteSlideshowModal'));
                    if (modal) modal.hide();
                    
                } catch (error) {
                    console.error('Error deleting slide:', error);
                    this.showAlert('Error deleting slide: ' + error.message, 'danger');
                } finally {
                    this.confirmDeleteSlide.disabled = false;
                    const spinner = this.confirmDeleteSlide.querySelector('.spinner-border');
                    if (spinner) spinner.classList.add('d-none');
                    this.slideToDelete = null;
                }
            });
        }
    }
    
    async loadSlideshow() {
        try {
            console.log('Loading slideshow data...');
            
            // Show loading state
            if (this.slideshowList) {
                this.slideshowList.innerHTML = `
                    <div class="col-12">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2">Loading slideshow...</p>
                        </div>
                    </div>
                `;
            }
            
            // Get slides from Firestore
            const querySnapshot = await this.db.collection('Slideshow')
                .orderBy('order', 'asc')
                .get();
            
            console.log(`Found ${querySnapshot.size} slides`);
            
            // Clear loading state
            if (this.slideshowList) {
                this.slideshowList.innerHTML = '';
            }
            
            if (querySnapshot.empty) {
                if (this.noSlidesMessage) {
                    this.noSlidesMessage.style.display = 'block';
                }
                return;
            }
            
            if (this.noSlidesMessage) {
                this.noSlidesMessage.style.display = 'none';
            }
            
            // Process each slide
            querySnapshot.forEach((doc) => {
                const slide = { id: doc.id, ...doc.data() };
                
                const slideCard = document.createElement('div');
                slideCard.className = 'col';
                
                slideCard.innerHTML = `
                    <div class="card h-100">
                        <div class="position-relative" style="padding-top: 56.25%;">
                            <img src="${slide.imageUrl}" 
                                 class="card-img-top position-absolute top-0 start-0 w-100 h-100 object-fit-cover" 
                                 alt="Slideshow image"
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/800x450?text=Image+Not+Found'">
                        </div>
                        <div class="card-footer bg-transparent border-top-0">
                            <div class="btn-group w-100">
                                <button class="btn btn-outline-danger" onclick="window.slideshowAdmin.showDeleteConfirmation('${slide.id}')">
                                    <i class="fas fa-trash me-1"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                if (this.slideshowList) {
                    this.slideshowList.appendChild(slideCard);
                }
            });
            
        } catch (error) {
            console.error('Error loading slideshow:', error);
            if (this.slideshowList) {
                this.slideshowList.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-exclamation-triangle me-3 fs-4"></i>
                                <div>
                                    <h5 class="alert-heading">Error Loading Slideshow</h5>
                                    <p class="mb-0">${error.message || 'An error occurred while loading the slideshow. Please try again.'}</p>
                                </div>
                            </div>
                            <div class="d-flex justify-content-end mt-3">
                                <button class="btn btn-sm btn-outline-secondary" onclick="window.slideshowAdmin.loadSlideshow()">
                                    <i class="fas fa-sync-alt me-1"></i> Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            throw error;
        }
    }
    
    async addSlide() {
        try {
            console.log('Adding new slide...');
            
            // Get image URL
            const imageUrl = document.getElementById('slideImageUrl').value.trim();
            
            if (!imageUrl) {
                throw new Error('Image URL is required');
            }
            
            // Add slide to Firestore
            console.log('Adding slide to Firestore...');
            const slideData = {
                imageUrl,
                order: Date.now(), // Use timestamp as order to maintain sequence
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await this.db.collection('Slideshow').add(slideData);
            console.log('Slide added with ID:', docRef.id);
            
            // Show success message
            this.showAlert('Slide added successfully!', 'success');
            
            // Reload slideshow
            await this.loadSlideshow();
            
        } catch (error) {
            console.error('Error adding slide:', error);
            throw error;
        }
    }
    
    async deleteSlide(slideId) {
        try {
            console.log('Deleting slide:', slideId);
            
            // Get slide data
            const doc = await this.db.collection('Slideshow').doc(slideId).get();
            if (!doc.exists) {
                throw new Error('Slide not found');
            }
            
            const slide = doc.data();
            
            // Delete image from storage
            if (slide.imageUrl) {
                try {
                    const imageRef = this.storage.refFromURL(slide.imageUrl);
                    await imageRef.delete();
                } catch (error) {
                    console.warn('Error deleting image:', error);
                }
            }
            
            // Delete slide from Firestore
            await this.db.collection('Slideshow').doc(slideId).delete();
            console.log('Slide deleted successfully');
            
            // Show success message
            this.showAlert('Slide deleted successfully!', 'success');
            
            // Reload slideshow
            await this.loadSlideshow();
            
        } catch (error) {
            console.error('Error deleting slide:', error);
            throw error;
        }
    }
    
    showDeleteConfirmation(slideId) {
        this.slideToDelete = slideId;
        const modal = new bootstrap.Modal(document.getElementById('deleteSlideshowModal'));
        modal.show();
    }
    
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, 5000);
    }
}

// Initialize slideshow management when Firebase is ready
document.addEventListener('DOMContentLoaded', async () => {
    if (window.firebase) {
        console.log('Firebase is ready, waiting for auth service...');
        
        try {
            // Wait for auth service to be ready
            await window.authServiceReady;
            
            // Check if user is admin
            const isAdmin = await window.authService.isAdmin();
            if (!isAdmin) {
                console.error('User is not an admin');
                return;
            }
            
            console.log('Auth service ready, initializing slideshow management...');
            window.slideshowAdmin = new SlideshowAdmin();
        } catch (error) {
            console.error('Error initializing slideshow management:', error);
        }
    } else {
        console.error('Firebase not found. Make sure Firebase is loaded before slideshow-admin.js');
    }
}); 