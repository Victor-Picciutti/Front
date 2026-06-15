// ============================================================
//  CONFIGURACAO
// ============================================================
const API_URL = 'http://localhost:8080';
//const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_ALUNO_LOGADO = 1;

// ============================================================
//  ESTADO
// ============================================================
let comunicadosLista = [];
let comunicadosFiltrados = [];
let idSerieAluno = null;
let professoresCache = {}; // { id: nome }

// ============================================================
//  INICIALIZACAO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarComunicados();
    configurarEventos();
});

// ============================================================
//  CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
    document.getElementById('search-input').addEventListener('input', () => filtrarComunicados());

    document.getElementById('modal-comunicado').addEventListener('click', (e) => {
        if (e.target.id === 'modal-comunicado') fecharModal();
    });

    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
            document.querySelector('.dashboard-content').classList.toggle('collapsed');
        });
    }
}

// ============================================================
//  CARREGAR COMUNICADOS
//  Fluxo: busca aluno → pega idSerie → busca comunicados da série
//         busca utilizador do professor pelo id para exibir o nome
// ============================================================
async function carregarComunicados() {
    mostrarLoading(true);

    try {
        // 1. Busca o aluno para pegar a série dele
        const resAluno = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
        if (!resAluno.ok) throw new Error(`Erro ao buscar aluno: HTTP ${resAluno.status}`);
        const aluno = await resAluno.json();

        idSerieAluno = aluno.serie?.id;
        if (!idSerieAluno) throw new Error('Aluno não possui série associada.');

        // 2. Busca todos os comunicados da série do aluno
        const resComunicados = await fetch(`${API_URL}/comunicados/serie/${idSerieAluno}`);
        if (!resComunicados.ok) throw new Error(`Erro ao buscar comunicados: HTTP ${resComunicados.status}`);

        comunicadosLista = await resComunicados.json();
        if (comunicadosLista.content) comunicadosLista = comunicadosLista.content;

        // 3. Busca o nome do professor (utilizadorResponsavel guarda o ID como string)
        //    Se vier o nome direto, pula essa etapa
        await resolverNomesProfessores();

        comunicadosFiltrados = [...comunicadosLista];
        popularFiltros();
        renderizarComunicados();

    } catch (err) {
        console.error('Erro:', err);
        mostrarErro('Não foi possível carregar os comunicados. Verifique a conexão.');
    } finally {
        mostrarLoading(false);
    }
}

// ============================================================
//  RESOLVER NOMES DOS PROFESSORES
//  utilizadorResponsavel pode ser o nome direto ou um id numérico
//  Se for numérico, busca o nome via /utilizadores/{id}
// ============================================================
async function resolverNomesProfessores() {
    const idsNumericos = [
        ...new Set(
            comunicadosLista
                .map(c => c.utilizadorResponsavel)
                .filter(v => v && !isNaN(v))
                .map(v => parseInt(v))
        )
    ];

    // Busca todos em paralelo
    await Promise.all(idsNumericos.map(async (id) => {
        try {
            const res = await fetch(`${API_URL}/utilizadores/${id}`);
            if (!res.ok) return;
            const user = await res.json();
            professoresCache[id] = user.nome || `Professor ${id}`;
        } catch {
            professoresCache[id] = `Professor ${id}`;
        }
    }));

    // Substitui o id pelo nome na lista
    comunicadosLista = comunicadosLista.map(c => ({
        ...c,
        nomeProfessor: resolverNome(c.utilizadorResponsavel)
    }));
}

function resolverNome(valor) {
    if (!valor) return 'Professor';
    if (!isNaN(valor)) return professoresCache[parseInt(valor)] || `Professor ${valor}`;
    return valor; // já é string com nome
}

