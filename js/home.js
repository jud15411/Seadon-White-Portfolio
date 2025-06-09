// Log script loading
console.log('home.js script loaded');

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error || event.message, event.filename, 'line:', event.lineno);
    
    // Show error to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ff4444; color: white; padding: 15px; border-radius: 5px; z-index: 10000; max-width: 80%; text-align: center;';
    errorDiv.textContent = 'An error occurred. Please check the console for details.';
    document.body.appendChild(errorDiv);
    
    // Remove after 10 seconds
    setTimeout(() => errorDiv.remove(), 10000);
});

// Check if Firebase is available
if (typeof firebase === 'undefined') {
    console.error('Firebase is not loaded! Make sure the Firebase scripts are included before this file.');
    throw new Error('Firebase is not loaded');
}

console.log('Firebase version:', firebase.SDK_VERSION);

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
let app;
let db;

async function initializeApp() {
    try {
        console.log('Initializing Firebase with config:', JSON.stringify({
            ...firebaseConfig,
            apiKey: '...' + firebaseConfig.apiKey.slice(-4)
        }));

        if (!firebase.apps.length) {
            console.log('Creating new Firebase app instance');
            app = firebase.initializeApp(firebaseConfig);
        } else {
            console.log('Using existing Firebase app instance');
            app = firebase.app();
        }
        
        // Initialize Firestore
        db = firebase.firestore();
        
        // Try to enable persistence (will fail in some browsers or if multiple tabs are open)
        try {
            await db.enablePersistence({
                experimentalForceOwningTab: true,
                cache: { type: 'persistent' }
            });
            console.log('Offline persistence enabled');
        } catch (persistenceError) {
            if (persistenceError.code === 'failed-precondition') {
                console.warn('Persistence can only be enabled in one tab at a time.');
            } else if (persistenceError.code === 'unimplemented') {
                console.warn('The current browser does not support offline persistence.');
            } else {
                console.warn('Error enabling offline persistence:', persistenceError);
            }
        }
        
        // Test the connection
        const snapshot = await db.collection('artworks').limit(1).get();
        console.log('Firestore connection test successful');
        
        return true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        throw error;
    }
}

