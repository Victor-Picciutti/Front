document.addEventListener('DOMContentLoaded', () => {
    const sidebar    = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');

    if (!sidebar || !menuToggle) return;

    // ── Colapsar / expandir ───────────────────────────────────
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
    });

    // ── Fechar sidebar ao clicar fora (mobile) ────────────────
    document.addEventListener('click', (e) => {
        if (
            window.innerWidth <= 768 &&
            sidebar.classList.contains('active') &&
            !sidebar.contains(e.target)
        ) {
            sidebar.classList.remove('active');
        }
    });

    // ── Marcar item ativo pela URL atual ──────────────────────
    const currentPage = window.location.pathname.split('/').pop();

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        const href = (item.getAttribute('href') || '').split('/').pop();
        if (href && href === currentPage) {
            item.classList.add('active');
        }
    });
});


// ── Toggle submenu Redações ───────────────────────────────

const redacoesSubmenu = document.getElementById('redacoesSubmenu');
if (redacoesSubmenu) {
    const trigger = redacoesSubmenu.querySelector('#nav-redacoes');
    trigger.addEventListener('click', () => {
        redacoesSubmenu.classList.toggle('open');
    });

    if (redacoesSubmenu.querySelector('.submenu-item.active')) {
        redacoesSubmenu.classList.add('open');
    }
}