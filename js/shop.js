// Cart functionality
let cart = [];

// Store artwork data
let artworks = [];

// Wait for Firebase to be ready
function onFirebaseReady() {
    try {
        // Firebase is already initialized by the CDN script
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        
        console.log('Firebase initialized successfully');
        
        // Set up auth state listener
        window.auth.onAuthStateChanged(handleAuthStateChanged, handleAuthError);
        
        // Initialize other components
        initializeCart();
        initializeAuthUI();
        loadArtwork(); // Load artwork when Firebase is ready
        
        // Set up admin panel button
        const adminPanelBtn = document.getElementById('adminPanel');
        if (adminPanelBtn) {
            adminPanelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'admin.html';
            });
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
}

// Handle auth state changes
function handleAuthStateChanged(user) {
    try {
        console.log('Auth state changed. User:', user);
        const signinBtn = document.getElementById('signinBtn');
        const userMenu = document.getElementById('userMenu');
        const adminPanel = document.getElementById('adminPanel');
        
        console.log('Elements:', { signinBtn, userMenu, adminPanel });
        
        if (user) {
            console.log('User is signed in with email:', user.email);
            // User is signed in
            if (signinBtn) signinBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            
            // Check if user is admin
            if (user.email === 'contact@seadonwhite.com') {
                console.log('Admin user detected, showing admin panel');
                if (adminPanel) {
                    adminPanel.style.display = 'block';
                    console.log('Admin panel display style set to:', adminPanel.style.display);
                } else {
                    console.error('Admin panel element not found!');
                }
                // Set up admin account in Firestore
                setupAdminAccount(user);
            } else {
                console.log('Regular user, not an admin');
            }
        } else {
            console.log('No user is signed in');
            // User is signed out
            if (signinBtn) signinBtn.style.display = 'inline-block';
            if (userMenu) userMenu.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'none';
        }
    } catch (error) {
        console.error('Error in auth state change:', error);
    }
}

// Handle auth errors
function handleAuthError(error) {
    console.error('Auth error:', error);
}

// Initialize cart
function initializeCart() {
    // Load cart from localStorage if available
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartDisplay();
        } catch (e) {
            console.error('Error loading cart:', e);
            cart = [];
        }
    }
}

// Initialize auth UI
function initializeAuthUI() {
    // Set up sign in form
    const signinForm = document.getElementById('signinForm');
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignIn);
    }

    // Set up sign up form - removing duplicate event listener
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        // Remove any existing event listeners first to prevent duplicates
        const newSignupForm = signupForm.cloneNode(true);
        signupForm.parentNode.replaceChild(newSignupForm, signupForm);
        newSignupForm.addEventListener('submit', handleSignUp);
    }

    // Set up sign out button
    const signoutBtn = document.getElementById('signoutBtn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', handleSignOut);
    }
}

// Handle sign in
async function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        document.querySelector('.modal')?.classList.remove('active');
        showNotification('Signed in successfully', 'success');
    } catch (error) {
        console.error('Sign in error:', error);
        showNotification(error.message, 'error');
    }
}

// Handle sign up
async function handleSignUp(e) {
    e.preventDefault();
    console.log('Sign up form submitted');
    
    const email = document.getElementById('signupEmail')?.value;
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    console.log('Form values:', { email, password, confirmPassword });
    
    if (!email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        showNotification('Creating your account...', 'info');
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        console.log('User created:', userCredential.user);
        
        // Send email verification
        await userCredential.user.sendEmailVerification();
        
        showNotification('Account created successfully! Please check your email to verify your account.', 'success');
        
        // Switch back to sign in form
        const showSignin = document.getElementById('showSignin');
        if (showSignin) showSignin.click();
        
        // Clear the form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) signupForm.reset();
        
    } catch (error) {
        console.error('Sign up error:', error);
        let errorMessage = 'Failed to create account';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use. Please use a different email or sign in.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please use a stronger password.';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// Handle sign out
async function handleSignOut(e) {
    e.preventDefault();
    try {
        await firebase.auth().signOut();
        showNotification('Signed out successfully', 'success');
    } catch (error) {
        console.error('Sign out error:', error);
        showNotification(error.message, 'error');
    }
}

// Mobile dropdown menu functionality
function initMobileDropdown() {
    const userMenu = document.querySelector('.user-menu');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const dropdownClose = document.createElement('button');
    
    dropdownClose.className = 'dropdown-close';
    dropdownClose.innerHTML = '&times;';
    dropdownClose.setAttribute('aria-label', 'Close menu');
    
    if (dropdownMenu) {
        dropdownMenu.prepend(dropdownClose);
    }
    
    // Toggle dropdown on mobile
    if (userMenu) {
        userMenu.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                document.body.classList.toggle('dropdown-open');
                dropdownMenu.classList.toggle('show');
            }
        });
    }
    
    // Close dropdown when clicking close button
    dropdownClose.addEventListener('click', function(e) {
        e.stopPropagation();
        document.body.classList.remove('dropdown-open');
        dropdownMenu.classList.remove('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userMenu.contains(e.target) && !dropdownMenu.contains(e.target)) {
            document.body.classList.remove('dropdown-open');
            dropdownMenu.classList.remove('show');
        }
    });
}

