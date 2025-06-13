// Navigation Toggle
document.addEventListener('DOMContentLoaded', () => {
    const navCircle = document.querySelector('.nav-circle');
    const navLinks = document.querySelector('.nav-links');
    const logoWrapper = document.querySelector('.logo-wrapper');

    // Function to toggle navigation
    function toggleNav(e) {
        if (!navCircle || !navLinks || !logoWrapper) return;
        
        e.stopPropagation();
        navCircle.classList.toggle('active');
        navLinks.classList.toggle('active');
        logoWrapper.classList.toggle('active');
        
        // Toggle aria-expanded attribute for accessibility
        const isExpanded = navCircle.getAttribute('aria-expanded') === 'true' || false;
        navCircle.setAttribute('aria-expanded', !isExpanded);
        
        // Toggle focus trap when navigation is open
        if (!isExpanded && navLinks) {
            navLinks.focus();
        }
    };
    
    // Only add event listeners if elements exist
    if (navCircle) {
        navCircle.addEventListener('click', toggleNav);
        
        // Initialize aria-expanded attribute
        navCircle.setAttribute('aria-expanded', 'false');
    }

    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
        if (navCircle && navLinks && !navCircle.contains(e.target)) {
            navLinks.classList.remove('active');
            navCircle.classList.remove('active');
        }
    });

    // Close nav when scrolling
    window.addEventListener('scroll', () => {
        if (navLinks && navCircle) {
            navLinks.classList.remove('active');
            navCircle.classList.remove('active');
        }
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        navLinks.style.display = 'none'; // Close mobile menu
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Parallax effect for gallery images
const galleryItems = document.querySelectorAll('.gallery-item');

window.addEventListener('scroll', () => {
    galleryItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        const scrollPosition = window.scrollY;
        
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            item.style.transform = `translateY(${scrollPosition * 0.1}px)`;
        }
    });
});

// Image hover effect with overlay
const galleryImages = document.querySelectorAll('.gallery-item');

galleryImages.forEach(image => {
    image.addEventListener('mouseenter', () => {
        const overlay = image.querySelector('.image-overlay');
        overlay.style.opacity = '1';
    });

    image.addEventListener('mouseleave', () => {
        const overlay = image.querySelector('.image-overlay');
        overlay.style.opacity = '0';
    });
});

// Add loading animation for images
const images = document.querySelectorAll('img');
images.forEach(img => {
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.5s ease-in';
    
    const loadImage = () => {
        img.style.opacity = '1';
    };
    
    if (img.complete) {
        loadImage();
    } else {
        img.addEventListener('load', loadImage);
    }
});

// Social media hover effects
document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
        const icon = link.querySelector('i');
        icon.style.transform = 'scale(1.2)';
    });

    link.addEventListener('mouseleave', () => {
        const icon = link.querySelector('i');
        icon.style.transform = 'scale(1)';
    });
});

// Add scroll animations for sections
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.section-title, .about-content, .contact-grid');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        
        if (elementTop < window.innerHeight && elementBottom > 0) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
};

window.addEventListener('scroll', animateOnScroll);

// Initialize animations
animateOnScroll();

// Sample user data (in a real application, this would be stored securely in a database)
const users = [
    {
        email: 'admin@seadonwhite.com',
        password: 'admin123',
        fullName: 'Admin User',
        role: 'admin'
    },
    {
        email: 'customer@example.com',
        password: 'customer123',
        fullName: 'John Customer',
        role: 'customer'
    }
];

// Store the current user in localStorage
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Get the current user from localStorage
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Check if user is admin
function isAdmin() {
    return window.authService ? window.authService.isAdmin() : false;
}

// Initialize auth service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.authService) {
        window.authService.initialize();
        console.log('AuthService initialized successfully');
    } else {
        console.error('AuthService not found. Make sure auth-service.js is loaded before script.js');
    }
});

