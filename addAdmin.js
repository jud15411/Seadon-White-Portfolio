// Run this script in your browser's console while on your website
// Make sure you're signed in as the user you want to make an admin

// Get the current user
const user = firebase.auth().currentUser;

if (!user) {
    console.error('No user is signed in. Please sign in first.');
} else {
    console.log('Adding admin role for user:', user.email);
    
    // Add admin role to the user in Firestore
    firebase.firestore().collection('admins').doc(user.uid).set({
        email: user.email,
        isAdmin: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Successfully added admin role for:', user.email);
        alert('Admin role added successfully!');
    })
    .catch((error) => {
        console.error('Error adding admin role:', error);
        alert('Error adding admin role: ' + error.message);
    });
}
