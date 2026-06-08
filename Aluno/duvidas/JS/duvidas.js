// ============================================================
//  CONFIGURAÇÃO
// ============================================================
const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_ALUNO_LOGADO = 1;

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let todasDuvidas = [];
let dadosAluno = null;
let duvidaIdParaDeletar = null;
let duvidaIdParaEditar = null;
let todasRespostas = [];

// ============================================================
//  PAGINAÇÃO
// ============================================================
const ITENS_POR_PAGINA = 12;
let paginaAtual = 1;

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosAluno();
    await carregarDisciplinas();
    await carregarMinhasDuvidas();
    inicializarFiltroStatus();
    inicializarSidebar();
    inicializarFechamentoModais();
    injetarAnimacoes();

    // Busca em tempo real
    document.getElementById('searchDuvida')?.addEventListener('input', () => {
        paginaAtual = 1;
        filterDuvidas();
    });
});

// ============================================================
//  UTILITÁRIO: montar um custom select genérico
//  Parâmetros:
//    wrapperId   — id do div.custom-select
//    optionsId   — id do div.custom-select-options
//    textId      — id do span que exibe o label atual
//    hiddenId    — id do input hidden que guarda o valor
//    items       — [{ value, label }]
//    placeholder — texto inicial (value = '')
//    onChange    — callback(value) disparado ao selecionar
// ============================================================
function montarCustomSelect({ wrapperId, optionsId, textId, hiddenId, items, placeholder, onChange }) {
    const wrapper = document.getElementById(wrapperId);
    const optionsContainer = document.getElementById(optionsId);
    const trigger = wrapper.querySelector('.custom-select-trigger');

    optionsContainer.innerHTML = '';

    // Opção placeholder
    const placeholderOpt = criarOpcao(placeholder, '', optionsContainer, textId, hiddenId, wrapper, onChange);
    placeholderOpt.classList.add('selected');
    optionsContainer.appendChild(placeholderOpt);

    // Demais opções
    items.forEach(({ value, label }) => {
        optionsContainer.appendChild(
            criarOpcao(label, value, optionsContainer, textId, hiddenId, wrapper, onChange)
        );
    });

    // Abrir/fechar ao clicar no trigger
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = trigger.getBoundingClientRect();
        optionsContainer.style.top   = (rect.bottom + 4) + 'px';
        optionsContainer.style.left  = rect.left + 'px';
        optionsContainer.style.width = rect.width + 'px';
        wrapper.classList.toggle('open');
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#' + wrapperId)) wrapper.classList.remove('open');
    });
}

function criarOpcao(label, value, container, textId, hiddenId, wrapper, onChange) {
    const option = document.createElement('div');
    option.className = 'custom-option';
    option.textContent = label;
    option.dataset.value = value;

    option.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById(hiddenId).value = value;
        document.getElementById(textId).textContent = label;
        container.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        wrapper.classList.remove('open');
        if (onChange) onChange(value);
    });

    return option;
}

// ============================================================
//  DADOS
// ============================================================
async function carregarDadosAluno() {
    try {
        const response = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        dadosAluno = await response.json();

        const serieElement = document.getElementById('serieAluno');
        if (serieElement) {
            serieElement.textContent = dadosAluno.serie?.nomeSerie || dadosAluno.serie || 'Não definida';
        }
    } catch (error) {
        console.error('Erro ao carregar aluno:', error);
    }
}

async function carregarDisciplinas() {
    try {
        const response = await fetch(`${API_URL}/disciplinas`);
        const disciplinas = await response.json();

        // ── Modal Nova Dúvida ──
        const trigger = document.querySelector('#customSelectDisciplina .custom-select-trigger');
        const wrapper  = document.getElementById('customSelectDisciplina');
        const options  = document.getElementById('customSelectOptions');

        trigger.addEventListener('click', () => {
            if (options.children.length === 0) {
                disciplinas.forEach(d => {
                    options.appendChild(
                        criarOpcao(d.nome, d.id, options, 'customSelectText', 'disciplina', wrapper, null)
                    );
                });
            }
            const rect = trigger.getBoundingClientRect();
            options.style.top   = (rect.bottom + 4) + 'px';
            options.style.left  = rect.left + 'px';
            options.style.width = rect.width + 'px';
            wrapper.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#customSelectDisciplina')) wrapper.classList.remove('open');
        });

        // ── Guarda disciplinas para uso posterior (filtros) ──
        window._disciplinasCache = disciplinas;

    } catch (erro) {
        console.error('Erro ao carregar disciplinas:', erro);
    }
}

