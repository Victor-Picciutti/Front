// ============================================================
//  CONFIGURACAO
// ============================================================
const API_URL = 'http://localhost:8080';
//const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_PROFESSOR_LOGADO = 6;

// ============================================================
//  ESTADO
// ============================================================
let meusComunicados = [];
let comunicadoIdParaDeletar = null;

// ============================================================
//  INICIALIZACAO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarMeusComunicados();
    configurarEventos();
});

function configurarEventos() {
    document.getElementById('search-input').addEventListener('input', filtrarComunicados);

    document.getElementById('modalConfirmDelete').addEventListener('click', (e) => {
        if (e.target.id === 'modalConfirmDelete') fecharConfirmDelete();
    });

    document.getElementById('modal-leitura').addEventListener('click', (e) => {
        if (e.target.id === 'modal-leitura') fecharModalLeitura();
    });


}

// ============================================================
//  CARREGAR COMUNICADOS
// ============================================================
async function carregarMeusComunicados() {
    mostrarLoading(true);
    try {
        const resProf = await fetch(`${API_URL}/utilizadores/${ID_PROFESSOR_LOGADO}`);
        if (!resProf.ok) throw new Error(`Erro ao buscar professor: HTTP ${resProf.status}`);
        const professor = await resProf.json();
        const nomeProfessor = professor.nome;

        const res = await fetch(`${API_URL}/comunicados`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        let todos = await res.json();
        if (todos.content) todos = todos.content;

        meusComunicados = todos.filter(c =>
            c.utilizadorResponsavel === nomeProfessor
        );

    } catch (e) {
        console.error('Erro ao carregar comunicados:', e);
        mostrarErro('Não foi possível carregar os comunicados.');
    } finally {
        mostrarLoading(false);
    }

    renderizarLista();
    popularFiltroSerie();
}

// ============================================================
//  RENDERIZAR LISTA
// ============================================================
function renderizarLista(lista = meusComunicados) {
    const container = document.getElementById('meus-comunicados-list');
    const empty = document.getElementById('empty-state');

    if (lista.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    container.innerHTML = lista.map(com => `
        <div class="comunicado-card" id="card-${com.idComunicado}" 
    onclick="abrirModalLeitura(${com.idComunicado})"
    style="cursor:pointer;">
    <div class="card-actions">
        <button class="btn-card-action btn-deletar" title="Excluir"
            onclick="event.stopPropagation(); deletarComunicado(${com.idComunicado})">
            <i class="fas fa-times"></i>
        </button>
    </div>
            <div class="card-header">
                <h3 class="card-title">${com.titulo || 'Sem título'}</h3>
            </div>
            <div class="card-body">${com.descricao || ''}</div>
            <div class="card-footer">
                <span class="card-date">
                    <i class="fas fa-calendar-alt"></i> ${formatarData(com.dataEnvio)}
                </span>
                <span class="card-date">
                    <i class="fas fa-book"></i> ${com.disciplina?.nome || 'Geral'}
                </span>
            </div>
        </div>
    `).join('');
}

function abrirModalLeitura(id) {
    const com = meusComunicados.find(c => c.idComunicado === id);
    if (!com) return;

    document.getElementById('leitura-titulo').textContent = com.titulo || 'Sem título';
    document.getElementById('leitura-data').textContent = formatarData(com.dataEnvio);
    document.getElementById('leitura-disciplina').textContent = com.disciplina?.nome || 'Geral';
    document.getElementById('leitura-serie').textContent = com.serie?.nomeSerie || 'Sem série';
    document.getElementById('leitura-descricao').textContent = com.descricao || '';

    document.getElementById('modal-leitura').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function fecharModalLeitura() {
    document.getElementById('modal-leitura').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// ============================================================
//  FILTRAR
// ============================================================

let filtroSerieAtivo = '';

function popularFiltroSerie() {
    const seriesMap = new Map();
    meusComunicados.forEach(c => {
        if (c.serie?.id) seriesMap.set(String(c.serie.id), c.serie.nomeSerie);
    });

    const wrapper = document.getElementById('customSelectFiltroSerie');
    const optionsContainer = document.getElementById('customSelectFiltroSerieOptions');
    const trigger = wrapper.querySelector('.custom-select-trigger');

    // Opção "Todas"
    optionsContainer.innerHTML = '';
    const todas = document.createElement('div');
    todas.className = 'custom-option selected';
    todas.textContent = 'Todas as Séries';
    todas.addEventListener('click', (e) => {
        e.stopPropagation();
        filtroSerieAtivo = '';
        document.getElementById('customSelectFiltroSerieText').textContent = 'Todas as Séries';
        optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
        todas.classList.add('selected');
        wrapper.classList.remove('open');
        filtrarComunicados();
    });
    optionsContainer.appendChild(todas);

    seriesMap.forEach((nome, id) => {
        const option = document.createElement('div');
        option.className = 'custom-option';
        option.textContent = nome;
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            filtroSerieAtivo = id;
            document.getElementById('customSelectFiltroSerieText').textContent = nome;
            optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            wrapper.classList.remove('open');
            filtrarComunicados();
        });
        optionsContainer.appendChild(option);
    });

    trigger.addEventListener('click', () => {
        const rect = trigger.getBoundingClientRect();
        optionsContainer.style.top   = (rect.bottom + 4) + 'px';
        optionsContainer.style.left  = rect.left + 'px';
        optionsContainer.style.width = rect.width + 'px';
        wrapper.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#customSelectFiltroSerie')) wrapper.classList.remove('open');
    });
}

function filtrarComunicados() {
    const term = document.getElementById('search-input').value.toLowerCase();

    const filtrados = meusComunicados.filter(c => {
        const matchSearch = (c.titulo    || '').toLowerCase().includes(term) ||
                            (c.descricao || '').toLowerCase().includes(term);
        const matchSerie  = !filtroSerieAtivo || String(c.serie?.id) === filtroSerieAtivo;
        return matchSearch && matchSerie;
    });

    renderizarLista(filtrados);
}

function filtrarComunicados() {
    const term = document.getElementById('search-input').value.toLowerCase();

    const filtrados = meusComunicados.filter(c => {
        const matchSearch = (c.titulo    || '').toLowerCase().includes(term) ||
                            (c.descricao || '').toLowerCase().includes(term);
        const matchSerie  = !filtroSerieAtivo || String(c.serie?.id) === filtroSerieAtivo;
        return matchSearch && matchSerie;
    });

    renderizarLista(filtrados);
}

// ============================================================
//  DELETAR
// ============================================================
function deletarComunicado(id) {
    comunicadoIdParaDeletar = id;
    const modal = document.getElementById('modalConfirmDelete');
    modal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('active')));
}

