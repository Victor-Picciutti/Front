
document.addEventListener('DOMContentLoaded', () => {

    const introCard = document.querySelector('.intro-card');
    const enemCards = document.querySelectorAll('.enem-card');
    const buttons = document.querySelectorAll('.btn-secondary, .btn-secondary-full, .btn-primary-large');
    const notificationsIcon = document.querySelector('.notifications-icon');
    const pageTitle = document.querySelector('.page-title');


    /* ================= ANIMAÇÕES DE ENTRADA ================= */

    if (introCard) {
        introCard.style.animation = 'slideInDown 0.6s ease-out';
    }

    enemCards.forEach((card, index) => {
        card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`;
        card.style.opacity = '0';
    });

    /* ================= BOTÕES ================= */

    buttons.forEach(btn => {

        // Hover dinâmico
        btn.addEventListener('mouseenter', () => {
            btn.style.boxShadow = '0 6px 18px rgba(187, 134, 252, 0.25)';
            btn.style.transform = 'translateY(-2px)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.boxShadow = '';
            btn.style.transform = '';
        });

        // Ripple + impedir clique no card
        btn.addEventListener('click', (e) => {

            e.stopPropagation(); // impede ativar clique do card

            const ripple = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.position = 'absolute';
            ripple.style.width = size + 'px';
            ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.backgroundColor = 'rgba(255,255,255,0.4)';
            ripple.style.borderRadius = '50%';
            ripple.style.animation = 'ripple-animation 0.6s ease-out';
            ripple.style.pointerEvents = 'none';

            btn.style.position = 'relative';
            btn.style.overflow = 'hidden';
            btn.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });

    });

    /* ================= NOTIFICAÇÕES ================= */

    if (notificationsIcon) {
        notificationsIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            showNotificationPopup();
        });
    }

    /* ================= GLITCH ================= */

    if (pageTitle) {
        pageTitle.classList.add('glitch-text');
        setTimeout(() => {
            pageTitle.classList.remove('glitch-text');
        }, 5000);
    }

    injectAnimationStyles();
});


/* ================= ANIMAÇÕES ================= */

function injectAnimationStyles() {

    if (document.querySelector('style[data-animations]')) return;

    const style = document.createElement('style');
    style.setAttribute('data-animations', 'true');

    style.innerHTML = `
        @keyframes slideInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ripple-animation {
            from { transform: scale(0); opacity: 1; }
            to { transform: scale(4); opacity: 0; }
        }

        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background: repeating-linear-gradient(
                0deg,
                rgba(0,0,0,0.05),
                rgba(0,0,0,0.05) 1px,
                transparent 1px,
                transparent 2px
            );
            pointer-events: none;
            z-index: -1;
            opacity: 0.5;
        }
    `;

    document.head.appendChild(style);
}


/* ================= POPUP ================= */

function showNotificationPopup() {

    const notifications = [
        '✓ Novo tema de redação disponível',
        '✓ Simulado corrigido com sucesso',
        '✓ Cronograma ENEM atualizado'
    ];

    alert('📬 NOTIFICAÇÕES\n\n' + notifications.join('\n'));
}

// enem.js - Funcionalidades da página Central do ENEM

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar notificações
    initNotifications();
    
    // Inicializar cards clicáveis
    initClickableCards();
    
    // Atualizar data do cronograma dinamicamente
    updateCronograma();
});

// Função para inicializar notificações
function initNotifications() {
    const notificationIcon = document.querySelector('.notifications-icon');
    
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            // Criar modal de notificações
            const modal = document.createElement('div');
            modal.className = 'notifications-modal';
            modal.innerHTML = `
                <div class="notifications-modal-content">
                    <div class="notifications-header">
                        <h3><i class="fas fa-bell"></i> Notificações</h3>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="notifications-list">
                        <div class="notification-item unread">
                            <i class="fas fa-pen-fancy"></i>
                            <div class="notification-text">
                                <strong>Nova redação disponível!</strong>
                                <p>O tema da semana já está disponível para envio.</p>
                                <small>Há 2 horas</small>
                            </div>
                        </div>
                        <div class="notification-item unread">
                            <i class="fas fa-calendar-alt"></i>
                            <div class="notification-text">
                                <strong>ENEM 2024</strong>
                                <p>As inscrições começam em 15 de Maio. Fique atento!</p>
                                <small>Há 1 dia</small>
                            </div>
                        </div>
                        <div class="notification-item">
                            <i class="fas fa-trophy"></i>
                            <div class="notification-text">
                                <strong>Parabéns!</strong>
                                <p>Você concluiu 5 simulados este mês.</p>
                                <small>Há 3 dias</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Fechar modal
            const closeBtn = modal.querySelector('.close-modal');
            closeBtn.addEventListener('click', function() {
                modal.remove();
            });
            
            // Fechar ao clicar fora
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            // Marcar notificações como lidas
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.style.display = 'none';
            }
        });
    }
}

