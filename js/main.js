document.addEventListener('DOMContentLoaded', () => {
    // Navigation functionality
    const navBrand = document.querySelector('.nav-brand');
    const navLinks = document.querySelector('.nav-links');
    const navIndicator = document.querySelector('.nav-indicator');
    const links = document.querySelectorAll('.nav-link');

    // Only proceed if required elements exist
    if (navBrand && navLinks) {
        // Toggle mobile menu
        navBrand.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.classList.toggle('active');
        });
    }

    // Update active link and indicator
    if (links.length > 0 && navLinks) {
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                links.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Update indicator position if it exists
                if (navIndicator) {
                    try {
                        const linkRect = link.getBoundingClientRect();
                        const containerRect = navLinks.getBoundingClientRect();
                        
                        navIndicator.style.width = `${linkRect.width}px`;
                        navIndicator.style.left = `${linkRect.left - containerRect.left}px`;
                    } catch (error) {
                        console.error('Error updating nav indicator:', error);
                    }
                }
                
                // Close mobile menu if open
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                }
            });

            // Update indicator on hover
            if (navIndicator) {
                link.addEventListener('mouseenter', () => {
                    try {
                        const linkRect = link.getBoundingClientRect();
                        const containerRect = navLinks.getBoundingClientRect();
                        
                        navIndicator.style.width = `${linkRect.width}px`;
                        navIndicator.style.left = `${linkRect.left - containerRect.left}px`;
                        navIndicator.style.opacity = '1';
                    } catch (error) {
                        console.error('Error updating hover indicator:', error);
                    }
                });
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navLinks && navBrand && !navLinks.contains(e.target) && !navBrand.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });

        // Update active link based on current page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        links.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
                
                if (navIndicator) {
                    try {
                        const linkRect = link.getBoundingClientRect();
                        const containerRect = navLinks.getBoundingClientRect();
                        
                        navIndicator.style.width = `${linkRect.width}px`;
                        navIndicator.style.left = `${linkRect.left - containerRect.left}px`;
                        navIndicator.style.opacity = '1';
                    } catch (error) {
                        console.error('Error updating initial nav indicator:', error);
                    }
                }
            }
        });
    }

    // Slideshow functionality
    const slideshowContainer = document.querySelector('.slideshow-container');
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevButton = document.querySelector('.prev-slide');
    const nextButton = document.querySelector('.next-slide');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Add active class to current slide and dot
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    function nextSlide() {
        let next = currentSlide + 1;
        if (next >= slides.length) {
            next = 0;
        }
        showSlide(next);
    }

    function prevSlide() {
        let prev = currentSlide - 1;
        if (prev < 0) {
            prev = slides.length - 1;
        }
        showSlide(prev);
    }

    // Event listeners for controls
    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
            clearInterval(slideInterval);
            prevSlide();
            startSlideshow();
        });

        nextButton.addEventListener('click', () => {
            clearInterval(slideInterval);
            nextSlide();
            startSlideshow();
        });
    }

    // Event listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(slideInterval);
            showSlide(index);
            startSlideshow();
        });
    });

    // Start automatic slideshow
    function startSlideshow() {
        slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    // Initialize slideshow if there are slides
    if (slides.length > 0) {
        startSlideshow();
    }
}); 