// Handle login form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    // Check if user is already logged in
    const unsubscribe = window.authService?.onAuthStateChanged?.((user) => {
        if (user) {
            // Get the current user from auth service to ensure we have the latest data
            const currentUser = authService.getCurrentUser();
            if (!currentUser) return;
            
            // If we're on the login page, redirect based on role
            if (window.location.pathname.endsWith('login.html')) {
                const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
                
                if (redirectAfterLogin) {
                    sessionStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectAfterLogin;
                } else if (currentUser.isAdmin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'shop.html';
                }
            }
        } else if (!window.location.pathname.endsWith('login.html') && 
                 !window.location.pathname.endsWith('register.html') &&
                 !window.location.pathname.endsWith('forgot-password.html')) {
            // If not on auth pages and user is not logged in, redirect to login
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = 'login.html';
        }
    });

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorElement = document.getElementById('loginErrorMessage');
        const submitButton = loginForm.querySelector('button[type="submit"]');
        
        console.log('Login form submitted for email:', email);
        
        // Show loading state
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing in...';
        
        // Clear previous errors
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        try {
            console.log('Calling authService.signIn');
            // Sign in using auth service
            const result = await authService.signIn(email, password);
            console.log('Sign in result:', result);
            
            if (result.success) {
                console.log('Sign in successful, waiting for auth state to update...');
                
                // Wait for auth state to be fully updated
                await new Promise((resolve, reject) => {
                    let resolved = false;
                    
                    const timeout = setTimeout(() => {
                        if (!resolved) {
                            console.log('Auth state update timeout reached');
                            resolved = true;
                            resolve();
                        }
                    }, 5000);
                    
                    console.log('Setting up auth state listener');
                    const unsubscribe = authService.onAuthStateChanged((user) => {
                        console.log('Auth state changed in login handler, user:', user ? user.uid : 'signed out');
                        if (user && user.uid === result.user?.uid && !resolved) {
                            console.log('Auth state updated for logged in user');
                            resolved = true;
                            clearTimeout(timeout);
                            unsubscribe();
                            resolve();
                        }
                    });
                });
                
                // Get the current user after auth state is updated
                const currentUser = authService.getCurrentUser();
                console.log('Current user after auth state update:', currentUser);
                
                if (!currentUser) {
                    throw new Error('Failed to get user data after sign in');
                }
                
                // Redirect based on user role and stored redirect URL
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                console.log('Redirect URL from sessionStorage:', redirectUrl);
                
                if (redirectUrl) {
                    console.log('Redirecting to stored URL:', redirectUrl);
                    sessionStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectUrl;
                } else if (currentUser.isAdmin) {
                    console.log('User is admin, redirecting to admin panel');
                    window.location.href = 'admin.html';
                } else {
                    console.log('User is not admin, redirecting to shop');
                    window.location.href = 'shop.html';
                }
            } else {
                // Show error message
                const errorMsg = result.error || 'Invalid email or password';
                console.error('Login failed:', errorMsg);
                
                if (errorElement) {
                    errorElement.textContent = errorMsg;
                    errorElement.style.display = 'block';
                } else {
                    alert(errorMsg);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMsg = error.message || 'An error occurred. Please try again.';
            
            if (errorElement) {
                errorElement.textContent = errorMsg;
                errorElement.style.display = 'block';
            } else {
                alert(errorMsg);
            }
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
}

// Handle registration form submission
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const displayName = document.getElementById('fullName').value;
        const errorElement = document.getElementById('registerErrorMessage');
        const submitButton = registerForm.querySelector('button[type="submit"]');
        
        // Show loading state
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating account...';
        
        // Clear previous errors
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        // Validate form
        if (password !== confirmPassword) {
            if (errorElement) {
                errorElement.textContent = 'Passwords do not match.';
                errorElement.style.display = 'block';
            } else {
                alert('Passwords do not match.');
            }
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            return;
        }
        
        try {
            // Sign up using auth service
            const result = await authService.signUp(email, password, displayName);
            
            if (result.success) {
                // Show success message and switch to login tab
                if (result.message) {
                    alert(result.message);
                }
                
                // Switch to login tab
                const loginTab = document.getElementById('login-tab');
                if (loginTab) {
                    const tab = new bootstrap.Tab(loginTab);
                    tab.show();
                }
                
                // Clear form
                registerForm.reset();
            } else {
                // Show error message
                if (errorElement) {
                    errorElement.textContent = result.error;
                    errorElement.style.display = 'block';
                } else {
                    alert(result.error);
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            if (errorElement) {
                errorElement.textContent = 'An unexpected error occurred. Please try again.';
                errorElement.style.display = 'block';
            } else {
                alert('An unexpected error occurred. Please try again.');
            }
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
}

// Handle forgot password
const forgotPasswordLink = document.getElementById('forgotPassword');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail')?.value;
        
        if (!email) {
            const inputEmail = prompt('Please enter your email address:');
            if (!inputEmail) return; // User cancelled
            
            await sendPasswordResetEmail(inputEmail);
        } else {
            await sendPasswordResetEmail(email);
        }
    });
}

// Helper function to send password reset email
async function sendPasswordResetEmail(email) {
    try {
        await authService.sendPasswordResetEmail(email);
        alert('Password reset email sent! Please check your inbox.');
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send password reset email. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No user found with this email address.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many attempts. Please try again later.';
        }
        
        alert(errorMessage);
    }
}

