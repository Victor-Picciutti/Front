// enviar-redacao.js - Página do Aluno para Envio de Redações

// ========== CONFIGURAÇÕES ==========
const MICRO_API_URL = 'http://localhost:3001/api/redacao';
const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_ALUNO_LOGADO = 1; // Miguel Santana

// Variáveis globais
let tipoSelecionado = null;
let temaAtual = null;
let propostasProfessor = [];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarPropostasProfessor();
    await carregarHistoricoRedacoes();
    inicializarEventos();
    inicializarNotificacoes();
});

// ========== CARREGAR PROPOSTAS DO PROFESSOR ==========
async function carregarPropostasProfessor() {
    try {
        const response = await fetch(`${API_URL}/redacoes`);
        
        if (response.ok) {
            const todasRedacoes = await response.json();
            // Filtrar propostas do professor (aluno.id = 6)
            propostasProfessor = todasRedacoes.filter(red => red.aluno?.id === 6);
            console.log('Propostas do professor:', propostasProfessor);
        }
    } catch (error) {
        console.error('Erro ao carregar propostas:', error);
        propostasProfessor = [];
    }
}

// ========== SELECIONAR TIPO ==========
function selecionarTipo(tipo) {
    tipoSelecionado = tipo;
    
    const optionProfessor = document.getElementById('optionProfessor');
    const optionIA = document.getElementById('optionIA');
    const temaProfessorArea = document.getElementById('temaProfessorArea');
    const temaIArea = document.getElementById('temaIArea');
    const temaSelecionadoArea = document.getElementById('temaSelecionadoArea');
    
    if (tipo === 'professor') {
        optionProfessor.classList.add('selected');
        optionIA.classList.remove('selected');
        temaProfessorArea.style.display = 'block';
        temaIArea.style.display = 'none';
        if (temaSelecionadoArea) temaSelecionadoArea.style.display = 'none';
        
        if (propostasProfessor.length > 0) {
            carregarPropostasCards();
        } else {
            document.getElementById('propostasList').innerHTML = `
                <div class="propostas-empty">
                    <i class="fas fa-inbox"></i>
                    <p>Nenhuma proposta de redação disponível no momento.</p>
                    <p>Seu professor ainda não criou nenhuma proposta. Tente novamente mais tarde!</p>
                </div>
            `;
        }
    } else {
        optionIA.classList.add('selected');
        optionProfessor.classList.remove('selected');
        temaProfessorArea.style.display = 'none';
        temaIArea.style.display = 'block';
        carregarTemaIA();
    }
}

// ========== CARREGAR PROPOSTAS COMO CARDS ==========
function carregarPropostasCards() {
    const propostasContainer = document.getElementById('propostasList');
    
    propostasContainer.innerHTML = propostasProfessor.map(prop => `
        <div class="proposta-card" onclick="selecionarPropostaCard(${prop.idRedacao})" data-id="${prop.idRedacao}">
            <div class="proposta-header">
                <span class="proposta-titulo">${escapeHtml(prop.titulo)}</span>
                <span class="proposta-data"><i class="fas fa-calendar-alt"></i> ${formatarData(prop.dataEntrega) || 'Data a definir'}</span>
            </div>
            <div class="proposta-tema">
                <i class="fas fa-quote-left" style="font-size: 0.7rem; opacity: 0.5; margin-right: 5px;"></i>
                ${escapeHtml(prop.tema)}
                <i class="fas fa-quote-right" style="font-size: 0.7rem; opacity: 0.5; margin-left: 5px;"></i>
            </div>
            <div class="proposta-footer">
                <span><i class="fas fa-clock"></i> Proposta pelo professor</span>
                <button class="btn-selecionar-proposta" onclick="event.stopPropagation(); selecionarPropostaCard(${prop.idRedacao})">
                    Selecionar
                </button>
            </div>
        </div>
    `).join('');
}