// Initialize when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        onFirebaseReady();
        initMobileDropdown();
    });
} else {
    onFirebaseReady();
    initMobileDropdown();
}

// Admin setup
async function setupAdminAccount(user) {
    if (!user || user.email !== 'contact@seadonwhite.com') return;
    
    try {
        // Use the Firebase v8 compatible syntax
        const userRef = db.collection('users').doc(user.uid);
        await userRef.set({
            email: user.email,
            isAdmin: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('Admin account configured in users collection');
    } catch (error) {
        console.error('Error setting up admin:', error);
    }
}

// Handle sign out
async function handleSignOut(e) {
    if (e) e.preventDefault();
    try {
        await firebase.auth().signOut();
        // Redirect to home page after sign out
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// Set up sign out button
const signoutBtn = document.getElementById('signoutBtn');
if (signoutBtn) {
    signoutBtn.addEventListener('click', handleSignOut);
}
const showSignup = document.getElementById('showSignup');
const showSignin = document.getElementById('showSignin');

if (showSignup) {
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        const signinForm = document.getElementById('signinForm');
        const signupForm = document.getElementById('signupForm');
        if (signinForm && signupForm) {
            signinForm.style.display = 'none';
            signupForm.style.display = 'block';
        }
    });
}

if (showSignin) {
    showSignin.addEventListener('click', (e) => {
        e.preventDefault();
        const signinForm = document.getElementById('signinForm');
        const signupForm = document.getElementById('signupForm');
        if (signinForm && signupForm) {
            signinForm.style.display = 'block';
            signupForm.style.display = 'none';
        }
    });
}

// Toggle user menu
const userMenuBtn = document.getElementById('userMenuBtn');
if (userMenuBtn) {
    userMenuBtn.addEventListener('click', () => {
        const dropdown = document.getElementById('dropdownMenu');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    });
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdownMenu');
    const userMenuBtn = document.getElementById('userMenuBtn');
    
    if (dropdown && userMenuBtn && e.target !== userMenuBtn && !dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// Global variable to store artwork data
let artworkData = {};

// Function to initialize artwork data in Firestore (run this once to seed the database)
async function initializeArtworkData() {
    try {
        // Only run this function once to initialize data
        if (localStorage.getItem('artworkInitialized') === 'true') {
            console.log('Artwork already initialized, skipping...');
            return;
        }

        // Check if user is authenticated and admin
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log('User not authenticated, skipping artwork initialization');
            return;
        }

        // Get user document to check admin status
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists || !userDoc.data()?.isAdmin) {
            console.log('User is not an admin, skipping artwork initialization');
            return;
        }
        
        const sampleArtwork = [
            {
                title: 'Abstract Landscape',
                price: 250.00,
                imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&auto=format&fit=crop&q=60',
                description: 'Beautiful abstract landscape painting',
                category: 'painting',
                isAvailable: true,
                inStock: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Modern Art',
                price: 350.00,
                imageUrl: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&auto=format&fit=crop&q=60',
                description: 'Contemporary modern art piece',
                category: 'painting',
                isAvailable: true,
                inStock: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Sculpture',
                price: 450.00,
                imageUrl: 'https://images.unsplash.com/photo-1531913764164-f85c52d6e654?w=800&auto=format&fit=crop&q=60',
                description: 'Elegant modern sculpture',
                category: 'sculpture',
                isAvailable: true,
                inStock: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];

        // Add sample data to Firestore
        const batch = db.batch();
        
        sampleArtwork.forEach(artwork => {
            // Let Firestore generate the document ID
            const docRef = db.collection('artworks').doc();
            batch.set(docRef, artwork);
        });
        
        await batch.commit();
        localStorage.setItem('artworkInitialized', 'true');
        console.log('Artwork data initialized in Firestore');
    } catch (error) {
        console.error('Error initializing artwork data:', error);
        // Don't block the rest of the app if initialization fails
        return Promise.resolve();
    }
}

// Function to load artwork from Firestore
async function loadArtwork() {
    try {
        console.log('Loading artwork from Firestore...');
        const shopGrid = document.querySelector('.shop-grid');
        
        if (!shopGrid) {
            console.error('Shop grid element not found');
            return;
        }
        
        // Show loading state
        shopGrid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        // Get all artworks and handle filtering/sorting client-side
        const snapshot = await db.collection('artworks').get();
        
        // Filter available artworks and sort by date
        const availableArtworks = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Include if inStock is true or not set (backward compatibility)
            if (data.inStock !== false) {
                availableArtworks.push({
                    id: doc.id,
                    ...data,
                    // Ensure inStock is properly set (default to true if not set)
                    inStock: data.inStock !== false,
                    // Ensure createdAt exists and is a Date object
                    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0)
                });
            }
        });
        
        // Sort by createdAt (newest first)
        availableArtworks.sort((a, b) => b.createdAt - a.createdAt);
        
        // Create a new querySnapshot-like object for the rest of the code
        const querySnapshot = {
            empty: availableArtworks.length === 0,
            size: availableArtworks.length,
            forEach: (callback) => {
                availableArtworks.forEach((artwork) => {
                    callback({
                        id: artwork.id,
                        data: () => artwork
                    });
                });
            },
            docs: availableArtworks.map(artwork => ({
                id: artwork.id,
                data: () => artwork
            }))
        };
            
        console.log(`Found ${querySnapshot.size} artworks`);
        
        // Clear loading state
        shopGrid.innerHTML = '';
        
        if (querySnapshot.empty) {
            shopGrid.innerHTML = '<div class="col-12"><div class="alert alert-info">No artwork available at the moment. Please check back later.</div></div>';
            return;
        }
        
        artworks = []; // Reset artworks array
        let html = '';
        
        // Process the documents (already sorted by Firestore)
        querySnapshot.docs.forEach((doc) => {
            const artwork = { id: doc.id, ...doc.data() };
            artworks.push(artwork);
            
            // Format price
            const price = parseFloat(artwork.price || 0).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            // Create artwork card
            const defaultImage = 'data:image/svg+xml;charset=UTF-8,' + 
                encodeURIComponent('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">' +
                '<rect width="100%" height="100%" fill="#f0f0f0"/>' +
                '<text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle" ' +
                'dominant-baseline="middle" fill="#999">No Image</text></svg>');
                
            const errorImage = 'data:image/svg+xml;charset=UTF-8,' + 
                encodeURIComponent('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">' +
                '<rect width="100%" height="100%" fill="#fee2e2"/>' +
                '<text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" ' +
                'dominant-baseline="middle" fill="#dc2626">Image not available</text></svg>');

            html += `
            <div class="shop-item" data-category="${artwork.category || 'other'}" data-price="${artwork.price || 0}">
                <div class="shop-item-image">
                    <img src="${artwork.imageUrl || defaultImage}" 
                         alt="${artwork.title || 'Artwork'}" 
                         onerror="this.onerror=null; this.src='${errorImage}'">
                    <div class="shop-item-overlay">
                        <button class="add-to-cart" data-artwork-id="${artwork.id}">Add to Cart</button>
                    </div>
                </div>
                <div class="shop-item-info">
                    <h3>${artwork.title || 'Untitled'}</h3>
                    <p class="price">${price}</p>
                    ${artwork.description ? `<p class="artwork-description">${artwork.description.substring(0, 60)}${artwork.description.length > 60 ? '...' : ''}</p>` : ''}
                </div>
            </div>`;
        });
        
        shopGrid.innerHTML = html;
        
        // Add event listeners to the Add to Cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const artworkId = e.currentTarget.getAttribute('data-artwork-id');
                addToCart(artworkId);
            });
        });
        
        // Initialize filter functionality
        initializeFilters();
        
    } catch (error) {
        console.error('Error loading artwork:', error);
        const shopGrid = document.querySelector('.shop-grid');
        if (shopGrid) {
            shopGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Error loading artwork. Please try again later.
                    </div>
                </div>`;
        }
    }
}

// Initialize filter functionality
function initializeFilters() {
    const categoryFilter = document.getElementById('category');
    const priceFilter = document.getElementById('price');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterArtwork);
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', filterArtwork);
    }
}

// Filter artwork based on selected filters
function filterArtwork() {
    const category = document.getElementById('category').value;
    const priceRange = document.getElementById('price').value;
    
    document.querySelectorAll('.shop-item').forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        const itemPrice = parseFloat(item.getAttribute('data-price'));
        let showItem = true;
        
        // Apply category filter
        if (category !== 'all' && itemCategory !== category) {
            showItem = false;
        }
        
        // Apply price filter
        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number);
            if (priceRange.endsWith('+')) {
                if (itemPrice < min) showItem = false;
            } else if (itemPrice < min || itemPrice > max) {
                showItem = false;
            }
        }
        
        item.style.display = showItem ? 'block' : 'none';
    });
}

// Function to fetch artwork from Firestore
async function fetchArtwork() {
    try {
        const querySnapshot = await db.collection('artworks').get();
        const artworkData = {};
        
        // Process and filter documents client-side
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.inStock !== false) {  // Include if inStock is true or undefined
                artworkData[doc.id] = { 
                    id: doc.id, 
                    ...data,
                    // Ensure createdAt exists and is a Date object
                    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0)
                };
            }
        });
        
        // Sort by createdAt (newest first)
        const sortedArtworks = Object.values(artworkData)
            .sort((a, b) => b.createdAt - a.createdAt);
            
        // Convert back to object with IDs as keys
        return sortedArtworks.reduce((acc, artwork) => {
            acc[artwork.id] = artwork;
            return acc;
        }, {});
    } catch (error) {
        console.error('Error fetching artwork:', error);
        throw error;
    }
}

// Function to update the artwork display
function updateArtworkDisplay() {
    const artworkGrid = document.querySelector('.artwork-grid');
    if (!artworkGrid) return;
    
    artworkGrid.innerHTML = ''; // Clear existing content
    
    Object.values(artworkData).forEach(artwork => {
        const artworkElement = document.createElement('div');
        artworkElement.className = 'artwork-item';
        artworkElement.dataset.id = artwork.id;
        artworkElement.dataset.price = artwork.price;
        artworkElement.innerHTML = `
            <img src="${artwork.image}" alt="${artwork.title}">
            <h3>${artwork.title}</h3>
            <p class="price">$${artwork.price.toFixed(2)}</p>
            <button class="btn btn-primary add-to-cart" data-artwork-id="${artwork.id}">
                Add to Cart
            </button>
        `;
        artworkGrid.appendChild(artworkElement);
    });
    
    // Re-attach event listeners
    attachArtworkEventListeners();
}

// Load cart from localStorage
function loadCart() {
    try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            updateCartDisplay();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        showNotification('Error loading your cart', 'error');
    }
}

// Save cart to localStorage
function saveCart() {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    } catch (error) {
        console.error('Error saving cart:', error);
        showNotification('Error saving your cart', 'error');
    }
}

// Add item to cart
function addToCart(artworkId) {
    try {
        // Find the artwork in our local array
        const artwork = artworks.find(a => a.id === artworkId);
        if (!artwork) {
            console.error('Artwork not found:', artworkId);
            showNotification('Artwork not found', 'error');
            return;
        }
        
        // Check if item is already in cart
        const existingItem = cart.find(item => item.id === artworkId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: artwork.id,
                title: artwork.title,
                price: artwork.price,
                image: artwork.image,
                quantity: 1
            });
        }
        
        saveCart();
        showNotification(`${artwork.title} added to cart`, 'success');
        return true;
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add item to cart', 'error');
        return false;
    }
}

// Remove item from cart
function removeFromCart(artworkId) {
    try {
        const item = cart.find(item => item.id === artworkId);
        if (item) {
            cart = cart.filter(item => item.id !== artworkId);
            saveCart();
            showNotification(`${item.title} removed from cart`, 'success');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification('Failed to remove item from cart', 'error');
        return false;
    }
}

// Update item quantity
function updateQuantity(artworkId, newQuantity) {
    try {
        const item = cart.find(item => item.id === artworkId);
        if (item) {
            const quantity = parseInt(newQuantity, 10);
            if (isNaN(quantity) || quantity < 1) {
                throw new Error('Invalid quantity');
            }
            item.quantity = quantity;
            saveCart();
            return true;
        } else {
            return removeFromCart(artworkId);
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showNotification('Failed to update quantity', 'error');
        return false;
    }
}

// Calculate cart subtotal (before tax)
function calculateSubtotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Calculate tax amount (3.2%)
function calculateTax(subtotal) {
    return subtotal * 0.032; // 3.2% tax rate
}

// Calculate total (subtotal + tax)
function calculateTotal() {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.querySelector('.cart-items');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.querySelector('.cart-total');
    const cartSubtotal = document.querySelector('.cart-subtotal');
    
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart-message">
                    <p>Your cart is empty</p>
                    <a href="shop.html" class="continue-shopping">Continue Shopping</a>
                </div>`;
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.title}</h4>
                        <p class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                        <div class="cart-item-controls">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                                onchange="updateQuantity('${item.id}', this.value)">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                            <button class="remove-item" onclick="removeFromCart('${item.id}')" 
                                aria-label="Remove ${item.title}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Calculate amounts
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = calculateTotal();
    
    // Update display
    if (cartSubtotal) {
        cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    }
    
    // Update tax display
    const taxElement = document.querySelector('.cart-tax');
    if (taxElement) {
        taxElement.textContent = `$${tax.toFixed(2)}`;
    }
    
    if (cartTotal) {
        cartTotal.innerHTML = `
            <span>Total (includes tax):</span>
            <span>$${total.toFixed(2)}</span>
        `;
    }
}