async function carregarMinhasDuvidas() {
    const container = document.getElementById('duvidasList');
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-pulse"></i>
                <p>Carregando suas dúvidas...</p>
            </div>
        `;
    }

    try {
        const [todasResponse, respostas] = await Promise.all([
            fetch(`${API_URL}/duvidas`),
            carregarRespostas()
        ]);

        if (!todasResponse.ok) throw new Error(`HTTP ${todasResponse.status}`);

        const todas = await todasResponse.json();
        todasDuvidas = todas.filter(d => d.utilizador?.id == ID_ALUNO_LOGADO);

        const idsRespondidos = new Set(respostas.map(r => r.idDuvida));
        todasDuvidas = todasDuvidas.map(d => ({
            ...d,
            statusDuvida: idsRespondidos.has(d.idDuvida) ? 'Respondida' : 'Aberta'
        }));

        popularFiltroDisciplinas();

        const totalElement = document.getElementById('totalMinhasDuvidas');
        if (totalElement) totalElement.textContent = todasDuvidas.length;

        renderizarDuvidas(todasDuvidas);
    } catch (error) {
        console.error('Erro ao carregar dúvidas:', error);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar dúvidas</p>
                </div>
            `;
        }
    }
}

// ============================================================
//  POPULAR FILTRO DE DISCIPLINAS (custom select padrão)
// ============================================================
function popularFiltroDisciplinas() {
    const idsVistos = new Set();
    const disciplinasUnicas = [];

    todasDuvidas.forEach(duvida => {
        const disc = duvida.disciplina;
        if (disc && !idsVistos.has(disc.id)) {
            idsVistos.add(disc.id);
            disciplinasUnicas.push(disc);
        }
    });

    montarCustomSelect({
        wrapperId:  'filterSelectDisciplina',
        optionsId:  'filterDisciplinaOptions',
        textId:     'filterDisciplinaText',
        hiddenId:   'disciplinaFilter',
        items:      disciplinasUnicas.map(d => ({ value: String(d.id), label: d.nome })),
        placeholder: 'Todas as disciplinas',
        onChange:   () => { paginaAtual = 1; filterDuvidas(); }
    });
}

// ============================================================
//  INICIALIZAR FILTRO DE STATUS (custom select padrão)
// ============================================================
function inicializarFiltroStatus() {
    montarCustomSelect({
        wrapperId:  'filterSelectStatus',
        optionsId:  'filterStatusOptions',
        textId:     'filterStatusText',
        hiddenId:   'statusFilter',
        items: [
            { value: 'Aberta',     label: 'Aberta' },
            { value: 'Respondida', label: 'Respondida' },
        ],
        placeholder: 'Todos os status',
        onChange:   () => { paginaAtual = 1; filterDuvidas(); }
    });
}

