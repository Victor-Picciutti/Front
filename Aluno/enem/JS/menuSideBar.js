// menuSideBar.js - Controle da sidebar (arquivo separado)

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (!menuToggle || !sidebar) {
        console.error('Elementos da sidebar não encontrados');
        return;
    }
    
    // Carregar estado salvo
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
    }
    
    // Evento de clique
    menuToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('active');
        } else {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        }
    });
    
    // Fechar sidebar mobile ao clicar fora
    if (window.innerWidth <= 768) {
        document.addEventListener('click', function(event) {
            if (sidebar.classList.contains('active')) {
                if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
});