function fecharConfirmDelete() {
    comunicadoIdParaDeletar = null;
    const modal = document.getElementById('modalConfirmDelete');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
}

async function confirmarDelete() {
    if (!comunicadoIdParaDeletar) return;

    const btnConfirmar = document.getElementById('btnConfirmarDelete');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';

    try {
        const res = await fetch(`${API_URL}/comunicados/${comunicadoIdParaDeletar}`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const card = document.getElementById(`card-${comunicadoIdParaDeletar}`);
        if (card) {
            card.style.transition = 'opacity 0.3s, transform 0.3s';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => card.remove(), 300);
        }

        meusComunicados = meusComunicados.filter(c => c.idComunicado !== comunicadoIdParaDeletar);
        fecharConfirmDelete();

    } catch (e) {
        console.error('Erro ao excluir:', e);
        alert('Erro ao excluir o comunicado.');
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '<i class="fas fa-trash"></i> Sim, excluir';
    }
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
    document.getElementById('meus-comunicados-list').innerHTML = `
        <div style="text-align:center; padding:3rem; color:var(--text-muted, #aaa);">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i>
            <p style="margin-top:1rem;">Carregando comunicados...</p>
        </div>
    `;
}

function mostrarErro(msg) {
    document.getElementById('meus-comunicados-list').innerHTML = `
        <div style="text-align:center; padding:3rem; color:#FF3D00;">
            <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
            <p style="margin-top:1rem;">${msg}</p>
        </div>
    `;
}