// Login functionality
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Login page loaded');
    
    // Get form elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const errorMessage = document.getElementById('loginErrorMessage');
    const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    
    // Check if required elements exist
    if (!loginForm || !emailInput || !passwordInput || !submitButton) {
        console.error('Required login form elements not found');
        return;
    }
    
    try {
        // Wait for auth service to be ready
        if (!window.authService) {
            console.log('Waiting for auth service...');
            await window.authServiceReady;
        }
        
        // Wait for auth service to be fully initialized
        await window.authService.authReady;
        
        // Check if user is already logged in
        const currentUser = await window.authService.getCurrentUser();
        if (currentUser) {
            console.log('User already logged in:', currentUser.email);
            const isAdmin = await window.authService.isAdmin();
            if (isAdmin) {
                window.location.replace('admin.html');
            } else {
                window.location.replace('shop.html');
            }
            return;
        }
        
        // Handle form submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.classList.add('btn-loading');
            if (errorMessage) {
                errorMessage.textContent = '';
                errorMessage.style.display = 'none';
            }
            
            try {
                const email = emailInput.value.trim();
                const password = passwordInput.value;
                
                // Sign in user
                const user = await window.authService.signIn(email, password);
                console.log('User signed in:', user.email);
                
                // Check if user is admin using auth service
                const isAdmin = await window.authService.isAdmin();
                console.log('User is admin:', isAdmin);
                
                // Get redirect URL from session storage
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                sessionStorage.removeItem('redirectAfterLogin');
                
                // Redirect based on admin status and stored redirect URL
                if (isAdmin) {
                    console.log('Redirecting to admin panel...');
                    window.location.replace('admin.html');
                } else {
                    console.log('Redirecting to shop...');
                    window.location.replace('shop.html');
                }
            } catch (error) {
                console.error('Login error:', error);
                if (errorMessage) {
                    errorMessage.textContent = window.authService.getAuthErrorMessage(error);
                    errorMessage.style.display = 'block';
                }
                submitButton.disabled = false;
                submitButton.classList.remove('btn-loading');
            }
        });
        
        // Handle registration form submission
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const fullName = document.getElementById('fullName').value;
                const errorElement = document.getElementById('registerErrorMessage');
                const submitButton = registerForm.querySelector('button[type="submit"]');
                
                // Show loading state
                submitButton.disabled = true;
                submitButton.classList.add('btn-loading');
                
                try {
                    // Create user with Firebase Auth
                    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;
                    
                    // Create user document in Firestore
                    const isAdmin = email === 'contact@seadonwhite.com';
                    await firebase.firestore().collection('users').doc(user.uid).set({
                        email: user.email,
                        fullName: fullName,
                        isAdmin: isAdmin,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    // Store user data in session storage
                    sessionStorage.setItem('currentUser', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        isAdmin: isAdmin
                    }));
                    
                    // Redirect based on user role
                    if (isAdmin) {
                        window.location.replace('admin.html');
                    } else {
                        window.location.replace('shop.html');
                    }
                } catch (error) {
                    console.error('Registration error:', error);
                    let errorMessage = 'Failed to create account';
                    
                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = 'An account with this email already exists';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'Invalid email address';
                    } else if (error.code === 'auth/weak-password') {
                        errorMessage = 'Password should be at least 6 characters';
                    }
                    
                    if (errorElement) {
                        errorElement.textContent = errorMessage;
                        errorElement.style.display = 'block';
                    } else {
                        alert(errorMessage);
                    }
                } finally {
                    // Reset button state
                    submitButton.disabled = false;
                    submitButton.classList.remove('btn-loading');
                }
            });
        }
    } catch (error) {
        console.error('Error initializing login page:', error);
        if (errorMessage) {
            errorMessage.textContent = 'Error initializing login page. Please refresh the page.';
            errorMessage.style.display = 'block';
        } else {
            alert('Error initializing login page. Please refresh the page.');
        }
    }
    
    // Handle forgot password
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail')?.value;
            
            if (!email) {
                const inputEmail = prompt('Please enter your email address:');
                if (!inputEmail) return;
                
                await sendPasswordResetEmail(inputEmail);
            } else {
                await sendPasswordResetEmail(email);
            }
        });
    }
});

// Helper function to send password reset email
async function sendPasswordResetEmail(email) {
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        alert('Password reset email sent! Please check your inbox.');
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send password reset email';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        }
        
        alert(errorMessage);
    }
} 