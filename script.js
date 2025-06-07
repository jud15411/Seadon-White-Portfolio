// Navigation Toggle
document.addEventListener('DOMContentLoaded', () => {
    const navCircle = document.querySelector('.nav-circle');
    const navLinks = document.querySelector('.nav-links');

    // Toggle navigation
    navCircle.addEventListener('click', () => {
        const isActive = navLinks.classList.contains('active');
        
        // Close if already active
        if (isActive) {
            navLinks.classList.remove('active');
            navCircle.classList.remove('active');
            return;
        }

        // Open
        navLinks.classList.add('active');
        navCircle.classList.add('active');
    });

    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
        if (!navCircle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
            navCircle.classList.remove('active');
        }
    });

    // Close nav when scrolling
    window.addEventListener('scroll', () => {
        navLinks.classList.remove('active');
        navCircle.classList.remove('active');
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
