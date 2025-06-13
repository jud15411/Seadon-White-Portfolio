// Immediate debug message to verify script loading
console.log('Audio player script loaded');

// Test audio element creation
const testAudio = new Audio();
console.log('Audio element created:', testAudio);

// Global audio player instance
let globalAudioPlayer = null;

// Audio Player State Management
let audioPlayer = null;
let isPlaying = false;
let currentTrack = 0;
let audioContext = null;
let audioSource = null;
let gainNode = null;
let startTime = 0;
let pauseTime = 0;
let tracks = [
    {
        title: "Track 1",
        url: "https://firebasestorage.googleapis.com/v0/b/seadon-white-portfolio.appspot.com/o/audio%2Ftrack1.mp3?alt=media&token=YOUR_TOKEN"
    },
    {
        title: "Track 2",
        url: "https://firebasestorage.googleapis.com/v0/b/seadon-white-portfolio.appspot.com/o/audio%2Ftrack2.mp3?alt=media&token=YOUR_TOKEN"
    }
];

class AudioPlayer {
    constructor() {
        if (globalAudioPlayer) {
            console.log('Returning existing audio player instance');
            return globalAudioPlayer;
        }
        
        console.log('Creating new audio player instance');
        this.audio = new Audio();
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 0.5;
        this.currentTrack = 0;

        // Determine if we're in the pages directory
        const isInPagesDirectory = window.location.pathname.includes('/pages/');
        const musicPath = isInPagesDirectory ? '../Music/' : 'Music/';
        console.log('Current path:', window.location.pathname);
        console.log('Is in pages directory:', isInPagesDirectory);
        console.log('Using music path:', musicPath);
        
        this.tracks = [
            {
                title: "Charlie Lewis - But I Don't Know",
                url: musicPath + "Charlie Lewis - But I Don't Know.mp3"
            }
        ];
        console.log('Audio URL:', this.tracks[0].url);

        // Set initial volume
        this.audio.volume = this.volume;
        
        // Add error handling
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            console.error('Error code:', e.target.error.code);
            console.error('Error message:', e.target.error.message);
        });

        this.audio.addEventListener('canplay', () => {
            console.log('Audio can play now');
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
        
        // Load saved state
        this.loadState();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Add mute button to navigation
        this.addMuteButtonToNav();
        
        // Make this instance global
        globalAudioPlayer = this;
    }

    loadState() {
        console.log('Loading audio player state');
        try {
            const savedState = JSON.parse(localStorage.getItem('audioPlayerState'));
            if (savedState) {
                console.log('Found saved state:', savedState);
                this.currentTrack = savedState.currentTrack || 0;
                this.isPlaying = savedState.isPlaying || false;
                this.isMuted = savedState.isMuted || false;
                this.volume = typeof savedState.volume === 'number' && isFinite(savedState.volume) ? 
                    Math.max(0, Math.min(1, savedState.volume)) : 0.5;
                this.audio.volume = this.isMuted ? 0 : this.volume;
                this.audio.currentTime = typeof savedState.currentTime === 'number' && isFinite(savedState.currentTime) ? 
                    Math.max(0, savedState.currentTime) : 0;
                this.loadTrack(this.currentTrack);
                if (this.isPlaying) {
                    this.play();
                }
            } else {
                console.log('No saved state found, loading default track');
                this.loadTrack(0);
            }
        } catch (error) {
            console.error('Error loading state:', error);
            // Reset to defaults if there's an error
            this.currentTrack = 0;
            this.isPlaying = false;
            this.isMuted = false;
            this.volume = 0.5;
            this.audio.volume = this.volume;
            this.audio.currentTime = 0;
            this.loadTrack(0);
        }
    }

    saveState() {
        const state = {
            currentTrack: this.currentTrack,
            isPlaying: this.isPlaying,
            isMuted: this.isMuted,
            volume: this.volume,
            currentTime: this.audio.currentTime
        };
        localStorage.setItem('audioPlayerState', JSON.stringify(state));
    }

    loadTrack(trackIndex) {
        console.log('Loading track:', trackIndex);
        try {
            const track = this.tracks[trackIndex];
            console.log('Loading track URL:', track.url);
            this.audio.src = track.url;
            this.currentTrack = trackIndex;
            this.saveState();
            console.log('Track loaded successfully');
        } catch (error) {
            console.error('Error loading track:', error);
        }
    }

    play() {
        console.log('Attempting to play audio');
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Audio playing successfully');
                    this.isPlaying = true;
                    this.updatePlayPauseButton();
                    this.saveState();
                })
                .catch(error => {
                    console.error('Error playing audio:', error);
                });
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayPauseButton();
        this.saveState();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    playNext() {
        this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
        this.loadTrack(this.currentTrack);
        if (this.isPlaying) {
            this.play();
        }
    }

    playPrevious() {
        this.currentTrack = (this.currentTrack - 1 + this.tracks.length) % this.tracks.length;
        this.loadTrack(this.currentTrack);
        if (this.isPlaying) {
            this.play();
        }
    }

    updatePlayPauseButton() {
        const playPauseBtn = document.querySelector('.play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = this.isPlaying ? 
                '<i class="fas fa-pause"></i>' : 
                '<i class="fas fa-play"></i>';
        }
    }

    addMuteButtonToNav() {
        // Find the navigation menu
        const navContent = document.querySelector('.nav-content');
        if (!navContent) {
            console.error('Navigation menu not found');
            return;
        }

        // Check if mute button already exists
        if (document.querySelector('.mute-button')) {
            return;
        }

        // Create mute button
        const muteButton = document.createElement('button');
        muteButton.className = 'nav-link mute-button';
        muteButton.innerHTML = this.isMuted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
        muteButton.title = 'Mute/Unmute';
        muteButton.onclick = (e) => {
            e.preventDefault();
            this.toggleMute();
        };

        // Add to navigation
        navContent.appendChild(muteButton);
    }

    toggleMute() {
        if (this.isMuted) {
            this.audio.volume = this.volume;
            this.isMuted = false;
        } else {
            this.audio.volume = 0;
            this.isMuted = true;
        }
        this.updateMuteButton();
        this.saveState();
    }

    updateMuteButton() {
        const muteButton = document.querySelector('.mute-button');
        if (muteButton) {
            muteButton.innerHTML = this.isMuted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
        }
    }

    setupEventListeners() {
        // Handle track ending
        this.audio.addEventListener('ended', () => {
            this.playNext();
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isPlaying) {
                this.audio.pause();
            } else if (!document.hidden && this.isPlaying) {
                this.audio.play();
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
    }
}

// Initialize audio player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing audio player...');
    new AudioPlayer();
});

