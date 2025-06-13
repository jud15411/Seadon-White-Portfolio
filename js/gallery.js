// Initialize Firebase
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
} else {
    // Wait for Firebase to be initialized
    const checkFirebase = setInterval(() => {
        if (window.db && window.auth) {
            clearInterval(checkFirebase);
            console.log('Firebase ready, initializing gallery...');
            initGallery();
        }
    }, 100);
}

// Initialize the gallery
async function initGallery() {
    try {
        // Show loading state
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;
        
        galleryGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading gallery...</span>
                </div>
            </div>`;
        
        console.log('Attempting to fetch from Gallery collection...');
        
        // Fetch gallery items from Firestore
        const snapshot = await firebase.firestore()
            .collection('Gallery')
            .orderBy('displayOrder')
            .get();
        
        console.log('Gallery fetch successful, processing items...');
        
        if (snapshot.empty) {
            console.log('No gallery items found');
            showEmptyGallery();
            return;
        }
        
        // Clear loading state
        galleryGrid.innerHTML = '';
        
        // Process gallery items
        const galleryItems = [];
        for (const doc of snapshot.docs) {
            const galleryItem = doc.data();
            try {
                const artworkDoc = await firebase.firestore()
                    .collection('artworks')
                    .doc(galleryItem.artworkId)
                    .get();
                
                if (artworkDoc.exists) {
                    galleryItems.push({
                        id: doc.id,
                        ...galleryItem,
                        artwork: artworkDoc.data()
                    });
                    console.log('Added gallery item:', doc.id, galleryItem.artworkId);
                } else {
                    console.warn(`Artwork not found for gallery item ${doc.id}`);
                }
            } catch (error) {
                console.error(`Error fetching artwork for gallery item ${doc.id}:`, error);
            }
        }
        
        console.log(`Processed ${galleryItems.length} gallery items`);
        
        // Group items by category
        const itemsByCategory = galleryItems.reduce((acc, item) => {
            const category = item.category || 'Featured';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {});
        
        console.log('Categories found:', Object.keys(itemsByCategory));
        
        // Render items by category
        Object.entries(itemsByCategory).forEach(([category, items]) => {
            // Create category section
            const categorySection = document.createElement('section');
            categorySection.className = 'gallery-category mb-5';
            
            // Add category title
            const categoryTitle = document.createElement('h2');
            categoryTitle.className = 'gallery-category-title mb-4';
            categoryTitle.textContent = category;
            categorySection.appendChild(categoryTitle);
            
            // Create grid for items
            const grid = document.createElement('div');
            grid.className = 'row g-4';
            
            // Add items to grid
            items.forEach(item => {
                const artwork = item.artwork;
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4';
                col.innerHTML = `
                    <div class="gallery-item">
                        <div class="gallery-item-image">
                            <img src="${artwork.imageUrl || 'https://via.placeholder.com/600x450?text=No+Image'}" 
                                 alt="${artwork.title || 'Artwork'}"
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/600x450?text=Image+Not+Available'">
                            <div class="gallery-item-overlay">
                                <div class="gallery-item-info">
                                    <h3 class="gallery-item-title">${artwork.title || 'Untitled'}</h3>
                                    <p class="gallery-item-description">${artwork.description || 'No description available'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add click handler for lightbox
                col.querySelector('.gallery-item').addEventListener('click', () => {
                    openLightbox(artwork);
                });
                
                grid.appendChild(col);
            });
            
            categorySection.appendChild(grid);
            galleryGrid.appendChild(categorySection);
        });
        
        console.log('Gallery rendering complete');
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        showErrorState();
    }
}

// Show empty gallery state
function showEmptyGallery() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-images fs-1 text-muted mb-3"></i>
            <h3>No Gallery Items</h3>
            <p class="text-muted">The gallery is currently empty.</p>
        </div>
    `;
}

// Show error state
function showErrorState() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-exclamation-circle fs-1 text-danger mb-3"></i>
            <h3>Error Loading Gallery</h3>
            <p class="text-muted">Please try refreshing the page.</p>
            <button class="btn btn-outline-primary mt-3" onclick="window.location.reload()">
                <i class="fas fa-sync-alt me-2"></i>Try Again
            </button>
        </div>
    `;
}

// Open lightbox with the clicked item
function openLightbox(item) {
    // Create lightbox container
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.style.display = 'flex';
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'lightbox-content';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => {
        document.body.removeChild(lightbox);
        document.body.style.overflow = 'auto';
    };
    
    // Create image
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.title || 'Artwork';
    
    // Create caption
    const caption = document.createElement('div');
    caption.className = 'lightbox-caption';
    caption.innerHTML = `
        <h3>${item.title || 'Untitled'}</h3>
        <p>${item.description || 'No description available'}</p>
    `;
    
    // Assemble lightbox
    content.appendChild(closeBtn);
    content.appendChild(img);
    content.appendChild(caption);
    lightbox.appendChild(content);
    
    // Add to document
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    // Close on click outside
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            document.body.removeChild(lightbox);
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(lightbox);
            document.body.style.overflow = 'auto';
        }
    });
}

// Make functions available globally if needed
window.initGallery = initGallery;
window.openLightbox = openLightbox;