// Function to fetch featured artworks
async function loadFeaturedArtworks() {
    const featuredGrid = document.getElementById('featured-grid');
    
    try {
        console.log('Loading featured artworks...');
        
        // Show loading state
        featuredGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading featured artworks...</p>
            </div>
        `;
        
        // First, get all artworks to debug
        console.log('Querying all artworks to check their structure...');
        const allArtworks = await db.collection('artworks').limit(10).get();
        
        if (allArtworks.empty) {
            console.log('No artworks found in the database at all');
        } else {
            console.log(`Found ${allArtworks.size} total artworks in the database`);
            console.log('Sample of all artworks:');
            allArtworks.docs.slice(0, 5).forEach((doc, index) => {
                const data = doc.data();
                console.log(`Artwork ${index + 1}:`, {
                    id: doc.id,
                    title: data.title || 'No title',
                    featured: data.featured,
                    hasImage: !!data.imageUrl,
                    imageUrl: data.imageUrl ? 'URL present' : 'MISSING',
                    medium: data.medium || 'Not specified',
                    year: data.year || 'Not specified',
                    // Log all fields to see what's actually there
                    allFields: Object.keys(data)
                });
            });
        }
        
        // Query for isFeatured = true
        console.log('Querying for isFeatured = true...');
        let querySnapshot = await db.collection('artworks')
            .where('isFeatured', '==', true)
            .get();
            
        console.log(`Found ${querySnapshot.size} artworks with isFeatured=true`);
        
        // If none found, try with string 'true' as a fallback
        if (querySnapshot.empty) {
            console.log('Trying with isFeatured="true"...');
            querySnapshot = await db.collection('artworks')
                .where('isFeatured', '==', 'true')
                .get();
            console.log(`Found ${querySnapshot.size} artworks with isFeatured='true' (string)`);
        }
        
        // Clear loading spinner
        featuredGrid.innerHTML = '';
        
        // Log if we found artworks but they might have issues
        if (!querySnapshot || querySnapshot.empty) {
            console.log('No featured artworks found in the database');
            featuredGrid.innerHTML = '<p class="no-artworks">No featured artworks available at the moment.</p>';
            return;
        }
        
        console.log(`Found ${querySnapshot.size} featured artworks`);
        
        if (querySnapshot.empty) {
            featuredGrid.innerHTML = '<p class="no-artworks">No featured artworks available at the moment.</p>';
            return;
        }
        
        // Process each featured artwork
        querySnapshot.forEach((doc) => {
            const artwork = doc.data();
            const artworkId = doc.id;
            
            // Create artwork element
            const artworkElement = document.createElement('div');
            artworkElement.className = 'artwork-card';
            // Prepare the description, truncating if too long
            let description = '';
            if (artwork.description) {
                description = artwork.description.length > 150 
                    ? artwork.description.substring(0, 150) + '...' 
                    : artwork.description;
            }
            
            artworkElement.innerHTML = `
                <div class="artwork-image-container">
                    <img src="${artwork.imageUrl}" alt="${artwork.title || 'Artwork'}" class="artwork-image">
                    <div class="artwork-overlay">
                        <div class="overlay-content">
                            <h3>${artwork.title || 'Untitled'}</h3>
                            <p class="artwork-meta">
                                ${artwork.medium || ''} ${artwork.year ? `(${artwork.year})` : ''}
                            </p>
                            ${description ? `<p class="artwork-description">${description}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // Add click handler to open artwork in gallery
            artworkElement.addEventListener('click', () => {
                window.location.href = `gallery.html?artwork=${artworkId}`;
            });
            
            featuredGrid.appendChild(artworkElement);
        });
        
    } catch (error) {
        console.error('Error loading featured artworks:', error);
        featuredGrid.innerHTML = `
            <div class="error-message">
                <p>Failed to load featured artworks. Please try again later.</p>
                <button id="retry-button" class="cta-button">Retry</button>
            </div>
        `;
        
        // Add retry button handler
        document.getElementById('retry-button').addEventListener('click', loadFeaturedArtworks);
    }
}

// Audio Player
class AudioPlayer {
    constructor() {
        console.log('Initializing AudioPlayer...');
        this.audio = new Audio();
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 0.5;
        
        // Set initial volume
        this.audio.volume = this.volume;
        console.log('Initial volume set to:', this.volume);
        
        // Loop the audio
        this.audio.loop = true;

        // Add error handling
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            console.error('Error code:', e.target.error.code);
            console.error('Error message:', e.target.error.message);
        });

        this.audio.addEventListener('canplay', () => {
            console.log('Audio can play now');
            // Try to play automatically when ready
            this.tryPlay();
        });

        this.audio.addEventListener('loadeddata', () => {
            console.log('Audio data loaded');
        });

        this.audio.addEventListener('loadstart', () => {
            console.log('Audio loading started');
        });

        this.audio.addEventListener('progress', () => {
            console.log('Audio loading progress');
        });

        this.audio.addEventListener('playing', () => {
            console.log('Audio is now playing');
            this.isPlaying = true;
            this.updateMuteButton();
        });

        this.audio.addEventListener('pause', () => {
            console.log('Audio is paused');
            this.isPlaying = false;
            this.updateMuteButton();
        });
        
        // Initialize the player
        this.init();
    }
    
    init() {
        console.log('Setting up audio source...');
        // Set the audio source with the correct path
        const audioPath = '/Music/Charlie Lewis - But I Don\'t Know.mp3';
        console.log('Loading audio from:', audioPath);
        
        // First try to load the audio
        this.audio.addEventListener('loadstart', () => {
            console.log('Audio loading started');
        });

        this.audio.addEventListener('canplaythrough', () => {
            console.log('Audio can play through without buffering');
            // Try to play when fully loaded
            this.tryPlay();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Error loading audio:', e);
            // Try alternative path if first attempt fails
            if (this.audio.src === audioPath) {
                console.log('Trying alternative path...');
                this.audio.src = './Music/Charlie Lewis - But I Don\'t Know.mp3';
            }
        });

        this.audio.src = audioPath;
        
        // Add mute button to navigation
        this.addMuteButtonToNav();
        
        // Try to play on any user interaction
        const playOnInteraction = () => {
            console.log('User interaction detected');
            this.tryPlay();
            // Remove the event listener after first interaction
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
        };

        // Add event listeners for user interaction
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('touchstart', playOnInteraction);
    }
    
    tryPlay() {
        if (!this.isPlaying) {
            console.log('Attempting to play audio...');
            const playPromise = this.audio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Audio playing successfully');
                        this.isPlaying = true;
                        this.updateMuteButton();
                    })
                    .catch(error => {
                        console.error('Error playing audio:', error);
                        console.error('Error name:', error.name);
                        console.error('Error message:', error.message);
                        // Try to play again after a short delay
                        setTimeout(() => {
                            console.log('Retrying playback...');
                            this.tryPlay();
                        }, 1000);
                    });
            }
        }
    }
    
    addMuteButtonToNav() {
        console.log('Adding mute button to navigation...');
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) {
            console.error('Navigation links container not found');
            return;
        }

        // Create mute button container
        const muteButtonContainer = document.createElement('div');
        muteButtonContainer.className = 'nav-link mute-button-container';
        
        // Create mute button
        const muteButton = document.createElement('button');
        muteButton.className = 'mute-button';
        muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        muteButton.title = 'Toggle Sound';
        
        // Add click handler
        muteButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMute();
        });
        
        // Add to navigation
        muteButtonContainer.appendChild(muteButton);
        navLinks.appendChild(muteButtonContainer);
        
        console.log('Mute button added to navigation');
    }
    
    toggleMute() {
        console.log('Toggling mute state');
        if (this.isMuted) {
            this.audio.volume = this.volume;
            this.isMuted = false;
            console.log('Unmuted, volume set to:', this.volume);
        } else {
            this.audio.volume = 0;
            this.isMuted = true;
            console.log('Muted');
        }
        this.updateMuteButton();
    }
    
    updateMuteButton() {
        const muteButton = document.querySelector('.mute-button');
        if (muteButton) {
            muteButton.innerHTML = this.isMuted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
            console.log('Mute button updated:', this.isMuted ? 'muted' : 'unmuted');
        } else {
            console.error('Mute button not found in DOM');
        }
    }
}

// Initialize audio player when the application is ready
function initializeAudioPlayer() {
    console.log('Initializing audio player...');
    window.audioPlayer = new AudioPlayer();
}

// Initialize everything when the page loads
async function init() {
    console.log('Initializing application...');
    
    try {
        // Initialize Firebase
        await initializeApp();
        
        // Load featured artworks
        await loadFeaturedArtworks();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show error to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ff4444; color: white; padding: 15px; border-radius: 5px; z-index: 10000; max-width: 80%; text-align: center;';
        errorDiv.textContent = 'Failed to initialize application. Please refresh the page or try again later.';
        document.body.appendChild(errorDiv);
    }
}

// Start the application when the DOM is fully loaded
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', init);
} else {
    console.log('Document already loaded, initializing now...');
    init();
    initializeAudioPlayer();
}
