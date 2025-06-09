class SpotifyPlayer {
    constructor() {
        this.token = null;
        this.player = null;
        this.deviceId = null;
        this.isPlaying = false;
        this.volume = 0.5; // Default volume (50%)
        this.isMuted = false;
        this.previousVolume = 0.5;
        
        // Initialize the player when the page loads
        window.onSpotifyWebPlaybackSDKReady = () => {
            this.initializePlayer();
        };
    }

    async initializePlayer() {
        try {
            // Get access token from your backend
            const response = await fetch('/api/spotify-token');
            const data = await response.json();
            this.token = data.access_token;

            this.player = new Spotify.Player({
                name: 'Seadon White Portfolio',
                getOAuthToken: cb => { cb(this.token); },
                volume: this.volume
            });

            // Error handling
            this.player.addListener('initialization_error', ({ message }) => {
                console.error('Failed to initialize:', message);
            });

            this.player.addListener('authentication_error', ({ message }) => {
                console.error('Failed to authenticate:', message);
            });

            this.player.addListener('account_error', ({ message }) => {
                console.error('Failed to validate Spotify account:', message);
            });

            this.player.addListener('playback_error', ({ message }) => {
                console.error('Failed to perform playback:', message);
            });

            // Playback status updates
            this.player.addListener('player_state_changed', state => {
                this.isPlaying = !state.paused;
                this.updatePlaybackStatus(state);
            });

            // Ready
            this.player.addListener('ready', ({ device_id }) => {
                this.deviceId = device_id;
                console.log('Ready with Device ID', device_id);
                this.playBackgroundMusic();
            });

            // Connect to the player
            await this.player.connect();
        } catch (error) {
            console.error('Error initializing Spotify player:', error);
        }
    }

    async playBackgroundMusic() {
        try {
            // Replace with your playlist URI
            const playlistUri = 'spotify:playlist:YOUR_PLAYLIST_ID';
            
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    context_uri: playlistUri,
                    offset: {
                        position: 0
                    },
                    position_ms: 0
                })
            });
        } catch (error) {
            console.error('Error playing background music:', error);
        }
    }

    toggleMute() {
        if (this.isMuted) {
            this.player.setVolume(this.previousVolume);
            this.isMuted = false;
        } else {
            this.previousVolume = this.volume;
            this.player.setVolume(0);
            this.isMuted = true;
        }
        this.updateMuteButton();
    }

    updateMuteButton() {
        const muteButton = document.getElementById('mute-button');
        if (muteButton) {
            muteButton.innerHTML = this.isMuted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
        }
    }

    updatePlaybackStatus(state) {
        // Update UI with current track info if needed
        if (state) {
            const currentTrack = state.track_window.current_track;
            console.log('Currently playing:', currentTrack.name);
        }
    }
}

// Initialize the player when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spotifyPlayer = new SpotifyPlayer();
}); 