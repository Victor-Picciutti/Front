document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const welcomeCard = document.querySelector('.welcome-card');
  const actionItems = document.querySelectorAll('.action-item');
  const shortcutBtns = document.querySelectorAll('.shortcut-btn');
  const notificationsIcon = document.querySelector('.notifications-icon');
  const pageTitle = document.querySelector('.page-title');

  // 1. Funcionalidade de Colapsar/Expandir Sidebar
  if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
              sidebar.classList.toggle('active');
          } else {
              sidebar.classList.toggle('collapsed');
          }
      });
  }

  // 2. Efeito de Entrada Suave no Card de Boas-vindas
  if (welcomeCard) {
      welcomeCard.style.animation = 'slideInDown 0.6s ease-out';
  }

  // 3. Efeito de Hover nos Itens de Ação
  actionItems.forEach((item, index) => {
      item.style.animationDelay = `${index * 0.1}s`;
      item.addEventListener('mouseenter', () => {
          item.style.boxShadow = '0 4px 15px rgba(187, 134, 252, 0.2)';
      });
      item.addEventListener('mouseleave', () => {
          item.style.boxShadow = 'none';
      });
  });

  // 4. Efeito de Hover nos Botões de Atalho
  shortcutBtns.forEach((btn, index) => {
      btn.addEventListener('mouseenter', () => {
          btn.style.boxShadow = '0 8px 25px rgba(187, 134, 252, 0.3)';
      });
      btn.addEventListener('mouseleave', () => {
          btn.style.boxShadow = '0 4px 12px rgba(187, 134, 252, 0.1)';
      });
  });

  // 5. Funcionalidade de Notificações
  if (notificationsIcon) {
      notificationsIcon.addEventListener('click', () => {
          showNotificationPopup();
      });
  }

  // 6. Animação de Glitch no Título da Página
  if (pageTitle) {
      pageTitle.classList.add('glitch-text');
      setTimeout(() => {
          pageTitle.classList.remove('glitch-text');
      }, 5000);
  }

  // 7. Animação de Fundo (Scanline) - Efeito Futurista
  const body = document.body;
  body.style.setProperty('--scanline-opacity', '0.05');

  const style = document.createElement('style');
  style.innerHTML = `
      @keyframes slideInDown {
          from {
              opacity: 0;
              transform: translateY(-20px);
          }
          to {
              opacity: 1;
              transform: translateY(0);
          }
      }

      @keyframes fadeInUp {
          from {
              opacity: 0;
              transform: translateY(20px);
          }
          to {
              opacity: 1;
              transform: translateY(0);
          }
      }

      .action-item {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
      }

      body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, var(--scanline-opacity)),
              rgba(0, 0, 0, var(--scanline-opacity)) 1px,
              transparent 1px,
              transparent 2px
          );
          pointer-events: none;
          z-index: -1;
          opacity: 0.5;
      }
  `;
  document.head.appendChild(style);
});