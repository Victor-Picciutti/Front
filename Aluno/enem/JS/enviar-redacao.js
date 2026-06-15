// enviar-redacao.js

const MICRO_API_URL = 'http://localhost:3001/api/redacao';
const API_URL = 'http://localhost:8080';
//const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_ALUNO_LOGADO = 1;

let tipoSelecionado = null;
let temaAtual = null;
let propostasProfessor = [];

document.addEventListener('DOMContentLoaded', async () => {
    await carregarPropostasProfessor();
    await carregarHistoricoRedacoes();
    inicializarEventos();
    inicializarNotificacoes();
});

async function carregarPropostasProfessor() {
    try {
        const response = await fetch(`${API_URL}/redacoes`);
        if (response.ok) {
            const todasRedacoes = await response.json();
            const propostas = todasRedacoes.filter(red => red.aluno?.id === 6);
            
            // Pega só a última proposta publicada (maior idRedacao)
            if (propostas.length > 0) {
                const ultima = propostas.reduce((prev, curr) => 
                    curr.idRedacao > prev.idRedacao ? curr : prev
                );
                propostasProfessor = [ultima];
            } else {
                propostasProfessor = [];
            }
        }
    } catch (error) {
        console.error('Erro ao carregar propostas:', error);
        propostasProfessor = [];
    }
}

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

function carregarPropostasCards() {
    const propostasContainer = document.getElementById('propostasList');
    propostasContainer.innerHTML = propostasProfessor.map(prop => `
        <div class="proposta-card" onclick="selecionarPropostaCard(${prop.idRedacao})" data-id="${prop.idRedacao}">
            <div class="proposta-header">
                <span class="proposta-titulo">${escapeHtml(prop.titulo)}</span>
            </div>
            <div class="proposta-tema">
                <i class="fas fa-quote-left" style="font-size:0.7rem;opacity:0.5;margin-right:5px;"></i>
                ${escapeHtml(prop.tema)}
                <i class="fas fa-quote-right" style="font-size:0.7rem;opacity:0.5;margin-left:5px;"></i>
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

    document.querySelectorAll('.proposta-card').forEach(card => card.classList.remove('selected'));
    const cardSelecionado = document.querySelector(`.proposta-card[data-id="${idRedacao}"]`);
    if (cardSelecionado) cardSelecionado.classList.add('selected');

    temaAtual = proposta.tema;

    const temaSelecionadoArea = document.getElementById('temaSelecionadoArea');
    const temaSelecionadoTexto = document.getElementById('temaSelecionadoTexto');

    temaSelecionadoTexto.innerHTML = `<i class="fas fa-tag"></i> ${escapeHtml(proposta.tema)}`;
    document.getElementById('propostaDataEntrega').textContent = 'A definir';
    temaSelecionadoArea.style.display = 'block';
    document.getElementById('titulo').value = proposta.titulo;
    temaSelecionadoArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    mostrarNotificacao('✅ Tema selecionado! Agora escreva sua redação.', 'success');
}

async function carregarTemaIA() {
    const temaContainer = document.getElementById('temaSemana');
    temaContainer.innerHTML = `
        <div class="tema-titulo"><i class="fas fa-spinner fa-pulse"></i> Gerando tema com IA...</div>
        <div class="tema-conteudo" style="text-align:center;">Aguarde...</div>
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
                    <div style="margin-top:15px;">
                        <button onclick="carregarTemaIA()" class="btn-novo-tema">
                            <i class="fas fa-dice"></i> Gerar novo tema
                        </button>
                    </div>
                `;
                return;
            }
        }
        throw new Error('Sem resposta da IA');
    } catch (error) {
        temaAtual = "Os desafios da educação brasileira no século XXI";
        temaContainer.innerHTML = `
            <div class="tema-titulo"><i class="fas fa-exclamation-triangle"></i> Erro de conexão</div>
            <div class="tema-conteudo">${temaAtual}</div>
            <button onclick="carregarTemaIA()" class="btn-novo-tema" style="margin-top:15px;">
                <i class="fas fa-sync-alt"></i> Tentar novamente
            </button>
        `;
    }
}

// ========== HISTÓRICO ==========
async function carregarHistoricoRedacoes() {
    const container = document.getElementById('historicoList');

    try {
        const response = await fetch(`${API_URL}/redacoes`);
        if (!response.ok) throw new Error('Erro ao carregar histórico');

        const todasRedacoes = await response.json();
        const minhasRedacoes = todasRedacoes.filter(red =>
            red.aluno?.id === ID_ALUNO_LOGADO && red.aluno?.id !== 6
        );

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
            const isCorrigida = red.pontuacaoObtida !== null && red.pontuacaoObtida !== undefined;
            const nota = red.pontuacaoObtida || 0;

            return `
                <div class="redacao-item" onclick="abrirModalDetalhes(${red.idRedacao})">
                    <div class="redacao-titulo">
                        <span>${escapeHtml(red.titulo || 'Sem título')}</span>
                    </div>
                    <div class="redacao-tema-mini">
                        <i class="fas fa-tag"></i> ${escapeHtml((red.tema || '').substring(0, 60))}...
                    </div>
                    <div>
                        <span class="redacao-status ${isCorrigida ? 'status-corrigida' : 'status-pendente'}">
                            ${isCorrigida ? `✅ Corrigida — ${nota}/1000` : '⏳ Aguardando correção'}
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

// ========== MODAL DETALHES ==========
async function abrirModalDetalhes(idRedacao) {
    const modal = document.getElementById('modalDetalhesRedacao');
    modal.classList.add('active');

    document.getElementById('detalhe-titulo').textContent = 'Carregando...';
    document.getElementById('detalhe-tema').textContent = '...';
    document.getElementById('detalhe-texto').textContent = '...';
    document.getElementById('detalhe-correcao').style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/redacoes/${idRedacao}`);
        if (!response.ok) throw new Error('Erro ao carregar');

        const red = await response.json();
        const isCorrigida = red.pontuacaoObtida !== null && red.pontuacaoObtida !== undefined;

        document.getElementById('detalhe-titulo').textContent = red.titulo || 'Sem título';
        document.getElementById('detalhe-tema').textContent = red.tema || 'Sem tema';
        document.getElementById('detalhe-texto').textContent = red.textoRedacao || 'Sem conteúdo';

        if (isCorrigida) {
            document.getElementById('detalhe-nota').innerHTML = `${red.pontuacaoObtida}<span>/1000</span>`;
            document.getElementById('detalhe-comentarios').textContent = red.comentarios || 'Sem comentários';
            document.getElementById('detalhe-correcao').style.display = 'block';
        }

    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao carregar detalhes da redação', 'error');
        fecharModalDetalhes();
    }
}

function fecharModalDetalhes() {
    document.getElementById('modalDetalhesRedacao').classList.remove('active');
}

// Fechar ao clicar fora
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalDetalhesRedacao');
    if (e.target === modal) fecharModalDetalhes();
});

// ========== ENVIAR REDAÇÃO ==========
async function enviarRedacao(event) {
    event.preventDefault();

    if (!tipoSelecionado) {
        mostrarNotificacao('Por favor, selecione o tipo de redação.', 'error');
        return;
    }

    const titulo = document.getElementById('titulo').value.trim();
    const conteudo = document.getElementById('conteudo').value.trim();
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;

    if (!titulo) { mostrarNotificacao('Por favor, insira um título para sua redação.', 'error'); return; }
    if (conteudo.length < 100) { mostrarNotificacao('Sua redação deve ter no mínimo 100 caracteres.', 'error'); return; }
    if (!temaAtual) { mostrarNotificacao('Aguarde o tema ser carregado.', 'error'); return; }

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
    submitBtn.disabled = true;

    try {
        const redacaoData = {
            aluno: { id: ID_ALUNO_LOGADO },
            tema: temaAtual,
            titulo: titulo,
            textoRedacao: conteudo
        };

        const response = await fetch(`${API_URL}/redacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(redacaoData)
        });

        const responseText = await response.text();
        if (!response.ok) throw new Error(responseText || 'Erro ao enviar redação');

        mostrarNotificacao('✅ Redação enviada com sucesso! Aguarde a correção do professor.', 'success');

        document.getElementById('titulo').value = '';
        document.getElementById('conteudo').value = '';
        document.querySelectorAll('.proposta-card').forEach(card => card.classList.remove('selected'));
        const temaSelecionadoArea = document.getElementById('temaSelecionadoArea');
        if (temaSelecionadoArea) temaSelecionadoArea.style.display = 'none';

        if (tipoSelecionado === 'ia') await carregarTemaIA();
        else temaAtual = null;

        await carregarHistoricoRedacoes();

    } catch (error) {
        console.error('Erro ao enviar:', error);
        mostrarNotificacao('❌ Erro ao enviar redação: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function limparFormulario() {
    if (confirm('Tem certeza que deseja limpar o formulário? Todo o texto será perdido.')) {
        document.getElementById('titulo').value = '';
        document.getElementById('conteudo').value = '';
        mostrarNotificacao('Formulário limpo!', 'info');
    }
}

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
    if (closeModal && modal) closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (modal && e.target === modal) modal.style.display = 'none'; });
}

