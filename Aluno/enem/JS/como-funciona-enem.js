
// como-funciona-enem.js
document.addEventListener("DOMContentLoaded", function () {
    console.log('🚀 Página "Como funciona o ENEM" carregada');
    
    // Menu toggle (se existir)
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", function () {
            sidebar.classList.toggle("collapsed");
        });
    }
    
    // Animação suave ao scroll (opcional)
    const cards = document.querySelectorAll(".enem-card");
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        card.style.transition = "all 0.5s ease";
        observer.observe(card);
    });
});