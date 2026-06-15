// professor-redacoes.js - Correção de Redações

const API_URL = 'http://localhost:8080';
//const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_PROFESSOR_LOGADO = 6;

let todasRedacoes = [];
let redacaoAtual = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarRedacoes();
    inicializarEventos();
});

// ========== CARREGAR REDAÇÕES ==========
async function carregarRedacoes() {
    const container = document.getElementById('redacoesContainer');

    try {
        const response = await fetch(`${API_URL}/redacoes`);
        if (!response.ok) throw new Error('Erro ao carregar redações');

        todasRedacoes = await response.json();

        const redacoesAlunos = todasRedacoes.filter(red => red.aluno?.id !== ID_PROFESSOR_LOGADO);

        if (redacoesAlunos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Nenhuma redação encontrada.</p>
                </div>`;
            return;
        }

        renderizarRedacoes(redacoesAlunos);

    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar redações.</p>
            </div>`;
    }
}

function renderizarRedacoes(redacoes) {
    const container = document.getElementById('redacoesContainer');

    container.innerHTML = redacoes.map(red => {
        const nomeAluno = red.aluno?.nome || 'Aluno não identificado';
        const isCorrigida = red.pontuacaoObtida !== null && red.pontuacaoObtida !== undefined;
        const nota = red.pontuacaoObtida || 0;

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
    ${escapeHtml(red.titulo || 'Sem título')}
</div>
                <div class="redacao-preview">
                    ${escapeHtml((red.textoRedacao || '').substring(0, 200))}
                </div>
                <div class="card-footer-redacao">
                    ${isCorrigida ? `<span class="redacao-nota"><i class="fas fa-star"></i> ${nota}/1000</span>` : '<span></span>'}
                </div>
            </div>`;
    }).join('');
}

// ========== FILTRAR REDAÇÕES ==========
function filtrarRedacoes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    let filtradas = todasRedacoes.filter(red => red.aluno?.id !== ID_PROFESSOR_LOGADO);

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

        document.getElementById('modalAluno').textContent = redacaoAtual.aluno?.nome || 'Não identificado';
        document.getElementById('modalTurma').textContent = redacaoAtual.turma || 'Não definida';
        document.getElementById('modalTema').textContent = redacaoAtual.tema || 'Tema não definido';
        document.getElementById('modalTitulo').textContent = redacaoAtual.titulo || 'Sem título';
        document.getElementById('modalTexto').textContent = redacaoAtual.textoRedacao || 'Texto não disponível';

        document.getElementById('notaInput').value = redacaoAtual.pontuacaoObtida || '';
        document.getElementById('comentarioInput').value = redacaoAtual.comentarios || '';

        const isCorrigida = redacaoAtual.pontuacaoObtida !== null && redacaoAtual.pontuacaoObtida !== undefined;
        const modalFooter = document.querySelector('.modal-footer');

        if (isCorrigida) {
            // Desabilita os campos
            document.getElementById('notaInput').disabled = true;
            document.getElementById('comentarioInput').disabled = true;
            // Esconde o botão salvar e mostra aviso
            modalFooter.innerHTML = `
        <p style="color:#FF3D00; font-size:0.85rem; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-lock"></i> Esta redação já foi corrigida e não pode ser alterada.
        </p>
        <button class="btn-cancelar" id="cancelarBtn">Fechar</button>
    `;
            document.getElementById('cancelarBtn').onclick = fecharModal;
        } else {
            // Garante que os campos estejam habilitados
            document.getElementById('notaInput').disabled = false;
            document.getElementById('comentarioInput').disabled = false;
            // Restaura o footer padrão
            modalFooter.innerHTML = `
        <button class="btn-cancelar" id="cancelarBtn">Cancelar</button>
        <button class="btn-salvar" id="salvarCorrecaoBtn">
            <i class="fas fa-save"></i> Salvar Correção
        </button>
    `;
            document.getElementById('cancelarBtn').onclick = fecharModal;
            document.getElementById('salvarCorrecaoBtn').onclick = salvarCorrecao;
        }

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
        mostrarToast('Selecione todas as 5 competências.', 'info');
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
        if (!responseNota.ok) throw new Error('Erro ao salvar nota');

        const responseComentario = await fetch(`${API_URL}/redacoes/${redacaoAtual.idRedacao}/comentarios?comentarios=${encodeURIComponent(comentario)}`, {
            method: 'PATCH'
        });
        if (!responseComentario.ok) throw new Error('Erro ao salvar comentários');

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
    return text.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ========== EVENTOS ==========
function inicializarEventos() {
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelarBtn = document.getElementById('cancelarBtn');
    const salvarBtn = document.getElementById('salvarCorrecaoBtn');

    if (closeBtn) closeBtn.onclick = fecharModal;
    if (cancelarBtn) cancelarBtn.onclick = fecharModal;
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

window.filtrarRedacoes = filtrarRedacoes;
window.abrirModalCorrecao = abrirModalCorrecao;