// ============================================================
//  RENDERIZAÇÃO
// ============================================================
function renderizarDuvidas(duvidas) {
    const container = document.getElementById('duvidasList');
    if (!container) return;

    if (duvidas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Você ainda não tem nenhuma dúvida.</p>
                <button class="btn-primary" onclick="openModal()" style="margin-top: 15px;">
                    <i class="fas fa-plus"></i> Criar minha primeira dúvida
                </button>
            </div>
        `;
        renderizarPaginacao(0);
        return;
    }

    const totalPaginas = Math.ceil(duvidas.length / ITENS_POR_PAGINA);
    if (paginaAtual > totalPaginas) paginaAtual = 1;

    const inicio   = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const paginada = duvidas.slice(inicio, inicio + ITENS_POR_PAGINA);

    container.innerHTML = paginada.map(duvida => {
        const titulo     = duvida.titulo    || 'Sem título';
        const descricao  = duvida.descricao || 'Sem descrição';
        const status     = duvida.statusDuvida || 'Aberta';
        const disciplina = duvida.disciplina?.nome || 'Sem disciplina';

        return `
        <div class="duvida-card ${status === 'Respondida' ? 'card-respondida' : ''}"
            id="card-${duvida.idDuvida}"
            ${status === 'Respondida' ? `onclick="abrirModalResposta(${duvida.idDuvida})"` : ''}>
            <div class="card-actions">
                ${status !== 'Respondida' ? `
                <button class="btn-card-action btn-editar" title="Editar dúvida"
                    onclick="event.stopPropagation(); abrirModalEditar(${duvida.idDuvida}, '${escapeHtml(titulo)}', '${duvida.disciplina?.id}', '${escapeHtml(descricao)}')">
                    <i class="fas fa-pencil-alt"></i>
                </button>` : ''}
                <button class="btn-card-action btn-deletar" title="Excluir dúvida"
                    onclick="event.stopPropagation(); deletarDuvida(${duvida.idDuvida})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <h3>
                <i class="fas fa-question-circle" style="color: var(--primary-color); margin-right: 8px;"></i>
                ${escapeHtml(titulo)}
            </h3>
            <div class="descricao">${escapeHtml(descricao)}</div>
            <div class="meta">
                <span><i class="far fa-calendar-alt"></i> ${formatarData(duvida.momento)}</span>
                <span><i class="fas fa-book"></i> ${escapeHtml(disciplina)}</span>
                <span class="status-badge ${status}">${status}</span>
            </div>
        </div>
        `;
    }).join('');

    renderizarPaginacao(totalPaginas);
}

// ============================================================
//  PAGINAÇÃO - RENDER
// ============================================================
function renderizarPaginacao(totalPaginas) {
    let paginacaoEl = document.getElementById('paginacao');
    if (!paginacaoEl) {
        paginacaoEl = document.createElement('div');
        paginacaoEl.id = 'paginacao';
        document.getElementById('duvidasList').insertAdjacentElement('afterend', paginacaoEl);
    }

    if (totalPaginas <= 1) { paginacaoEl.innerHTML = ''; return; }

    const btnStyle = (dis) => `
        background: ${dis ? 'rgba(187,134,252,0.1)' : 'linear-gradient(135deg, #BB86FC, #a21fa2)'};
        color: ${dis ? 'var(--text-muted)' : '#000'};
        border: none; padding: 10px 20px; border-radius: 30px;
        cursor: ${dis ? 'not-allowed' : 'pointer'};
        font-weight: 700; font-size: 0.75rem;
        transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px;
    `;

    paginacaoEl.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; gap:15px; margin-top:30px;">
            <button onclick="mudarPagina(${paginaAtual - 1})" ${paginaAtual === 1 ? 'disabled' : ''} style="${btnStyle(paginaAtual === 1)}">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>
            <span style="color:var(--text-muted, #9E9E9E); font-size:0.9rem;">
                Página <strong style="color:#BB86FC;">${paginaAtual}</strong>
                de <strong style="color:#BB86FC;">${totalPaginas}</strong>
            </span>
            <button onclick="mudarPagina(${paginaAtual + 1})" ${paginaAtual === totalPaginas ? 'disabled' : ''} style="${btnStyle(paginaAtual === totalPaginas)}">
                Próxima <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    filterDuvidas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
//  FILTROS
// ============================================================
function filterDuvidas() {
    const searchTerm       = document.getElementById('searchDuvida')?.value.toLowerCase() || '';
    const statusFilter     = document.getElementById('statusFilter')?.value || '';
    const disciplinaFilter = document.getElementById('disciplinaFilter')?.value || '';

    let filtradas = [...todasDuvidas];

    if (searchTerm) {
        filtradas = filtradas.filter(d =>
            d.titulo?.toLowerCase().includes(searchTerm) ||
            d.descricao?.toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter) {
        filtradas = filtradas.filter(d => (d.statusDuvida || 'Aberta') === statusFilter);
    }

    if (disciplinaFilter) {
        filtradas = filtradas.filter(d => String(d.disciplina?.id) === disciplinaFilter);
    }

    renderizarDuvidas(filtradas);
}

// ============================================================
//  NOVA DÚVIDA
// ============================================================
async function submitDuvida(event) {
    event.preventDefault();

    const titulo    = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const idDisciplinaSelecionada = document.getElementById('disciplina').value;

    if (!titulo || !descricao) return showAlert('Preencha todos os campos!', 'error');
    if (!idDisciplinaSelecionada) return showAlert('Selecione uma disciplina!', 'error');

    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
    submitBtn.disabled = true;

    const novaDuvida = {
        titulo,
        descricao,
        momento: new Date().toISOString(),
        statusDuvida: 'Aberta',
        utilizador: { id: ID_ALUNO_LOGADO },
        disciplina: { id: parseInt(idDisciplinaSelecionada) }
    };

    try {
        const response = await fetch(`${API_URL}/duvidas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaDuvida)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        document.getElementById('duvidaForm').reset();
        // Resetar texto do custom select do modal
        document.getElementById('customSelectText').textContent = 'Selecione uma disciplina';
        document.getElementById('disciplina').value = '';
        closeModal();
        showAlert('✅ Dúvida enviada com sucesso!', 'success');
        paginaAtual = 1;
        await carregarMinhasDuvidas();
    } catch (error) {
        console.error('Erro:', error);
        showAlert('❌ Erro ao enviar dúvida: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ============================================================
//  RESPOSTAS
// ============================================================
async function carregarRespostas() {
    try {
        const response = await fetch(`${API_URL}/respostasDuvidas`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        todasRespostas = await response.json();
        return todasRespostas;
    } catch (error) {
        console.error('Erro ao carregar respostas:', error);
        todasRespostas = [];
        return [];
    }
}

function abrirModalResposta(idDuvida) {
    const resposta = todasRespostas.find(r => r.idDuvida === idDuvida);
    if (!resposta) return showAlert('Resposta não encontrada.', 'error');

    const duvida = todasDuvidas.find(d => d.idDuvida === idDuvida);

    document.getElementById('modalRespostaTitulo').textContent    = duvida?.titulo || 'Dúvida';
    document.getElementById('modalRespostaConteudo').textContent  = resposta.conteudoResposta || 'Sem conteúdo.';
    document.getElementById('modalRespostaData').textContent      = formatarData(resposta.momento);
    document.getElementById('modalRespostaProfessor').textContent = resposta.utilizador?.nome || 'Professor';

    const modal = document.getElementById('modalResposta');
    modal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('active')));
}

function fecharModalResposta() {
    const modal = document.getElementById('modalResposta');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
}

// ============================================================
//  DELETAR
// ============================================================
function deletarDuvida(id) {
    duvidaIdParaDeletar = id;
    const modal = document.getElementById('modalConfirmDelete');
    modal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('active')));
}

