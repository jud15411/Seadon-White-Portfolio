// Auth Service - Centralized authentication management

class AuthService {
    constructor() {
        // Wait for Firebase to be initialized
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded');
        }
        
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
        this.initialized = false;
        this.authStateListeners = [];
        
        // Create a promise that resolves when auth is ready
        this.authReady = new Promise((resolve) => {
            this._resolveAuthReady = resolve;
        });
        
        // Set up auth state listener
        this.setupAuthStateListener();
    }
    
    async setupAuthStateListener() {
        console.log('Setting up auth state listener...');
        this.auth.onAuthStateChanged(async (user) => {
            console.log('Auth state changed:', user ? {
                uid: user.uid,
                email: user.email
            } : 'No user');
            
            if (user) {
                try {
                    // Get user data from Firestore
                    const userDoc = await this.db.collection('users').doc(user.uid).get();
                    
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        // Set admin status based on email only
                        const isAdmin = user.email === 'contact@seadonwhite.com';
                        this.currentUser = {
                            ...user,
                            ...userData,
                            isAdmin: isAdmin
                        };
                        console.log('User data loaded from Firestore:', this.currentUser);
                    } else {
                        // Create user document if it doesn't exist
                        const isAdmin = user.email === 'contact@seadonwhite.com';
                        const userData = {
                            email: user.email,
                            isAdmin: isAdmin,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        };
                        
                        await this.db.collection('users').doc(user.uid).set(userData);
                        this.currentUser = {
                            ...user,
                            ...userData
                        };
                        console.log('New user document created:', this.currentUser);
                    }
                } catch (error) {
                    console.error('Error handling user data:', error);
                    this.currentUser = null;
                }
            } else {
                this.currentUser = null;
            }
            
            // Mark service as initialized and resolve the promise
            if (!this.initialized) {
                this.initialized = true;
                this._resolveAuthReady();
            }
            
            // Notify all listeners
            this.notifyAuthStateChange();
        });
    }
    
    // Initialize is kept for backward compatibility but does nothing
    initialize() {
        console.log('AuthService.initialize() called, but already initialized');
        return this.authReady;
    }

    // Add auth state change listener
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        // Return unsubscribe function
        return () => {
            this.authStateListeners = this.authStateListeners.filter(cb => cb !== callback);
        };
    }

    // Notify all listeners of auth state change
    notifyAuthStateChange() {
        this.authStateListeners.forEach(callback => {
            try {
                callback(this.currentUser);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    // Sign out
    async signOut() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    // Get error message from Firebase error
    getAuthErrorMessage(error) {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'Invalid email or password';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/email-already-in-use':
                return 'This email is already in use.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            default:
                return error.message || 'An error occurred. Please try again.';
        }
    }

    // Check if current user is admin
    async isAdmin() {
        await this.authReady;
        if (!this.currentUser) return false;
        
        // Check admin status using email only
        const isAdmin = this.currentUser.email === 'contact@seadonwhite.com';
        console.log('Admin check:', {
            email: this.currentUser.email,
            isAdmin: isAdmin
        });
        
        return isAdmin;
    }

    // Get current user
    async getCurrentUser() {
        await this.authReady;
        return this.currentUser;
    }
}

// Auth service initialization
let authService;

// Create a promise that resolves when auth service is ready
window.authServiceReady = new Promise((resolve) => {
    // Function to check Firebase and initialize auth service
    const initializeAuthService = () => {
        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
            console.log('Firebase found and initialized, creating auth service...');
            
            try {
                // Create auth service instance
                authService = new AuthService();
                window.authService = authService;
                
                // Resolve the promise
                resolve(authService);
                console.log('Auth service initialized');
            } catch (error) {
                console.error('Error creating auth service:', error);
                // Try again in 100ms
                setTimeout(initializeAuthService, 100);
            }
        } else if (window.firebase) {
            console.log('Firebase found but not initialized, initializing...');
            
            // Initialize Firebase only if it hasn't been initialized
            if (!firebase.apps.length) {
                firebase.initializeApp({
                    apiKey: "AIzaSyAsfpIslu7sI_RGvwkF37bE5mQO-pGBfM8",
                    authDomain: "seadon-white-shop.firebaseapp.com",
                    projectId: "seadon-white-shop",
                    storageBucket: "seadon-white-shop.appspot.com",
                    messagingSenderId: "727101760413",
                    appId: "1:727101760413:web:5ddabc4b0e480fc3e14574"
                });
            }
            
            // Try again in 100ms
            setTimeout(initializeAuthService, 100);
        } else {
            // Try again in 100ms
            setTimeout(initializeAuthService, 100);
        }
    };
    
    // Start checking for Firebase
    initializeAuthService();
});
