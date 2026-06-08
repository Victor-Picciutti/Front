// historico-enem.js - Histórico de Redações

const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_ALUNO_LOGADO = 1;

// Variáveis globais
let todasRedacoes = [];
let desempenhoChart = null;
let periodoAtual = 6;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarHistorico();
    inicializarEventos();
    inicializarNotificacoes();
});

// ========== CARREGAR HISTÓRICO ==========
async function carregarHistorico() {
    const container = document.getElementById('redacoesList');
    
    try {
        const response = await fetch(`${API_URL}/redacoes`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar histórico');
        }
        
        const todas = await response.json();
        
        // Filtrar redações do aluno (excluir as do professor com idAluno = 6)
        todasRedacoes = todas.filter(red => red.aluno?.id === ID_ALUNO_LOGADO);
        
        // Ordenar por data (mais recente primeiro)
        todasRedacoes.sort((a, b) => {
            const dataA = a.dataEnvio ? new Date(a.dataEnvio) : new Date(0);
            const dataB = b.dataEnvio ? new Date(b.dataEnvio) : new Date(0);
            return dataB - dataA;
        });
        
        atualizarEstatisticas();
        renderizarGrafico();
        renderizarLista();
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar histórico. Tente novamente.</p>
            </div>
        `;
    }
}

function atualizarEstatisticas() {
    const total = todasRedacoes.length;
    const corrigidas = todasRedacoes.filter(r => r.pontuacaoObtida !== null && r.pontuacaoObtida !== undefined).length;
    const aguardando = total - corrigidas;
    
    let somaNotas = 0;
    let countNotas = 0;
    todasRedacoes.forEach(r => {
        if (r.pontuacaoObtida !== null && r.pontuacaoObtida !== undefined) {
            somaNotas += r.pontuacaoObtida;
            countNotas++;
        }
    });
    const media = countNotas > 0 ? (somaNotas / countNotas).toFixed(0) : 0;
    
    document.getElementById('totalRedacoes').textContent = total;
    document.getElementById('corrigidas').textContent = corrigidas;
    document.getElementById('aguardando').textContent = aguardando;
    document.getElementById('mediaNotas').textContent = media;
}

function renderizarLista() {
    const container = document.getElementById('redacoesList');
    
    if (todasRedacoes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Você ainda não enviou nenhuma redação.</p>
                <p>Escreva sua primeira redação na página principal!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = todasRedacoes.map(red => {
        const isCorrigida = red.pontuacaoObtida !== null && red.pontuacaoObtida !== undefined;
        const nota = red.pontuacaoObtida || 0;
        const data = red.dataEnvio ? new Date(red.dataEnvio).toLocaleDateString('pt-BR') : 'Data não disponível';
        
        return `
            <div class="redacao-item" onclick="abrirModal(${red.idRedacao})">
                <div class="redacao-header">
                    <span class="redacao-titulo">${escapeHtml(red.titulo || 'Sem título')}</span>
                    <span class="redacao-data"><i class="fas fa-calendar-alt"></i> ${data}</span>
                </div>
                <div class="redacao-tema">
                    <i class="fas fa-tag"></i> ${escapeHtml(red.tema || 'Tema não definido').substring(0, 80)}${red.tema?.length > 80 ? '...' : ''}
                </div>
                <div class="redacao-footer">
                    <span class="redacao-status ${isCorrigida ? 'status-corrigida' : 'status-pendente'}">
                        ${isCorrigida ? '✅ Corrigida' : '⏳ Aguardando correção'}
                    </span>
                    ${isCorrigida ? `<span class="redacao-nota"><i class="fas fa-star"></i> ${nota}/1000</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ========== GRÁFICO ==========
function renderizarGrafico() {
    const dadosPorMes = processarDadosPorMes();
    
    const labels = dadosPorMes.map(d => d.mes);
    const notas = dadosPorMes.map(d => d.media);
    
    const ctx = document.getElementById('desempenhoChart').getContext('2d');
    
    if (desempenhoChart) {
        desempenhoChart.destroy();
    }
    
    desempenhoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nota Média',
                data: notas,
                borderColor: '#BB86FC',
                backgroundColor: 'rgba(187, 134, 252, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#a21fa2',
                pointBorderColor: '#BB86FC',
                pointRadius: 5,
                pointHoverRadius: 8,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#E0E0E0' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Nota média: ${context.raw} pontos`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1000,
                    grid: { color: '#2a2a2a' },
                    title: {
                        display: true,
                        text: 'Nota (0-1000)',
                        color: '#9E9E9E'
                    }
                },
                x: {
                    grid: { color: '#2a2a2a' },
                    title: {
                        display: true,
                        text: 'Mês',
                        color: '#9E9E9E'
                    }
                }
            }
        }
    });
    
    // Atualizar estatísticas do gráfico
    const todasNotas = todasRedacoes.filter(r => r.pontuacaoObtida !== null).map(r => r.pontuacaoObtida);
    if (todasNotas.length > 0) {
        const melhor = Math.max(...todasNotas);
        const pior = Math.min(...todasNotas);
        const media = todasNotas.reduce((a, b) => a + b, 0) / todasNotas.length;
        const primeira = todasNotas[0] || 0;
        const ultima = todasNotas[todasNotas.length - 1] || 0;
        const evolucao = primeira > 0 ? ((ultima - primeira) / primeira * 100).toFixed(0) : 0;
        
        document.getElementById('melhorNota').textContent = melhor;
        document.getElementById('piorNota').textContent = pior;
        document.getElementById('mediaPeriodo').textContent = media.toFixed(0);
        document.getElementById('evolucao').innerHTML = `${evolucao >= 0 ? '+' : ''}${evolucao}% <i class="fas fa-arrow-${evolucao >= 0 ? 'up' : 'down'}" style="color: ${evolucao >= 0 ? '#00E676' : '#FF3D00'};"></i>`;
    }
}