function selecionarPropostaCard(idRedacao) {
    const proposta = propostasProfessor.find(p => p.idRedacao == idRedacao);
    if (!proposta) return;
    
    // Remover seleção de outros cards
    document.querySelectorAll('.proposta-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Marcar card como selecionado
    const cardSelecionado = document.querySelector(`.proposta-card[data-id="${idRedacao}"]`);
    if (cardSelecionado) {
        cardSelecionado.classList.add('selected');
    }
    
    temaAtual = proposta.tema;
    
    // Mostrar área de tema selecionado
    const temaSelecionadoArea = document.getElementById('temaSelecionadoArea');
    const temaSelecionadoTexto = document.getElementById('temaSelecionadoTexto');
    const propostaDataEntrega = document.getElementById('propostaDataEntrega');
    
    temaSelecionadoTexto.innerHTML = `<i class="fas fa-tag"></i> ${escapeHtml(proposta.tema)}`;
    propostaDataEntrega.textContent = formatarData(proposta.dataEntrega) || 'Data a definir';
    temaSelecionadoArea.style.display = 'block';
    
    // Preencher título automaticamente
    document.getElementById('titulo').value = proposta.titulo;
    
    // Scroll suave até o tema selecionado
    temaSelecionadoArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    mostrarNotificacao('✅ Tema selecionado! Agora escreva sua redação.', 'success');
}

// ========== CARREGAR TEMA IA ==========
async function carregarTemaIA() {
    const temaContainer = document.getElementById('temaSemana');
    
    temaContainer.innerHTML = `
        <div class="tema-titulo"><i class="fas fa-spinner fa-pulse"></i> Gerando tema com IA...</div>
        <div class="tema-conteudo" style="text-align: center;">Aguarde...</div>
    `;
    
    try {
        const response = await fetch(`${MICRO_API_URL}/tema-surpresa`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.sucesso) {
                temaAtual = data.tema;
                temaContainer.innerHTML = `
                    <div class="tema-titulo"><i class="fas fa-magic"></i> Tema da Redação (Gerado por IA)</div>
                    <div class="tema-conteudo">${escapeHtml(data.tema)}</div>
                    <div class="tema-actions" style="margin-top: 15px;">
                        <button onclick="carregarTemaIA()" class="btn-novo-tema">
                            <i class="fas fa-dice"></i> Gerar novo tema
                        </button>
                    </div>
                `;
                return;
            }
        }
        
        temaAtual = "Os desafios da educação brasileira no século XXI";
        temaContainer.innerHTML = `
            <div class="tema-titulo"><i class="fas fa-star"></i> Tema da Redação</div>
            <div class="tema-conteudo">${temaAtual}</div>
            <button onclick="carregarTemaIA()" class="btn-novo-tema" style="margin-top: 15px;">
                <i class="fas fa-sync-alt"></i> Gerar tema com IA
            </button>
        `;
    } catch (error) {
        temaAtual = "Os desafios da educação brasileira no século XXI";
        temaContainer.innerHTML = `
            <div class="tema-titulo"><i class="fas fa-exclamation-triangle"></i> Erro de conexão</div>
            <div class="tema-conteudo">${temaAtual}</div>
            <button onclick="carregarTemaIA()" class="btn-novo-tema" style="margin-top: 15px;">
                <i class="fas fa-sync-alt"></i> Tentar novamente
            </button>
        `;
    }
}