function fecharConfirmDelete() {
    duvidaIdParaDeletar = null;
    const modal = document.getElementById('modalConfirmDelete');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
}

async function confirmarDelete() {
    if (!duvidaIdParaDeletar) return;

    const btnConfirmar = document.getElementById('btnConfirmarDelete');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';

    try {
        const response = await fetch(`${API_URL}/duvidas/${duvidaIdParaDeletar}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        todasDuvidas = todasDuvidas.filter(d => d.idDuvida !== duvidaIdParaDeletar);
        document.getElementById('totalMinhasDuvidas').textContent = todasDuvidas.length;

        fecharConfirmDelete();
        showAlert('✅ Dúvida excluída com sucesso!', 'success');
        filterDuvidas();

    } catch (error) {
        console.error('Erro ao excluir:', error);
        showAlert('❌ Erro ao excluir a dúvida.', 'error');
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '<i class="fas fa-trash"></i> Sim, excluir';
    }
}

// ============================================================
//  EDITAR
// ============================================================
async function abrirModalEditar(id, titulo, disciplinaId, descricao) {
    duvidaIdParaEditar = id;

    document.getElementById('editTitulo').value    = titulo;
    document.getElementById('editDescricao').value = descricao;
    document.getElementById('editDisciplina').value = disciplinaId;

    const wrapper          = document.getElementById('customSelectEditDisciplina');
    const optionsContainer = document.getElementById('customSelectEditOptions');

    // Carrega disciplinas se ainda não carregou
    if (optionsContainer.children.length === 0) {
        try {
            const disciplinas = window._disciplinasCache || (await fetch(`${API_URL}/disciplinas`).then(r => r.json()));
            window._disciplinasCache = disciplinas;

            disciplinas.forEach(d => {
                optionsContainer.appendChild(
                    criarOpcao(d.nome, d.id, optionsContainer, 'customSelectEditText', 'editDisciplina', wrapper, null)
                );
            });
        } catch (e) {
            console.error('Erro ao carregar disciplinas no editar:', e);
        }
    }

    // Marca a disciplina atual como selecionada
    optionsContainer.querySelectorAll('.custom-option').forEach(o => {
        o.classList.remove('selected');
        if (String(o.dataset.value) === String(disciplinaId)) {
            o.classList.add('selected');
            document.getElementById('customSelectEditText').textContent = o.textContent;
        }
    });

    // Trigger de abertura
    const trigger = wrapper.querySelector('.custom-select-trigger');
    // Remove listener antigo para não duplicar
    const novoTrigger = trigger.cloneNode(true);
    trigger.parentNode.replaceChild(novoTrigger, trigger);

    novoTrigger.addEventListener('click', () => {
        const rect = novoTrigger.getBoundingClientRect();
        optionsContainer.style.top   = (rect.bottom + 4) + 'px';
        optionsContainer.style.left  = rect.left + 'px';
        optionsContainer.style.width = rect.width + 'px';
        wrapper.classList.toggle('open');
    });

    const modal = document.getElementById('modalEditar');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function fecharModalEditar() {
    duvidaIdParaEditar = null;
    document.getElementById('modalEditar').style.display = 'none';
    document.getElementById('editarForm').reset();
    document.getElementById('customSelectEditText').textContent = 'Selecione uma disciplina';
    document.body.style.overflow = 'auto';
}

async function salvarEdicao(event) {
    event.preventDefault();
    if (!duvidaIdParaEditar) return;

    const titulo       = document.getElementById('editTitulo').value.trim();
    const descricao    = document.getElementById('editDescricao').value.trim();
    const disciplinaId = document.getElementById('editDisciplina').value;

    const submitBtn = document.querySelector('#editarForm .btn-submit');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Salvando...';
    submitBtn.disabled = true;

    const body = {
        idDuvida: duvidaIdParaEditar,
        titulo,
        descricao,
        momento: new Date().toISOString(),
        statusDuvida: 'Aberta',
        utilizador: { id: ID_ALUNO_LOGADO },
        disciplina: { id: parseInt(disciplinaId) }
    };

    try {
        const response = await fetch(`${API_URL}/duvidas/${duvidaIdParaEditar}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        fecharModalEditar();
        showAlert('✅ Dúvida atualizada com sucesso!', 'success');
        await carregarMinhasDuvidas();
    } catch (error) {
        console.error('Erro ao editar:', error);
        showAlert('❌ Erro ao salvar alterações.', 'error');
    } finally {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar alterações';
        submitBtn.disabled = false;
    }
}

// ============================================================
//  MODAIS
// ============================================================
function openModal() {
    const modal = document.getElementById('modal');
    if (modal) { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('duvidaForm').reset();
        document.getElementById('customSelectText').textContent = 'Selecione uma disciplina';
        document.getElementById('disciplina').value = '';
        document.body.style.overflow = 'auto';
    }
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
               data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    } catch { return dataString; }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(alert);
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

function inicializarSidebar() {
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('active');
        });
    }
}

function inicializarFechamentoModais() {
    window.onclick = function (event) {
        if (event.target === document.getElementById('modalConfirmDelete')) fecharConfirmDelete();
        if (event.target === document.getElementById('modalEditar'))        fecharModalEditar();
        if (event.target === document.getElementById('modal'))              closeModal();
        if (event.target === document.getElementById('modalResposta'))      fecharModalResposta();
    };
}

function injetarAnimacoes() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(0); }
            to   { opacity: 0; transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
}