// Handle tab switching to clear errors
const authTabs = document.querySelectorAll('#authTabs button[data-bs-toggle="tab"]');
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Clear error messages when switching tabs
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(el => {
            el.style.display = 'none';
        });
    });
});

// Check authentication on protected pages
async function checkAuth() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // List of protected pages
    const protectedPages = ['admin.html', 'shop.html'];
    
    if (protectedPages.includes(currentPage)) {
        // Wait for auth service to initialize
        await new Promise(resolve => {
            const unsubscribe = authService.onAuthStateChanged(user => {
                if (user) {
                    // User is signed in
                    if (currentPage === 'admin.html' && !user.isAdmin) {
                        // Redirect non-admin users away from admin page
                        if (window.location.pathname.endsWith('admin.html')) {
                            window.location.href = 'shop.html';
                        }
                    }
                } else {
                    // User is not signed in, redirect to login
                    if (window.location.pathname.endsWith('login.html')) {
                        // Already on login page, no need to redirect
                        return;
                    }
                    // Store the current URL to redirect back after login
                    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                    window.location.href = 'login.html';
                }
                resolve();
            });
            
            // Set a timeout to prevent infinite waiting
            setTimeout(resolve, 2000);
        });
    }
}

// Call checkAuth when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
} else {
    checkAuth();
}

// Add logout functionality
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Add logout button to navigation if user is logged in
function updateNavigation() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && isLoggedIn()) {
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.className = 'nav-link';
        logoutLink.textContent = 'Logout';
        logoutLink.onclick = function(e) {
            e.preventDefault();
            logout();
        };
        navLinks.appendChild(logoutLink);
    }
}

// Sample artwork data
let artworks = [
    {
        id: 1,
        title: 'Abstract Dreams',
        price: 1200,
        category: 'Abstract',
        image: 'artwork1.jpg',
        description: 'A vibrant abstract piece exploring dreams and consciousness.',
        inStock: true
    },
    {
        id: 2,
        title: 'Ocean Waves',
        price: 850,
        category: 'Landscape',
        image: 'artwork2.jpg',
        description: 'A serene ocean landscape capturing the beauty of waves.',
        inStock: true
    },
    {
        id: 3,
        title: 'Mountain View',
        price: 1500,
        category: 'Landscape',
        image: 'artwork3.jpg',
        description: 'Majestic mountain landscape with dramatic lighting.',
        inStock: true
    }
];

// Sample orders data
let orders = [
    {
        id: 'ORD-001',
        customer: 'John Doe',
        artwork: 'Abstract Dreams',
        amount: 1200,
        status: 'pending',
        date: '2024-03-15'
    },
    {
        id: 'ORD-002',
        customer: 'Jane Smith',
        artwork: 'Ocean Waves',
        amount: 850,
        status: 'completed',
        date: '2024-03-14'
    },
    {
        id: 'ORD-003',
        customer: 'Mike Johnson',
        artwork: 'Mountain View',
        amount: 1500,
        status: 'processing',
        date: '2024-03-13'
    }
];

