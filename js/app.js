// Common logic and navigation

document.addEventListener('DOMContentLoaded', () => {
    // Handle bottom nav highlighting
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-item');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });

    // Add logic to go back to events if on profile and clicking events nav
    // Logic is handled in specific pages using fetch
});