function processarDadosPorMes() {
    const meses = {};
    
    todasRedacoes.forEach(red => {
        if (!red.dataEnvio) return;
        
        const data = new Date(red.dataEnvio);
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
        
        if (!meses[mesAno]) {
            meses[mesAno] = { soma: 0, count: 0 };
        }
        
        if (red.pontuacaoObtida !== null && red.pontuacaoObtida !== undefined) {
            meses[mesAno].soma += red.pontuacaoObtida;
            meses[mesAno].count++;
        }
    });
    
    const resultado = Object.entries(meses).map(([mes, dados]) => ({
        mes: mes,
        media: dados.count > 0 ? (dados.soma / dados.count).toFixed(0) : 0
    }));
    
    resultado.sort((a, b) => {
        const [mesA, anoA] = a.mes.split('/');
        const [mesB, anoB] = b.mes.split('/');
        return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
    });
    
    return resultado.slice(-periodoAtual);
}

function filtrarGrafico(periodo) {
    periodoAtual = periodo === 'all' ? 999 : parseInt(periodo);
    renderizarGrafico();
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period == periodo) {
            btn.classList.add('active');
        }
    });
}

// ========== MODAL ==========
async function abrirModal(idRedacao) {
    try {
        const response = await fetch(`${API_URL}/redacoes/${idRedacao}`);
        if (!response.ok) throw new Error('Erro ao carregar detalhes');
        
        const red = await response.json();
        
        const isCorrigida = red.pontuacaoObtida !== null && red.pontuacaoObtida !== undefined;
        const data = red.dataEnvio ? new Date(red.dataEnvio).toLocaleDateString('pt-BR') : 'Data não disponível';
        
        document.getElementById('modalTitulo').textContent = red.titulo || 'Sem título';
        document.getElementById('modalTema').textContent = red.tema || 'Tema não definido';
        document.getElementById('modalData').textContent = data;
        document.getElementById('modalNota').innerHTML = isCorrigida ? `${red.pontuacaoObtida}/1000` : '<span style="color: #FFC107;">Aguardando correção</span>';
        document.getElementById('modalComentario').textContent = red.comentarios || 'Nenhum comentário ainda.';
        document.getElementById('modalConteudo').textContent = red.textoRedacao || 'Texto não disponível';
        
        document.getElementById('redacaoModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarToast('Erro ao carregar detalhes da redação', 'error');
    }
}

function fecharModal() {
    document.getElementById('redacaoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
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

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${mensagem}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: ${tipo === 'success' ? 'rgba(0,230,118,0.2)' : 'rgba(255,61,0,0.2)'};
        border: 1px solid ${tipo === 'success' ? '#00E676' : '#FF3D00'};
        color: ${tipo === 'success' ? '#00E676' : '#FF3D00'};
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== EVENTOS ==========
function inicializarEventos() {
    // Refresh
    const refreshBtn = document.getElementById('refreshHistorico');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            carregarHistorico();
            mostrarToast('Histórico atualizado!', 'success');
        });
    }
    
    // Filtros do gráfico
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filtrarGrafico(btn.dataset.period);
        });
    });
    
    // Modal
    const closeBtn = document.getElementById('closeModalBtn');
    const fecharBtn = document.getElementById('fecharModalBtn');
    
    if (closeBtn) closeBtn.onclick = fecharModal;
    if (fecharBtn) fecharBtn.onclick = fecharModal;
    
    window.onclick = function(event) {
        const modal = document.getElementById('redacaoModal');
        if (event.target === modal) fecharModal();
    };
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            if (confirm('Deseja realmente sair?')) {
                localStorage.clear();
                window.location.href = '../../../Login/HTML/login.html';
            }
        };
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Expor funções globalmente
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;