// Toggle cart visibility
function toggleCart() {
    const cartPanel = document.querySelector('.cart-panel');
    const cartOverlay = document.querySelector('.cart-overlay');
    cartPanel.classList.toggle('active');
    cartOverlay.classList.toggle('active');
    document.body.style.overflow = cartPanel.classList.contains('active') ? 'hidden' : '';
}

// Clear cart
function clearCart() {
    cart = [];
    saveCart();
    updateCartDisplay();
    showNotification('Your cart has been cleared', 'success');
}

// Close cart
function closeCart() {
    document.querySelector('.cart-panel').classList.remove('active');
    document.querySelector('.cart-overlay').classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Remove the active class from the cart icon
    document.querySelector('.cart-icon').classList.remove('active');
}

// Checkout process
function checkout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        showNotification('Please sign in to checkout', 'error');
        return;
    }
    
    const order = {
        id: Date.now().toString(),
        userId: user.id,
        items: cart,
        total: calculateTotal(),
        status: 'pending',
        date: new Date().toISOString()
    };
    
    // Save order
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    saveCart();
    closeCart();
    
    showNotification('Order placed successfully!', 'success');
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Removed modal functionality as we're now using a dedicated login page



// Initialize shop page
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Shop page initialized');
        
        // Initialize Firebase
        onFirebaseReady();
        
        // Initialize artwork data (only runs once)
        initializeArtworkData();
        
        // Fetch artwork from Firestore
        fetchArtwork();
        
        // Initialize cart
        loadCart();
        
        // Toggle cart visibility
        const cartToggle = document.querySelector('.cart-toggle');
        if (cartToggle) {
            cartToggle.addEventListener('click', toggleCart);
        }
        
        // Close cart when clicking outside
        document.addEventListener('click', (e) => {
            const cartPanel = document.querySelector('.cart-panel');
            if (cartPanel && !cartPanel.contains(e.target) && !e.target.closest('.cart-toggle')) {
                closeCart();
            }
        });
        
        // Clear cart button with custom confirmation
        const clearCartBtn = document.querySelector('.clear-cart-button');
        const confirmDialog = document.getElementById('clearCartConfirm');
        const btnCancel = document.querySelector('.btn-cancel');
        const btnConfirm = document.querySelector('.btn-confirm');
        
        if (clearCartBtn && confirmDialog && btnCancel && btnConfirm) {
            // Show confirmation dialog
            clearCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (cart.length > 0) {
                    confirmDialog.classList.add('active');
                }
            });
            
            // Handle cancel
            btnCancel.addEventListener('click', () => {
                confirmDialog.classList.remove('active');
            });
            
            // Handle confirm
            btnConfirm.addEventListener('click', () => {
                confirmDialog.classList.remove('active');
                clearCart();
            });
            
            // Close when clicking outside
            confirmDialog.addEventListener('click', (e) => {
                if (e.target === confirmDialog) {
                    confirmDialog.classList.remove('active');
                }
            });
        }
        
        // Handle quantity changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                const artworkId = e.target.dataset.artworkId;
                const newQuantity = e.target.value;
                updateQuantity(artworkId, newQuantity);
            }
        });
        
        // Handle remove item clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item')) {
                e.preventDefault();
                const artworkId = e.target.dataset.artworkId;
                if (artworkId) {
                    removeFromCart(artworkId);
                }
            }
        });
        
        // Handle checkout
        const checkoutBtn = document.querySelector('.checkout-button');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                checkout();
            });
        }
    } catch (error) {
        console.error('Error initializing shop:', error);
        showNotification('Error initializing the shop', 'error');
    }
    
    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const artworkItem = e.target.closest('.artwork-item');
            const artwork = {
                id: artworkItem.dataset.id,
                title: artworkItem.querySelector('h3').textContent,
                price: parseFloat(artworkItem.dataset.price),
                image: artworkItem.querySelector('img').src
            };
            addToCart(artwork);
        });
    });
}); 