// Initialize audio context and load saved state
async function initAudio() {
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);

        // Load saved state from localStorage
        const savedState = JSON.parse(localStorage.getItem('audioPlayerState'));
        if (savedState) {
            currentTrack = savedState.currentTrack;
            isPlaying = savedState.isPlaying;
            pauseTime = savedState.pauseTime;
        }

        // Load the current track
        await loadTrack(currentTrack);

        // If it was playing, resume from the saved position
        if (isPlaying) {
            await playAudio();
        }

        // Update UI to reflect saved state
        updatePlayPauseButton();
    } catch (error) {
        console.error('Error initializing audio:', error);
    }
}

// Load a specific track
async function loadTrack(trackIndex) {
    try {
        if (audioSource) {
            audioSource.stop();
            audioSource.disconnect();
        }

        const response = await fetch(tracks[trackIndex].url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(gainNode);
        
        // Set up the ended event
        audioSource.onended = () => {
            if (isPlaying) {
                currentTrack = (currentTrack + 1) % tracks.length;
                loadTrack(currentTrack);
                playAudio();
            }
        };

        // If we have a saved pause time, set it
        if (pauseTime > 0) {
            audioSource.start(0, pauseTime);
            startTime = audioContext.currentTime - pauseTime;
        }
    } catch (error) {
        console.error('Error loading track:', error);
    }
}

// Play audio
async function playAudio() {
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    
    if (!audioSource) {
        await loadTrack(currentTrack);
    }
    
    if (!isPlaying) {
        audioSource.start(0);
        startTime = audioContext.currentTime;
        isPlaying = true;
        updatePlayPauseButton();
        saveState();
    }
}

// Pause audio
function pauseAudio() {
    if (isPlaying) {
        audioSource.stop();
        pauseTime = audioContext.currentTime - startTime;
        isPlaying = false;
        updatePlayPauseButton();
        saveState();
    }
}

// Toggle play/pause
function togglePlayPause() {
    if (isPlaying) {
        pauseAudio();
    } else {
        playAudio();
    }
}

// Play next track
async function playNext() {
    currentTrack = (currentTrack + 1) % tracks.length;
    pauseTime = 0;
    await loadTrack(currentTrack);
    if (isPlaying) {
        await playAudio();
    }
    saveState();
}

// Play previous track
async function playPrevious() {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    pauseTime = 0;
    await loadTrack(currentTrack);
    if (isPlaying) {
        await playAudio();
    }
    saveState();
}

// Update play/pause button icon
function updatePlayPauseButton() {
    const playPauseBtn = document.querySelector('.play-pause-btn');
    if (playPauseBtn) {
        playPauseBtn.innerHTML = isPlaying ? 
            '<i class="fas fa-pause"></i>' : 
            '<i class="fas fa-play"></i>';
    }
}

// Save current state to localStorage
function saveState() {
    const state = {
        currentTrack,
        isPlaying,
        pauseTime: isPlaying ? 0 : pauseTime
    };
    localStorage.setItem('audioPlayerState', JSON.stringify(state));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const playPauseBtn = document.querySelector('.play-pause-btn');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const muteBtn = document.querySelector('.mute-button');

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', playNext);
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', playPrevious);
    }
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            if (gainNode) {
                gainNode.gain.value = gainNode.gain.value > 0 ? 0 : 1;
                muteBtn.innerHTML = gainNode.gain.value > 0 ? 
                    '<i class="fas fa-volume-up"></i>' : 
                    '<i class="fas fa-volume-mute"></i>';
            }
        });
    }

    // Initialize audio when user interacts with the page
    document.addEventListener('click', () => {
        if (!audioContext) {
            initAudio();
        }
    }, { once: true });
}); 