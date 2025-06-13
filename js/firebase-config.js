// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAsfpIslu7sI_RGvwkF37bE5mQO-pGBfM8",
    authDomain: "seadon-white-shop.firebaseapp.com",
    projectId: "seadon-white-shop",
    storageBucket: "seadon-white-shop.firebasestorage.app",
    messagingSenderId: "727101760413",
    appId: "1:727101760413:web:5ddabc4b0e480fc3e14574"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Make Firebase services available globally
window.db = db;
window.auth = auth;
window.storage = storage; 