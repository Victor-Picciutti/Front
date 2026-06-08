// frontend/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const loadingNotification = document.getElementById('loading-notification');
    
    // URL da sua API atual
    const API_URL = 'http://localhost:8080/utilizadores'; // Ajuste para sua URL
    
    // Função para validar domínio do email (FRONT-END)
    const validateEmailDomain = (email) => {
        const domain = email.split('@')[1];
        
        if (!domain) {
            return { valid: false, error: 'Email inválido' };
        }
        
        if (domain === 'aluno.estudex.com') {
            return { 
                valid: true, 
                type: 'aluno', 
                // REDIRECIONAMENTO DO ALUNO - HOME
                redirectTo: '../../Home/HTML/home-Estudex.html'
            };
        } else if (domain === 'prof.estudex.com') {
            return { 
                valid: true, 
                type: 'professor', 
                // REDIRECIONAMENTO DO PROFESSOR - PERFIL
                redirectTo: '../../Professor/HTML/professorPerfil.html'
            };
        } else {
            return { valid: false, error: 'Domínio não autorizado. Use @aluno.estudex.com ou @prof.estudex.com' };
        }
    };
    
    // Mostrar notificação de carregamento
    const showLoading = () => {
        if (loadingNotification) {
            loadingNotification.classList.add('show');
        }
    };
    
    // Esconder notificação de carregamento
    const hideLoading = () => {
        if (loadingNotification) {
            loadingNotification.classList.remove('show');
        }
    };
    
    // Mostrar mensagem de erro
    const showError = (message) => {
        // Remove erro anterior se existir
        const oldError = document.querySelector('.error-message');
        if (oldError) oldError.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorDiv.style.cssText = `
            background: linear-gradient(135deg, #ff4757, #ff6b81);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            animation: slideDown 0.3s ease-out;
            box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
        `;
        
        const formCard = document.querySelector('.form-card');
        if (formCard) {
            formCard.insertBefore(errorDiv, formCard.firstChild);
        }
        
        // Esconder após 5 segundos
        setTimeout(() => {
            if (errorDiv) errorDiv.remove();
        }, 5000);
    };
    
    // Mostrar mensagem de sucesso
    const showSuccess = (message) => {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        successDiv.style.cssText = `
            background: linear-gradient(135deg, #00b894, #00cec9);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            animation: slideDown 0.3s ease-out;
            box-shadow: 0 4px 15px rgba(0, 184, 148, 0.3);
        `;
        
        const formCard = document.querySelector('.form-card');
        if (formCard) {
            formCard.insertBefore(successDiv, formCard.firstChild);
        }
        
        setTimeout(() => {
            if (successDiv) successDiv.remove();
        }, 2000);
    };
    
    // Salvar dados do usuário no localStorage
    const saveUserData = (userData) => {
        localStorage.setItem('estudex_user', JSON.stringify(userData));
        localStorage.setItem('estudex_logged_in', 'true');
        localStorage.setItem('estudex_login_time', new Date().toISOString());
        
        // Salvar checkbox "Lembrar-me"
        const rememberCheckbox = document.getElementById('remember');
        if (rememberCheckbox && rememberCheckbox.checked) {
            localStorage.setItem('estudex_remember_email', userData.email);
        } else {
            localStorage.removeItem('estudex_remember_email');
        }
    };
    
    // Carregar email salvo
    const loadSavedEmail = () => {
        const savedEmail = localStorage.getItem('estudex_remember_email');
        if (savedEmail && emailInput) {
            emailInput.value = savedEmail;
            const rememberCheckbox = document.getElementById('remember');
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }
    };
    
    // Verificar se já está logado
    const checkAlreadyLoggedIn = () => {
        const isLoggedIn = localStorage.getItem('estudex_logged_in');
        const userData = localStorage.getItem('estudex_user');
        
        if (isLoggedIn === 'true' && userData) {
            const user = JSON.parse(userData);
            // Redirecionar baseado no tipo de usuário
            if (user.tipo === 'aluno') {
                window.location.href = '../../Home/HTML/home-Estudex.html';
            } else if (user.tipo === 'professor') {
                window.location.href = 'professorPerfil.html';
            }
        }
    };
    
    // Buscar utilizadores da API
    const fetchUsers = async () => {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            return [];
        }
    };
    
    // Função principal de login
    const handleLogin = async (event) => {
        event.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validações básicas
        if (!email || !password) {
            showError('Por favor, preencha todos os campos');
            return;
        }
        
        // VALIDAÇÃO DE DOMÍNIO (frontend)
        const domainValidation = validateEmailDomain(email);
        if (!domainValidation.valid) {
            showError(domainValidation.error);
            return;
        }
        
        showLoading();
        
        try {
            // Buscar usuários da sua API
            const users = await fetchUsers();
            
            // Extrair nome do email (parte antes do @)
            const emailPrefix = email.split('@')[0];
            
            // Procurar usuário que corresponda ao email (usando nome como referência)
            // Como seu banco ainda não tem email, vamos fazer match pelo nome
            let foundUser = null;
            
            if (domainValidation.type === 'aluno') {
                // Alunos têm idTipoUtilizador = 1
                foundUser = users.find(u => 
                    u.idTipoUtilizador === 1 && 
                    (u.nome.toLowerCase().includes(emailPrefix.toLowerCase()) || 
                     emailPrefix.toLowerCase().includes(u.nome.toLowerCase().split(' ')[0]))
                );
            } else if (domainValidation.type === 'professor') {
                // Professores têm idTipoUtilizador = 2
                foundUser = users.find(u => 
                    u.idTipoUtilizador === 2 &&
                    (u.nome.toLowerCase().includes(emailPrefix.toLowerCase()) ||
                     emailPrefix.toLowerCase().includes(u.nome.toLowerCase().split(' ')[0]))
                );
            }
            
            // Para demonstração do TCC, vamos aceitar login mesmo sem encontrar usuário
            // Isso permite testar os redirecionamentos
            
            // Dados do usuário para sessão
            const userData = {
                id: foundUser ? foundUser.idUtilizador : (domainValidation.type === 'aluno' ? 1 : 6),
                nome: foundUser ? foundUser.nome : (domainValidation.type === 'aluno' ? 'Aluno' : 'Professor'),
                email: email,
                tipo: domainValidation.type,
                cargo: domainValidation.type === 'aluno' ? 'Aluno' : 'Professor',
                loginTime: new Date().toISOString()
            };
            
            // Salvar dados do usuário
            saveUserData(userData);
            
            // Mostrar mensagem de sucesso
            showSuccess(`Bem-vindo, ${userData.nome}! Redirecionando...`);
            
            // Pequeno delay para mostrar a mensagem
            setTimeout(() => {
                hideLoading();
                // REDIRECIONAR PARA A PÁGINA CORRETA
                window.location.href = domainValidation.redirectTo;
            }, 1500);
            
        } catch (error) {
            hideLoading();
            console.error('Erro no login:', error);
            showError('Erro ao conectar com o servidor. Tente novamente.');
        }
    };
    
    // Toggle para mostrar/esconder senha
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = togglePassword.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
    
    // Adicionar CSS para animações se não existir
    const addAnimationStyles = () => {
        if (!document.querySelector('#login-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'login-animation-styles';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // Inicializar
    addAnimationStyles();
    loadSavedEmail();
    checkAlreadyLoggedIn();
    
    // Adicionar event listener do formulário
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
});