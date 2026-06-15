// professor-redacoes.js - Correção de Redações (Versão Simplificada)

const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_PROFESSOR_LOGADO = 6;

// Variáveis globais
let todasRedacoes = [];
let redacaoAtual = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarRedacoes();
    inicializarEventos();
});

// ========== CARREGAR REDAÇÕES DA API ==========
async function carregarRedacoes() {
    const container = document.getElementById('redacoesContainer');

    try {
        const response = await fetch(`${API_URL}/redacoes`);

        if (!response.ok) {
            throw new Error('Erro ao carregar redações');
        }

        todasRedacoes = await response.json();

        // FIX: campo correto é idUtilizador, não id
        const redacoesAlunos = todasRedacoes.filter(red => red.aluno?.idUtilizador !== ID_PROFESSOR_LOGADO);

        if (redacoesAlunos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Nenhuma redação encontrada.</p>
                </div>
            `;
            return;
        }

        renderizarRedacoes(redacoesAlunos);

    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar redações.</p>
            </div>
        `;
    }
}

function renderizarRedacoes(redacoes) {
    const container = document.getElementById('redacoesContainer');

    container.innerHTML = redacoes.map(red => {
        const nomeAluno = red.aluno?.nome || 'Aluno não identificado';
        const isCorrigida = red.pontuacaoObtida !== null && red.pontuacaoObtida !== undefined;
        const nota = red.pontuacaoObtida || 0;

        // FIX: tenta os dois campos possíveis de data
        const dataRaw = red.dataEnvio || red.dataCriacao || red.data || null;
        const dataEnvio = dataRaw
            ? new Date(dataRaw).toLocaleDateString('pt-BR')
            : 'Data não disponível';

        return `
            <div class="redacao-card" onclick="abrirModalCorrecao(${red.idRedacao})">
                <div class="card-header-redacao">
                    <div class="aluno-info">
                        <div class="aluno-avatar">${nomeAluno.charAt(0).toUpperCase()}</div>
                        <div class="aluno-nome">${escapeHtml(nomeAluno)}</div>
                    </div>
                    <div class="status-badge ${isCorrigida ? 'status-corrigida' : 'status-pendente'}">
                        ${isCorrigida ? '✅ Corrigida' : '⏳ Pendente'}
                    </div>
                </div>
                <div class="redacao-tema">
                    <i class="fas fa-tag"></i> ${escapeHtml(red.tema || 'Tema não definido')}
                </div>
                <div class="redacao-titulo">
                    <i class="fas fa-heading"></i> ${escapeHtml(red.titulo || 'Sem título')}
                </div>
                <div class="redacao-preview">
                    ${escapeHtml((red.textoRedacao || '').substring(0, 200))}
                </div>
                <div class="card-footer-redacao">
                    <span><i class="fas fa-calendar"></i> ${dataEnvio}</span>
                    ${isCorrigida ? `<span class="redacao-nota"><i class="fas fa-star"></i> ${nota}/1000</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ========== FILTRAR REDAÇÕES ==========
function filtrarRedacoes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    // FIX: campo correto é idUtilizador
    let filtradas = todasRedacoes.filter(red => red.aluno?.idUtilizador !== ID_PROFESSOR_LOGADO);

    if (statusFilter !== 'todos') {
        filtradas = filtradas.filter(red => {
            const isCorrigida = red.pontuacaoObtida !== null && red.pontuacaoObtida !== undefined;
            if (statusFilter === 'pendente') return !isCorrigida;
            if (statusFilter === 'corrigida') return isCorrigida;
            return true;
        });
    }

    if (searchTerm) {
        filtradas = filtradas.filter(red => {
            const nomeAluno = (red.aluno?.nome || '').toLowerCase();
            const titulo = (red.titulo || '').toLowerCase();
            const tema = (red.tema || '').toLowerCase();
            return nomeAluno.includes(searchTerm) || titulo.includes(searchTerm) || tema.includes(searchTerm);
        });
    }

    renderizarRedacoes(filtradas);
}

// ========== ABRIR MODAL DE CORREÇÃO ==========
async function abrirModalCorrecao(idRedacao) {
    try {
        const response = await fetch(`${API_URL}/redacoes/${idRedacao}`);
        if (!response.ok) throw new Error('Erro ao carregar redação');

        redacaoAtual = await response.json();

        // FIX: tenta os dois campos possíveis de turma
        const turma = redacaoAtual.turma || redacaoAtual.aluno?.turma || 'Não definida';

        // FIX: tenta os dois campos possíveis de data
        const dataRaw = redacaoAtual.dataEnvio || redacaoAtual.dataCriacao || redacaoAtual.data || null;
        const dataFormatada = dataRaw
            ? new Date(dataRaw).toLocaleDateString('pt-BR')
            : 'Data não disponível';

        document.getElementById('modalAluno').textContent = redacaoAtual.aluno?.nome || 'Não identificado';
        document.getElementById('modalTurma').textContent = turma;
        document.getElementById('modalTema').textContent = redacaoAtual.tema || 'Tema não definido';
        document.getElementById('modalTitulo').textContent = redacaoAtual.titulo || 'Sem título';
        document.getElementById('modalData').textContent = dataFormatada;
        document.getElementById('modalTexto').textContent = redacaoAtual.textoRedacao || 'Texto não disponível';

        const nota = redacaoAtual.pontuacaoObtida || '';
        document.getElementById('notaInput').value = nota;
        document.getElementById('comentarioInput').value = redacaoAtual.comentarios || '';

        document.querySelectorAll('.nota-competencia').forEach(select => {
            select.value = '--';
        });

        document.getElementById('correcaoModal').style.display = 'block';
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Erro:', error);
        mostrarToast('Erro ao carregar redação', 'error');
    }
}

// ========== CALCULAR NOTA DAS COMPETÊNCIAS ==========
function calcularNotaPorCompetencias() {
    let total = 0;
    let count = 0;

    document.querySelectorAll('.nota-competencia').forEach(select => {
        const valor = parseInt(select.value);
        if (!isNaN(valor) && valor > 0) {
            total += valor;
            count++;
        }
    });

    if (count === 5) {
        document.getElementById('notaInput').value = total;
        mostrarToast(`Nota calculada: ${total}/1000`, 'success');
    } else {
        mostrarToast(`Selecione todas as 5 competências.`, 'info');
    }
}

// ========== SALVAR CORREÇÃO ==========
async function salvarCorrecao() {
    if (!redacaoAtual) return;

    const nota = parseFloat(document.getElementById('notaInput').value) || 0;
    const comentario = document.getElementById('comentarioInput').value;

    if (nota < 0 || nota > 1000) {
        mostrarToast('A nota deve estar entre 0 e 1000', 'error');
        return;
    }

    const btnSalvar = document.getElementById('salvarCorrecaoBtn');
    const originalText = btnSalvar.innerHTML;
    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Salvando...';

    try {
        const responseNota = await fetch(`${API_URL}/redacoes/${redacaoAtual.idRedacao}/pontuacao?pontuacaoObtida=${nota}`, {
            method: 'PATCH'
        });

        if (!responseNota.ok) {
            throw new Error('Erro ao salvar nota');
        }

        const responseComentario = await fetch(`${API_URL}/redacoes/${redacaoAtual.idRedacao}/comentarios?comentarios=${encodeURIComponent(comentario)}`, {
            method: 'PATCH'
        });

        if (!responseComentario.ok) {
            throw new Error('Erro ao salvar comentários');
        }

        mostrarToast('✅ Redação corrigida com sucesso!', 'success');

        redacaoAtual.pontuacaoObtida = nota;
        redacaoAtual.comentarios = comentario;

        await carregarRedacoes();
        fecharModal();

    } catch (error) {
        console.error('Erro:', error);
        mostrarToast('❌ Erro ao salvar correção: ' + error.message, 'error');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = originalText;
    }
}

function fecharModal() {
    document.getElementById('correcaoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    redacaoAtual = null;
}

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        const newToast = document.createElement('div');
        newToast.id = 'toast';
        newToast.className = 'toast';
        newToast.innerHTML = `<i id="toast-icon" class="fas fa-circle-check"></i><span id="toast-msg"></span>`;
        document.body.appendChild(newToast);
    }

    const toastEl = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const msgEl = document.getElementById('toast-msg');
    if (!toastEl) return;

    msgEl.textContent = mensagem;
    toastEl.className = 'toast';

    if (tipo === 'error') {
        toastEl.classList.add('error');
        icon.className = 'fas fa-circle-xmark';
    } else if (tipo === 'info') {
        toastEl.classList.add('info');
        icon.className = 'fas fa-info-circle';
    } else {
        icon.className = 'fas fa-circle-check';
    }

    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== EVENTOS ==========
function inicializarEventos() {
    const btnCalcular = document.getElementById('calcularCompetencias');
    if (btnCalcular) {
        btnCalcular.addEventListener('click', calcularNotaPorCompetencias);
    }

    const closeBtn = document.getElementById('closeModalBtn');
    const cancelarBtn = document.getElementById('cancelarBtn');

    if (closeBtn) closeBtn.onclick = fecharModal;
    if (cancelarBtn) cancelarBtn.onclick = fecharModal;

    const salvarBtn = document.getElementById('salvarCorrecaoBtn');
    if (salvarBtn) salvarBtn.onclick = salvarCorrecao;

    window.onclick = function (event) {
        const modal = document.getElementById('correcaoModal');
        if (event.target === modal) fecharModal();
    };

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function (e) {
            e.preventDefault();
            if (confirm('Deseja realmente sair?')) {
                localStorage.clear();
                window.location.href = '../../../Login/HTML/login.html';
            }
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const competenciasDiv = document.querySelector('.competencias');
    if (competenciasDiv && !document.getElementById('calcularCompetencias')) {
        const btnCalcular = document.createElement('button');
        btnCalcular.id = 'calcularCompetencias';
        btnCalcular.className = 'btn-calcular-competencias';
        btnCalcular.innerHTML = '<i class="fas fa-calculator"></i> Calcular nota pelas competências';
        competenciasDiv.appendChild(btnCalcular);
        btnCalcular.addEventListener('click', calcularNotaPorCompetencias);
    }
});

// Expor funções globalmente
window.filtrarRedacoes = filtrarRedacoes;
window.abrirModalCorrecao = abrirModalCorrecao;