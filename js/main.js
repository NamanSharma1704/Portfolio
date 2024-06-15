// main.js

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetElement = document.querySelector(this.getAttribute('href'));
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
            console.log(`Scrolling to: ${this.getAttribute('href')}`);
        } else {
            console.warn(`Target element not found: ${this.getAttribute('href')}`);
        }
    });
});