// Store data in localStorage
function saveData() {
    localStorage.setItem('artworks', JSON.stringify(artworks));
    localStorage.setItem('orders', JSON.stringify(orders));
}

// Load data from localStorage
function loadData() {
    const savedArtworks = localStorage.getItem('artworks');
    const savedOrders = localStorage.getItem('orders');
    
    if (savedArtworks) artworks = JSON.parse(savedArtworks);
    if (savedOrders) orders = JSON.parse(savedOrders);
}

// Add new artwork
function addArtwork(artwork) {
    artwork.id = artworks.length + 1;
    artworks.push(artwork);
    saveData();
    updateArtworkDisplay();
}

// Update artwork
function updateArtwork(artwork) {
    const index = artworks.findIndex(a => a.id === artwork.id);
    if (index !== -1) {
        artworks[index] = artwork;
        saveData();
        updateArtworkDisplay();
    }
}

// Delete artwork
function deleteArtwork(id) {
    artworks = artworks.filter(a => a.id !== id);
    saveData();
    updateArtworkDisplay();
}

// Update order status
function updateOrderStatus(orderId, status) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        saveData();
        updateOrdersDisplay();
    }
}

// Handle add artwork form
const addArtworkForm = document.getElementById('addArtworkForm');
if (addArtworkForm) {
    addArtworkForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const artwork = {
            title: document.getElementById('artworkTitle').value,
            price: parseFloat(document.getElementById('artworkPrice').value),
            category: document.getElementById('artworkCategory').value,
            image: document.getElementById('artworkImage').value,
            description: document.getElementById('artworkDescription').value,
            inStock: true
        };
        
        addArtwork(artwork);
        addArtworkForm.reset();
    });
}

