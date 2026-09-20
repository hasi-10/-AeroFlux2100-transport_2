document.addEventListener('DOMContentLoaded', () => {
    // Note: session storage logic is commented out so you can see the animation every time for now!
    // if (sessionStorage.getItem('aeroflux_intro_played') === 'true') {
    //     window.location.href = 'index.html';
    //     return;
    // }

    const textContainer = document.getElementById('aeroflux-text');
    const tagline = document.querySelector('.intro-tagline');
    
    // The text to animate
    const brandText = "AeroFlux";
    
    // Clear container
    textContainer.innerHTML = '';
    
    // Create animated spans for each letter
    brandText.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'letter';
        
        // Stagger the animation delay for each letter (e.g. 0.1s apart)
        // Add a base delay of 0.5s before the animation starts
        span.style.animationDelay = `${0.5 + (index * 0.15)}s`;
        
        textContainer.appendChild(span);
    });
    
    // Calculate when the last letter finishes its animation
    // Base delay + (number of letters * 0.15) + animation duration (0.8s)
    const totalLetterAnimationTime = (0.5 + (brandText.length * 0.15) + 0.8) * 1000;
    
    // Show the tagline just as the letters finish
    setTimeout(() => {
        tagline.classList.add('show');
    }, totalLetterAnimationTime - 400); // Trigger slightly before the very end for smooth flow
    
    // Redirect to index page after the whole animation is completed + a small pause
    setTimeout(() => {
        // Mark as played
        sessionStorage.setItem('aeroflux_intro_played', 'true');
        
        // Fade out screen
        document.body.classList.add('fade-out');
        
        // Redirect
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000); // 1 second for fade out
        
    }, totalLetterAnimationTime + 1500); // 1.5 seconds pause after tagline shows
});
