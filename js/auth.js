// Initialize Firebase Auth
const auth = firebase.auth();

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.email);
    } else {
        console.log('No user is signed in');
    }
});

// Make auth available globally
window.auth = auth; 