// ============================================================
//  POPULAR FILTROS — por disciplina
// ============================================================
function popularFiltros() {
    const disciplinasMap = new Map();
    comunicadosLista.forEach(c => {
        if (c.disciplina?.id != null)
            disciplinasMap.set(String(c.disciplina.id), c.disciplina.nome);
    });

    const wrapper = document.getElementById('customSelectDisciplina');
    const optionsContainer = document.getElementById('customSelectDisciplinaOptions');
    const trigger = wrapper.querySelector('.custom-select-trigger');

    optionsContainer.innerHTML = '';

    // Opção "Todas"
    const geral = document.createElement('div');
    geral.className = 'custom-option';
    geral.textContent = 'Geral';
    geral.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('filter-materia').value = 'geral';
        document.getElementById('customSelectDisciplinaText').textContent = 'Geral';
        optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
        geral.classList.add('selected');
        wrapper.classList.remove('open');
        filtrarComunicados();
    });
    optionsContainer.appendChild(geral);

    disciplinasMap.forEach((nome, id) => {
        const option = document.createElement('div');
        option.className = 'custom-option';
        option.textContent = nome;
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('filter-materia').value = id;
            document.getElementById('customSelectDisciplinaText').textContent = nome;
            optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            wrapper.classList.remove('open');
            filtrarComunicados();
        });
        optionsContainer.appendChild(option);
    });

    trigger.addEventListener('click', () => {
        const rect = trigger.getBoundingClientRect();
        optionsContainer.style.top = (rect.bottom + 4) + 'px';
        optionsContainer.style.left = rect.left + 'px';
        optionsContainer.style.width = rect.width + 'px';
        wrapper.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#customSelectDisciplina')) wrapper.classList.remove('open');
    });
}

// ============================================================
//  RENDERIZAR COMUNICADOS
// ============================================================
function renderizarComunicados() {
    const list = document.getElementById('comunicados-list');
    const emptyState = document.getElementById('empty-state');

    if (comunicadosFiltrados.length === 0) {
        list.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    list.innerHTML = comunicadosFiltrados.map(com => `
        <div class="comunicado-card" onclick="abrirModal(${com.idComunicado})">
            <div class="comunicado-header">
                <h3 class="comunicado-titulo">${com.titulo || 'Sem título'}</h3>
                <span class="materia-badge">${com.disciplina?.nome || 'Geral'}</span>
            </div>
            <p class="comunicado-conteudo-preview">${com.descricao || ''}</p>
            <div class="comunicado-footer">
                <span><i class="fas fa-user"></i> ${com.nomeProfessor || 'Professor'}</span>
                <span><i class="fas fa-calendar-alt"></i> ${formatarData(com.dataEnvio)}</span>
            </div>
        </div>
    `).join('');
}

// ============================================================
//  FILTRAR COMUNICADOS
// ============================================================
function filtrarComunicados() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filtroDisciplina = document.getElementById('filter-materia').value;

    comunicadosFiltrados = comunicadosLista.filter(com => {
        const matchSearch = (com.titulo || '').toLowerCase().includes(searchTerm)
            || (com.descricao || '').toLowerCase().includes(searchTerm);

        const matchDisciplina = !filtroDisciplina
            || filtroDisciplina === 'geral' && !com.disciplina?.id
            || String(com.disciplina?.id ?? '') === filtroDisciplina;

        return matchSearch && matchDisciplina;
    });

    renderizarComunicados();
}

// ============================================================
//  MODAL
// ============================================================
function abrirModal(id) {
    const com = comunicadosLista.find(c => c.idComunicado === id);
    if (!com) return;

    document.getElementById('modal-titulo').textContent = com.titulo || 'Sem título';
    document.getElementById('modal-professor').textContent = com.nomeProfessor || 'Professor';
    document.getElementById('modal-materia').textContent = com.disciplina?.nome || 'Geral';
    document.getElementById('modal-data').textContent = formatarData(com.dataEnvio);
    document.getElementById('modal-conteudo').textContent = com.descricao || '';

    document.getElementById('modal-comunicado').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    document.getElementById('modal-comunicado').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function formatarData(valor) {
    if (!valor) return '—';
    const d = new Date(valor);
    if (isNaN(d)) return valor;
    return d.toLocaleDateString('pt-BR');
}

function mostrarLoading(show) {
    if (!show) return;
    document.getElementById('comunicados-list').innerHTML = `
        <div style="text-align:center; padding:3rem; color:var(--text-muted, #aaa);">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i>
            <p style="margin-top:1rem;">Carregando comunicados...</p>
        </div>
    `;
}

function mostrarErro(msg) {
    document.getElementById('comunicados-list').innerHTML = `
        <div style="text-align:center; padding:3rem; color:#FF3D00;">
            <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
            <p style="margin-top:1rem;">${msg}</p>
        </div>
    `;
}