// ============================================================
//  CONFIGURACAO
// ============================================================
//const API_URL = 'http://localhost:8080';
const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_PROFESSOR_LOGADO = 6; // substituir pelo ID real apos login

// ============================================================
//  ESTADO
// ============================================================
let duvidasLista = [];
let duvidasFiltradas = [];
let duvidasAtual = null;

// ============================================================
//  INICIALIZACAO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarDuvidas();
    configurarEventos();
});

// ============================================================
//  CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
    document.getElementById('search-input').addEventListener('input', () => filtrarDuvidas());
    document.getElementById('filter-disciplina').addEventListener('change', () => filtrarDuvidas());
    document.getElementById('filter-turma').addEventListener('change', () => filtrarDuvidas());
    document.getElementById('filter-status').addEventListener('change', () => filtrarDuvidas());

    document.getElementById('modal-resposta').addEventListener('click', (e) => {
        if (e.target.id === 'modal-resposta') fecharModal();
    });
}

// ============================================================
//  CARREGAR DÚVIDAS
//  - Busca TODAS as dúvidas + todas as respostas em paralelo
//  - Cruza os dados para calcular o status de cada dúvida
// ============================================================
async function carregarDuvidas() {
    try {
        // Busca dúvidas e respostas em paralelo
        const [resDuvidas, resRespostas] = await Promise.all([
            fetch(`${API_URL}/duvidas`),
            fetch(`${API_URL}/respostasDuvidas`)
        ]);

        if (!resDuvidas.ok) throw new Error(`HTTP ${resDuvidas.status}`);

        let todasDuvidas = await resDuvidas.json();

        // Suporta paginação Spring (Page<T>)
        if (todasDuvidas.content) todasDuvidas = todasDuvidas.content;

        // Monta um Set com os idDuvida que já foram respondidos
        let idsRespondidos = new Set();
        let respostasMap = new Map();
        if (resRespostas.ok) {
            const respostas = await resRespostas.json();
            // A entidade RespostaDuvida usa "idDuvida" como FK para Duvida
            respostas.forEach(r => {
                if (r.idDuvida) {
                    idsRespondidos.add(r.idDuvida);
                    respostasMap.set(r.idDuvida, r.conteudoResposta || '');
                }
            });
        }

        // Normaliza cada dúvida para o formato que o frontend espera
        duvidasLista = todasDuvidas.map(d => ({
            id: d.idDuvida,
            aluno: d.utilizador?.nome || 'Aluno desconhecido',
            disciplina: d.disciplina?.nome || 'Sem disciplina',
            turma: d.utilizador?.serie?.nomeSerie || d.utilizador?.turma || 'Sem turma',
            titulo: d.titulo || 'Sem título',
            descricao: d.descricao || '',
            data: formatarData(d.momento),
            status: idsRespondidos.has(d.idDuvida) ? 'respondida' : 'pendente',
            respondida: idsRespondidos.has(d.idDuvida),
            conteudoResposta: respostasMap.get(d.idDuvida) || '',
            _raw: d
        }));

        duvidasFiltradas = [...duvidasLista];
        renderizarDuvidas();
        atualizarEstatisticas();
        popularFiltros();

    } catch (err) {
        console.error('Erro ao carregar dúvidas:', err);
        showToast('Erro ao carregar dúvidas. Verifique o backend.', 'error');

        duvidasFiltradas = [...duvidasLista];
        renderizarDuvidas();
        atualizarEstatisticas();
        popularFiltros();
    }
}

function popularFiltros() {
    const disciplinas = [...new Set(duvidasLista.map(d => d.disciplina))];
    const turmas = [...new Set(duvidasLista.map(d => d.turma))];

    const selectDisc = document.getElementById('filter-disciplina');
    const selectTurma = document.getElementById('filter-turma');

    selectDisc.innerHTML = '<option value="">Todas as Disciplinas</option>';
    selectTurma.innerHTML = '<option value="">Todas as Turmas</option>';

    disciplinas.forEach(d => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = d;
        selectDisc.appendChild(opt);
    });

    turmas.forEach(t => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = t;
        selectTurma.appendChild(opt);
    });
}