function mostrarNotificacao(message, type) {
    const notification = document.createElement('div');
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position:fixed;bottom:20px;right:20px;
        background-color:${type === 'success' ? 'rgba(0,230,118,0.2)' : type === 'error' ? 'rgba(255,61,0,0.2)' : 'rgba(187,134,252,0.2)'};
        border:1px solid ${type === 'success' ? '#00E676' : type === 'error' ? '#FF3D00' : '#BB86FC'};
        color:${type === 'success' ? '#00E676' : type === 'error' ? '#FF3D00' : '#BB86FC'};
        padding:12px 20px;border-radius:8px;z-index:3000;
        animation:slideInRight 0.3s ease;display:flex;align-items:center;gap:10px;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function inicializarEventos() {
    document.getElementById('redacaoForm')?.addEventListener('submit', enviarRedacao);
    document.getElementById('clearBtn')?.addEventListener('click', limparFormulario);
    document.getElementById('refreshHistorico')?.addEventListener('click', () => {
        carregarHistoricoRedacoes();
        mostrarNotificacao('Histórico atualizado!', 'info');
    });
    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Deseja realmente sair?')) {
            localStorage.clear();
            window.location.href = '../../../Login/HTML/login.html';
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
    @keyframes fadeOut { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(100%)} }
`;
document.head.appendChild(style);

window.selecionarTipo = selecionarTipo;
window.carregarTemaIA = carregarTemaIA;
window.selecionarPropostaCard = selecionarPropostaCard;
window.abrirModalDetalhes = abrirModalDetalhes;
window.fecharModalDetalhes = fecharModalDetalhes;