// Função para inicializar cards clicáveis
function initClickableCards() {
    const clickableCards = document.querySelectorAll('.clickable-card');
    
    clickableCards.forEach(card => {
        card.addEventListener('click', function() {
            const firstButton = this.querySelector('.btn-secondary');
            if (firstButton && firstButton.href) {
                window.location.href = firstButton.href;
            }
        });
    });
}

// Função para atualizar o cronograma dinamicamente
function updateCronograma() {
    const currentYear = new Date().getFullYear();
    const yearStr = currentYear.toString();
    
    // Atualizar ano nos textos do cronograma
    const scheduleItems = document.querySelectorAll('.schedule-item');
    
    if (scheduleItems.length >= 3) {
        // Atualizar ano das inscrições
        const inscricoesText = scheduleItems[0].querySelector('.schedule-date');
        if (inscricoesText) {
            inscricoesText.textContent = `15 de Maio - 26 de Maio de ${yearStr}`;
        }
        
        // Atualizar ano das provas
        const provasText = scheduleItems[1].querySelector('.schedule-date');
        if (provasText) {
            provasText.textContent = `3 e 10 de Novembro de ${yearStr}`;
        }
        
        // Atualizar ano do cartão de confirmação
        const cartaoText = scheduleItems[2].querySelector('.schedule-date');
        if (cartaoText) {
            cartaoText.textContent = `20 de Outubro de ${yearStr}`;
        }
    }
}

// Adicionar estilos para o modal de notificações
const style = document.createElement('style');
style.textContent = `
    .notifications-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notifications-modal-content {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        width: 90%;
        max-width: 450px;
        max-height: 80vh;
        overflow-y: auto;
        animation: modalFadeIn 0.3s ease;
    }
    
    .notifications-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
    }
    
    .notifications-header h3 {
        font-family: var(--font-futuristic);
        font-size: 1.2rem;
        color: var(--primary-color);
    }
    
    .notifications-header h3 i {
        margin-right: 8px;
        color: var(--secondary-color);
    }
    
    .close-modal {
        font-size: 28px;
        cursor: pointer;
        color: var(--text-muted);
        transition: color 0.3s ease;
    }
    
    .close-modal:hover {
        color: var(--accent-color);
    }
    
    .notifications-list {
        padding: 10px;
    }
    
    .notification-item {
        display: flex;
        gap: 15px;
        padding: 15px;
        border-radius: 12px;
        transition: background-color 0.3s ease;
        cursor: pointer;
    }
    
    .notification-item:hover {
        background-color: rgba(187, 134, 252, 0.1);
    }
    
    .notification-item.unread {
        background-color: rgba(187, 134, 252, 0.05);
        border-left: 3px solid var(--primary-color);
    }
    
    .notification-item i {
        font-size: 1.2rem;
        color: var(--primary-color);
        margin-top: 3px;
    }
    
    .notification-text {
        flex: 1;
    }
    
    .notification-text strong {
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .notification-text p {
        color: var(--text-muted);
        font-size: 0.85rem;
        margin: 4px 0;
    }
    
    .notification-text small {
        color: var(--text-muted);
        font-size: 0.7rem;
    }
    
    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);