// ============================================================
//  FILTRAR DÚVIDAS
// ============================================================
function filtrarDuvidas() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const disciplinaFilter = document.getElementById('filter-disciplina').value;
    const turmaFilter = document.getElementById('filter-turma').value;

    duvidasFiltradas = duvidasLista.filter(d =>
        (!searchTerm || d.titulo.toLowerCase().includes(searchTerm) || d.descricao.toLowerCase().includes(searchTerm) || d.aluno.toLowerCase().includes(searchTerm)) &&
        (!statusFilter || d.status === statusFilter) &&
        (!disciplinaFilter || d.disciplina === disciplinaFilter) &&
        (!turmaFilter || d.turma === turmaFilter)
    );

    renderizarDuvidas();
}

// ============================================================
//  RENDERIZAR DÚVIDAS
// ============================================================
function renderizarDuvidas() {
    const grid = document.getElementById('duvidas-grid');
    const emptyState = document.getElementById('empty-state');

    if (duvidasFiltradas.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = duvidasFiltradas.map(duvida => `
        <div class="duvida-card" onclick="abrirModal(${duvida.id})">
            <div class="duvida-header">
                <div class="duvida-aluno-info">
                    <span class="duvida-aluno-nome">${duvida.aluno}</span>
                    <span class="duvida-aluno-disciplina">${duvida.disciplina} | ${duvida.turma}</span>
                </div>
                <span class="duvida-status ${duvida.status}">
                    <i class="fas fa-${duvida.respondida ? 'check-circle' : 'clock'}"></i>
                    ${duvida.status === 'respondida' ? 'Respondida' : 'Pendente'}
                </span>
            </div>
            <h3 class="duvida-titulo">${duvida.titulo}</h3>
            <p class="duvida-descricao-preview">${duvida.descricao}</p>
            <div class="duvida-footer">
                <span class="duvida-data">
                    <i class="fas fa-calendar-alt"></i> ${duvida.data}
                </span>
                <div class="duvida-actions">
                    <button class="btn-icon" title="${duvida.respondida ? 'Já respondida' : 'Responder'}" 
                        ${duvida.respondida ? 'disabled' : `onclick="event.stopPropagation(); abrirModal(${duvida.id})"`}
                        style="${duvida.respondida ? 'opacity:0.4; cursor:not-allowed;' : ''}">
                        <i class="fas fa-reply"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================================
//  ABRIR MODAL
//  — Registra no localStorage que o professor está analisando
// ============================================================
function abrirModal(id) {
    duvidasAtual = duvidasLista.find(d => d.id === id);
    if (!duvidasAtual) return;

    // Sinaliza para o lado do aluno que esta dúvida está sendo analisada
    localStorage.setItem('professorAnalisando', id);

    document.getElementById('modal-aluno').textContent = duvidasAtual.aluno;
    document.getElementById('modal-disciplina').textContent = `${duvidasAtual.disciplina} (${duvidasAtual.turma})`;
    document.getElementById('modal-data').textContent = duvidasAtual.data;
    document.getElementById('modal-descricao').textContent = duvidasAtual.descricao;

    const textarea = document.getElementById('modal-resposta-text');
    const btnEnviar = document.querySelector('.modal-footer .btn-primary');

    if (duvidasAtual.respondida) {
        textarea.value = duvidasAtual.conteudoResposta || 'Resposta não disponível.';
        textarea.disabled = true;
        btnEnviar.disabled = true;
        btnEnviar.style.opacity = '0.5';
        btnEnviar.style.cursor = 'not-allowed';

        const jaExiste = document.getElementById('aviso-ja-respondida');
        if (jaExiste) jaExiste.remove();

        const aviso = document.createElement('p');
        aviso.id = 'aviso-ja-respondida';
        aviso.textContent = '⚠️ Esta dúvida já foi respondida e não pode ser alterada.';
        aviso.style.cssText = 'color:#e74c3c; font-size:0.82rem; margin-top:6px; font-weight:600;';
        textarea.insertAdjacentElement('afterend', aviso);

    } else {
        textarea.value = '';
        textarea.disabled = false;
        btnEnviar.disabled = false;
        btnEnviar.style.opacity = '';
        btnEnviar.style.cursor = '';
    }

    document.getElementById('modal-resposta').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ============================================================
//  FECHAR MODAL
//  — Remove o registro do localStorage ao sair
// ============================================================
function fecharModal() {
    // Libera a dúvida para edição pelo aluno
    localStorage.removeItem('professorAnalisando');

    document.getElementById('modal-resposta').classList.remove('show');
    document.body.style.overflow = 'auto';
    duvidasAtual = null;
}

// ============================================================
//  ENVIAR RESPOSTA
// ============================================================
async function enviarResposta() {
    if (!duvidasAtual) return;

    const conteudoResposta = document.getElementById('modal-resposta-text').value.trim();
    if (duvidasAtual.respondida) {
        showToast('Esta dúvida já foi respondida e não pode ser respondida novamente.', 'error');
        return;
    }

    if (!conteudoResposta) {
        showToast('Digite uma resposta antes de enviar.', 'error');
        return;
    }

    if (conteudoResposta.length > 2000) {
        showToast('A resposta não pode exceder 2000 caracteres.', 'error');
        return;
    }

    const btn = document.querySelector('.modal-footer .btn-primary');
    setLoading(btn, true, 'Enviando...');

    try {
        const res = await fetch(`${API_URL}/respostasDuvidas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idDuvida: duvidasAtual.id,
                conteudoResposta: conteudoResposta,
                momento: new Date().toISOString(),
                utilizador: { id: ID_PROFESSOR_LOGADO }
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Atualiza o estado local
        const idx = duvidasLista.findIndex(d => d.id === duvidasAtual.id);
        if (idx !== -1) {
            duvidasLista[idx].status = 'respondida';
            duvidasLista[idx].respondida = true;
            duvidasLista[idx].conteudoResposta = conteudoResposta;
        }

        showToast('Resposta enviada com sucesso!', 'success');
        fecharModal(); // já remove o localStorage internamente
        filtrarDuvidas();
        atualizarEstatisticas();

    } catch (err) {
        console.error('Erro ao enviar resposta:', err);
        showToast('Erro ao enviar resposta. Tente novamente.', 'error');
    } finally {
        setLoading(btn, false, '<i class="fas fa-paper-plane"></i> Enviar Resposta');
    }
}

// ============================================================
//  ATUALIZAR ESTATÍSTICAS
// ============================================================
function atualizarEstatisticas() {
    document.getElementById('stat-pendentes').textContent = duvidasLista.filter(d => d.status === 'pendente').length;
    document.getElementById('stat-respondidas').textContent = duvidasLista.filter(d => d.status === 'respondida').length;
    document.getElementById('stat-total').textContent = duvidasLista.length;
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' ' +
               data.toLocaleTimeString('pt-BR', { 
                   hour: '2-digit', 
                   minute: '2-digit',
                   timeZone: 'America/Sao_Paulo'
               });
    } catch {
        return dataString;
    }
}

function setLoading(btn, loading, html) {
    btn.disabled = loading;
    btn.innerHTML = loading ? `<i class="fas fa-spinner fa-spin"></i> ${html}` : html;
}

function showToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');

    document.getElementById('toast-msg').textContent = msg;
    toast.className = 'toast';

    if (tipo === 'error') {
        toast.classList.add('error');
        icon.className = 'fas fa-circle-xmark';
    } else {
        icon.className = 'fas fa-circle-check';
    }

    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}