// Update artwork display in admin dashboard
function updateArtworkDisplay() {
    const artworkTable = document.getElementById('artworkTable');
    if (artworkTable) {
        const tbody = artworkTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        artworks.forEach(artwork => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${artwork.title}</td>
                <td>${artwork.category}</td>
                <td>$${artwork.price}</td>
                <td>${artwork.inStock ? 'In Stock' : 'Out of Stock'}</td>
                <td>
                    <button class="action-button view" onclick="viewArtwork(${artwork.id})">View</button>
                    <button class="action-button edit" onclick="editArtwork(${artwork.id})">Edit</button>
                    <button class="action-button delete" onclick="deleteArtwork(${artwork.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Update orders display in admin dashboard
function updateOrdersDisplay() {
    const ordersTable = document.querySelector('.admin-table');
    if (ordersTable) {
        const tbody = ordersTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.artwork}</td>
                <td>$${order.amount}</td>
                <td><span class="status ${order.status}">${order.status}</span></td>
                <td>
                    <button class="action-button view" onclick="viewOrder('${order.id}')">View</button>
                    ${order.status === 'pending' ? 
                        `<button class="action-button fulfill" onclick="fulfillOrder('${order.id}')">Fulfill</button>` :
                        `<button class="action-button fulfilled" disabled>Fulfilled</button>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Update shop page with artwork
function updateShopDisplay() {
    const shopGrid = document.querySelector('.shop-grid');
    if (shopGrid) {
        shopGrid.innerHTML = '';
        
        artworks.forEach(artwork => {
            const artworkCard = document.createElement('div');
            artworkCard.className = 'artwork-card';
            artworkCard.innerHTML = `
                <img src="${artwork.image}" alt="${artwork.title}" class="artwork-image">
                <div class="artwork-info">
                    <h3>${artwork.title}</h3>
                    <p class="artwork-category">${artwork.category}</p>
                    <p class="artwork-price">$${artwork.price}</p>
                    <button class="add-to-cart-button" onclick="addToCart(${JSON.stringify(artwork)})">
                        Add to Cart
                    </button>
                </div>
            `;
            shopGrid.appendChild(artworkCard);
        });
    }
}

// View artwork details
function viewArtwork(id) {
    const artwork = artworks.find(a => a.id === id);
    if (artwork) {
        alert(`
            Title: ${artwork.title}
            Category: ${artwork.category}
            Price: $${artwork.price}
            Description: ${artwork.description}
            Status: ${artwork.inStock ? 'In Stock' : 'Out of Stock'}
        `);
    }
}

// Edit artwork
function editArtwork(id) {
    const artwork = artworks.find(a => a.id === id);
    if (artwork) {
        const newTitle = prompt('Enter new title:', artwork.title);
        const newPrice = prompt('Enter new price:', artwork.price);
        const newCategory = prompt('Enter new category:', artwork.category);
        
        if (newTitle && newPrice && newCategory) {
            updateArtwork({
                ...artwork,
                title: newTitle,
                price: parseFloat(newPrice),
                category: newCategory
            });
        }
    }
}

// View order details
function viewOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        alert(`
            Order ID: ${order.id}
            Customer: ${order.customer}
            Artwork: ${order.artwork}
            Amount: $${order.amount}
            Status: ${order.status}
            Date: ${order.date}
        `);
    }
}

// Fulfill order
function fulfillOrder(orderId) {
    if (confirm('Are you sure you want to mark this order as fulfilled?')) {
        updateOrderStatus(orderId, 'completed');
    }
}

// Initialize admin dashboard
function initAdminDashboard() {
    if (document.querySelector('.admin-section')) {
        loadData();
        updateArtworkDisplay();
        updateOrdersDisplay();
    }
}

// Initialize shop page
function initShopPage() {
    if (document.querySelector('.shop-section')) {
        loadData();
        updateShopDisplay();
    }
}

// Shop functionality
function initializeShop() {
    // Check if we're on the shop page
    if (!document.querySelector('.shop-section')) {
        return;
    }

    const artworkGrid = document.getElementById('artworkGrid');
    const categoryFilter = document.getElementById('category');
    const sortFilter = document.getElementById('sort');
    const cartToggle = document.getElementById('cartToggle');
    const cartContainer = document.getElementById('cartContainer');
    const closeCart = document.getElementById('closeCart');
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutButton = document.getElementById('checkoutButton');
    const signInButton = document.getElementById('signInButton');

    let cart = [];
    let currentPage = 1;
    const itemsPerPage = 8;

    // Sample artwork data (replace with your actual data)
    const artwork = [
        {
            id: 1,
            title: "Abstract Harmony",
            category: "paintings",
            price: 1200,
            image: "path/to/artwork1.jpg"
        },
        {
            id: 2,
            title: "Digital Dreams",
            category: "digital",
            price: 800,
            image: "path/to/artwork2.jpg"
        },
        {
            id: 3,
            title: "Nature's Sketch",
            category: "drawings",
            price: 600,
            image: "path/to/artwork3.jpg"
        }
    ];

    // Initialize cart display
    function initCartDisplay() {
        if (!cartItems) return;
        cartItems.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.title}">
                <div class="cart-item-details">
                    <h4>${item.title}</h4>
                    <p>$${item.price.toFixed(2)}</p>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="removeFromCart(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            cartItems.appendChild(itemElement);
            total += item.price * item.quantity;
        });

        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    // Add to cart
    window.addToCart = function(artwork) {
        const existingItem = cart.find(item => item.id === artwork.id);
        if (existingItem) {
            existingItem.quantity++;
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
        updateCartDisplay();
        showNotification('Item added to cart');
    };

    // Remove from cart
    window.removeFromCart = function(index) {
        cart.splice(index, 1);
        saveCart();
        updateCartDisplay();
        showNotification('Item removed from cart');
    };

    // Update quantity
    window.updateQuantity = function(index, change) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            removeFromCart(index);
        } else {
            saveCart();
            updateCartDisplay();
        }
    };

    // Toggle cart visibility
    function toggleCart() {
        cartContainer.classList.toggle('active');
    }

    // Handle checkout
    function handleCheckout() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            showNotification('Please sign in to checkout', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        if (cart.length === 0) {
            showNotification('Your cart is empty', 'error');
            return;
        }

        // Process order
        const order = {
            id: Date.now(),
            userId: user.id,
            items: cart,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
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
        updateCartDisplay();
        toggleCart();
        showNotification('Order placed successfully!');
    }

    // Display artwork
    function displayArtwork(artwork) {
        const artworkElement = document.createElement('div');
        artworkElement.className = 'artwork-item';
        artworkElement.innerHTML = `
            <div class="artwork-image">
                <img src="${artwork.image}" alt="${artwork.title}">
            </div>
            <div class="artwork-details">
                <h3>${artwork.title}</h3>
                <p class="artwork-category">${artwork.category}</p>
                <p class="artwork-price">$${artwork.price.toFixed(2)}</p>
                <button class="add-to-cart-btn" onclick="addToCart(${JSON.stringify(artwork)})">
                    Add to Cart
                </button>
            </div>
        `;
        return artworkElement;
    }

    // Filter and sort artwork
    function filterAndSortArtwork() {
        const category = categoryFilter.value;
        const sort = sortFilter.value;
        let filteredArtwork = [...artwork];

        if (category !== 'all') {
            filteredArtwork = filteredArtwork.filter(item => item.category === category);
        }

        switch (sort) {
            case 'price-low':
                filteredArtwork.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredArtwork.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                filteredArtwork.sort((a, b) => b.id - a.id);
                break;
        }

        return filteredArtwork;
    }

    // Update pagination
    function updatePagination(filteredArtwork) {
        const totalPages = Math.ceil(filteredArtwork.length / itemsPerPage);
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('currentPage').textContent = currentPage;
    }

    // Display current page
    function displayCurrentPage() {
        const filteredArtwork = filterAndSortArtwork();
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentItems = filteredArtwork.slice(start, end);

        artworkGrid.innerHTML = '';
        currentItems.forEach(artwork => {
            artworkGrid.appendChild(displayArtwork(artwork));
        });

        updatePagination(filteredArtwork);
    }

    // Event listeners
    categoryFilter.addEventListener('change', () => {
        currentPage = 1;
        displayCurrentPage();
    });

    sortFilter.addEventListener('change', () => {
        currentPage = 1;
        displayCurrentPage();
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayCurrentPage();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const filteredArtwork = filterAndSortArtwork();
        const totalPages = Math.ceil(filteredArtwork.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayCurrentPage();
        }
    });

    cartToggle.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    checkoutButton.addEventListener('click', handleCheckout);

    // Initialize
    loadCart();
    displayCurrentPage();
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Cart related functions
let cart = [];

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update item quantity in cart
function updateQuantity(index, change) {
    if (index < 0 || index >= cart.length) return;
    
    cart[index].quantity += change;
    
    // Remove item if quantity is 0 or less
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    // Save and update display
    saveCart();
    updateCartDisplay();
}

// Remove item from cart
function removeFromCart(index) {
    if (index < 0 || index >= cart.length) return;
    
    cart.splice(index, 1);
    
    // Save and update display
    saveCart();
    updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;
    
    cartItems.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-muted text-center py-3">Your cart is empty</p>';
        return;
    }
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * (item.quantity || 1);
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item d-flex align-items-center mb-3';
        itemElement.innerHTML = `
            <img src="${item.image || 'path/to/default-image.jpg'}" alt="${item.name}" class="cart-item-img me-3" style="width: 60px; height: 60px; object-fit: cover;">
            <div class="flex-grow-1">
                <h6 class="mb-1">${item.name}</h6>
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-outline-secondary me-2" onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="me-2">${item.quantity || 1}</span>
                    <button class="btn btn-sm btn-outline-secondary me-3" onclick="updateQuantity(${index}, 1)">+</button>
                    <span class="ms-auto fw-bold">$${itemTotal.toFixed(2)}</span>
                </div>
            </div>
            <button class="btn btn-link text-danger" onclick="removeFromCart(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        cartItems.appendChild(itemElement);
    });
    
    // Update total
    const cartTotal = document.getElementById('cart-total');
    if (cartTotal) {
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
}

// Initialize shop when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeShop);

// Update initialization
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    updateNavigation();
    initAdminDashboard();
    initShopPage();
    loadCart();
    updateCartDisplay();
});
