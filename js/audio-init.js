// Initialize audio player when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing audio player...');
    
    // Initialize the audio player
    const audioPlayer = new AudioPlayer();

    // Add click handler to start audio on first interaction
    const startAudio = () => {
        console.log('User interaction detected, starting audio...');
        if (!audioPlayer.isPlaying) {
            audioPlayer.play();
        }
        // Remove the event listener after first interaction
        document.removeEventListener('click', startAudio);
        document.removeEventListener('touchstart', startAudio);
    };

    // Add event listeners for user interaction
    document.addEventListener('click', startAudio);
    document.addEventListener('touchstart', startAudio);
    document.addEventListener('keydown', startAudio);
}); 