// ========== CARREGAR HISTÓRICO DO ALUNO ==========
async function carregarHistoricoRedacoes() {
    const container = document.getElementById('historicoList');
    
    try {
        const response = await fetch(`${API_URL}/redacoes`);
        if (!response.ok) throw new Error('Erro ao carregar histórico');
        
        const todasRedacoes = await response.json();
        // Filtrar redações do aluno logado (id = 1) e que não são do professor (id != 6)
        const minhasRedacoes = todasRedacoes.filter(red => 
            (red.aluno?.id === ID_ALUNO_LOGADO) && 
            red.aluno?.id !== 6
        );
        
        console.log('Minhas redações:', minhasRedacoes);
        
        if (minhasRedacoes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Você ainda não enviou nenhuma redação.</p>
                    <p>Escreva sua primeira redação acima!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = minhasRedacoes.map(red => {
            const dataEnvio = red.dataEnvio ? new Date(red.dataEnvio).toLocaleDateString('pt-BR') : 'Data não disponível';
            const isCorrigida = red.pontuacaoObtida !== null && red.pontuacaoObtida !== undefined;
            const nota = red.pontuacaoObtida || 0;
            
            return `
                <div class="redacao-item" onclick="verDetalhesRedacao(${red.idRedacao})">
                    <div class="redacao-titulo">
                        <span>${escapeHtml(red.titulo || 'Sem título')}</span>
                        <span class="redacao-data">${dataEnvio}</span>
                    </div>
                    <div class="redacao-tema-mini">
                        <i class="fas fa-tag"></i> ${escapeHtml((red.tema || '').substring(0, 60))}...
                    </div>
                    <div>
                        <span class="redacao-status ${isCorrigida ? 'status-corrigida' : 'status-pendente'}">
                            ${isCorrigida ? `✅ Corrigida - Nota: ${nota}/1000` : '⏳ Aguardando correção'}
                        </span>
                    </div>
                    ${red.comentarios && isCorrigida ? `
                        <div class="redacao-observacao">
                            <i class="fas fa-comment"></i> ${escapeHtml(red.comentarios.substring(0, 80))}...
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar histórico. Tente novamente.</p>
            </div>
        `;
    }
}

// ========== ENVIAR REDAÇÃO (COM ID MANUAL) ==========
async function enviarRedacao(event) {
    event.preventDefault();
    
    if (!tipoSelecionado) {
        mostrarNotificacao('Por favor, selecione o tipo de redação (Professor ou IA).', 'error');
        return;
    }
    
    const titulo = document.getElementById('titulo').value.trim();
    const conteudo = document.getElementById('conteudo').value.trim();
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    
    if (!titulo) {
        mostrarNotificacao('Por favor, insira um título para sua redação.', 'error');
        return;
    }
    
    if (conteudo.length < 100) {
        mostrarNotificacao('Sua redação deve ter no mínimo 100 caracteres.', 'error');
        return;
    }
    
    if (!temaAtual) {
        mostrarNotificacao('Aguarde o tema ser carregado.', 'error');
        return;
    }
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
    submitBtn.disabled = true;
    
    try {
        // Buscar o maior ID atual para gerar o próximo
        const responseRedacoes = await fetch(`${API_URL}/redacoes`);
        const todasRedacoes = await responseRedacoes.json();
        
        // Calcular o próximo ID (maior ID + 1)
        let maiorId = 0;
        todasRedacoes.forEach(red => {
            if (red.idRedacao > maiorId) maiorId = red.idRedacao;
        });
        const novoId = maiorId + 1;
        
        console.log('Próximo ID:', novoId);
        
        const redacaoData = {
            idRedacao: novoId,
            aluno: {
                id: ID_ALUNO_LOGADO
            },
            tema: temaAtual,
            titulo: titulo,
            textoRedacao: conteudo
        };
        
        console.log('Enviando dados:', redacaoData);
        
        const response = await fetch(`${API_URL}/redacoes`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(redacaoData)
        });
        
        const responseText = await response.text();
        console.log('Resposta:', response.status, responseText);
        
        if (!response.ok) {
            throw new Error(responseText || 'Erro ao enviar redação');
        }
        
        mostrarNotificacao('✅ Redação enviada com sucesso! Aguarde a correção do professor.', 'success');
        
        // Limpar formulário
        document.getElementById('titulo').value = '';
        document.getElementById('conteudo').value = '';
        
        // Limpar seleção de proposta
        document.querySelectorAll('.proposta-card').forEach(card => {
            card.classList.remove('selected');
        });
        const temaSelecionadoArea = document.getElementById('temaSelecionadoArea');
        if (temaSelecionadoArea) temaSelecionadoArea.style.display = 'none';
        
        // Se for IA, gerar novo tema
        if (tipoSelecionado === 'ia') {
            await carregarTemaIA();
        } else {
            temaAtual = null;
        }
        
        // Recarregar histórico
        await carregarHistoricoRedacoes();
        
    } catch (error) {
        console.error('Erro ao enviar:', error);
        mostrarNotificacao('❌ Erro ao enviar redação: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ========== VER DETALHES DA REDAÇÃO ==========
async function verDetalhesRedacao(idRedacao) {
    try {
        const response = await fetch(`${API_URL}/redacoes/${idRedacao}`);
        if (!response.ok) throw new Error('Erro ao carregar detalhes');
        
        const redacao = await response.json();
        const dataEnvio = redacao.dataEnvio ? new Date(redacao.dataEnvio).toLocaleDateString('pt-BR') : 'Data não disponível';
        const isCorrigida = redacao.pontuacaoObtida !== null && redacao.pontuacaoObtida !== undefined;
        
        let mensagem = `📝 ${redacao.titulo}\n\n`;
        mensagem += `📅 Enviado: ${dataEnvio}\n`;
        mensagem += `📌 Tema: ${redacao.tema}\n\n`;
        mensagem += `📄 Conteúdo:\n${redacao.textoRedacao}\n\n`;
        
        if (isCorrigida) {
            mensagem += `⭐ NOTA: ${redacao.pontuacaoObtida}/1000\n\n`;
            if (redacao.comentarios) {
                mensagem += `💬 COMENTÁRIOS DO PROFESSOR:\n${redacao.comentarios}`;
            }
        } else {
            mensagem += `⏳ Status: Aguardando correção do professor.`;
        }
        
        alert(mensagem);
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao carregar detalhes da redação', 'error');
    }
}

// ========== LIMPAR FORMULÁRIO ==========
function limparFormulario() {
    if (confirm('Tem certeza que deseja limpar o formulário? Todo o texto será perdido.')) {
        document.getElementById('titulo').value = '';
        document.getElementById('conteudo').value = '';
        mostrarNotificacao('Formulário limpo!', 'info');
    }
}

// ========== NOTIFICAÇÕES ==========
function inicializarNotificacoes() {
    const notificationIcon = document.getElementById('notificationsIcon');
    const modal = document.getElementById('notificationsModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (notificationIcon && modal) {
        notificationIcon.addEventListener('click', () => {
            modal.style.display = 'block';
            const badge = document.querySelector('.notification-badge');
            if (badge) badge.style.display = 'none';
        });
    }
    
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (modal && e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function mostrarNotificacao(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: ${type === 'success' ? 'rgba(0, 230, 118, 0.2)' : type === 'error' ? 'rgba(255, 61, 0, 0.2)' : 'rgba(187, 134, 252, 0.2)'};
        border: 1px solid ${type === 'success' ? '#00E676' : type === 'error' ? '#FF3D00' : '#BB86FC'};
        color: ${type === 'success' ? '#00E676' : type === 'error' ? '#FF3D00' : '#BB86FC'};
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ========== EVENTOS ==========
function inicializarEventos() {
    const form = document.getElementById('redacaoForm');
    if (form) {
        form.addEventListener('submit', enviarRedacao);
    }
    
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', limparFormulario);
    }
    
    const refreshBtn = document.getElementById('refreshHistorico');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            carregarHistoricoRedacoes();
            mostrarNotificacao('Histórico atualizado!', 'info');
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Deseja realmente sair?')) {
                localStorage.clear();
                window.location.href = '../../../Login/HTML/login.html';
            }
        });
    }
}

// ========== FUNÇÕES UTILITÁRIAS ==========
function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR');
    } catch {
        return dataString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Adicionar estilos para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
    .redacao-tema-mini {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin: 5px 0;
    }
    .redacao-tema-mini i {
        color: var(--primary-color);
        margin-right: 4px;
    }
    .proposta-select {
        width: 100%;
        padding: 12px;
        background-color: #252525;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        color: var(--text-light);
        margin-bottom: 15px;
        cursor: pointer;
    }
    .proposta-select:focus {
        outline: none;
        border-color: var(--primary-color);
    }
    .proposta-tema {
        margin-top: 10px;
        padding: 10px;
        background: rgba(187, 134, 252, 0.05);
        border-radius: 8px;
    }
`;
document.head.appendChild(style);

// Expor funções globalmente
window.selecionarTipo = selecionarTipo;
window.carregarTemaIA = carregarTemaIA;
window.selecionarPropostaCard = selecionarPropostaCard;
window.verDetalhesRedacao = verDetalhesRedacao;