// ============================================================
//  CONFIGURAÇÃO
// ============================================================
const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_ALUNO_LOGADO = 1;

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let todasAtividades = [];
let atividadesRespondidas = [];
let dadosAluno = null;
let atividadeAtual = null;
let perguntasAtuais = [];
let respostasTextuais = {};

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosAluno();
    await carregarAtividades();
    await carregarAtividadesRespondidas();
    popularFiltros();           // monta os custom selects após dados carregados
    renderizarAtividades();

    // Busca em tempo real
    document.getElementById('searchAtividade')?.addEventListener('input', () => {
        paginaAtual = 1;
        renderizarAtividades();
    });
});

// ============================================================
//  UTILITÁRIO: montar um custom select genérico
// ============================================================
function montarCustomSelect({ wrapperId, optionsId, textId, hiddenId, items, placeholder, onChange }) {
    const wrapper = document.getElementById(wrapperId);
    const optionsContainer = document.getElementById(optionsId);
    const trigger = wrapper.querySelector('.custom-select-trigger');

    optionsContainer.innerHTML = '';

    // Opção placeholder (valor vazio)
    const placeholderOpt = criarOpcao(placeholder, '', optionsContainer, textId, hiddenId, wrapper, onChange);
    placeholderOpt.classList.add('selected');
    optionsContainer.appendChild(placeholderOpt);

    // Demais opções
    items.forEach(({ value, label }) => {
        optionsContainer.appendChild(
            criarOpcao(label, value, optionsContainer, textId, hiddenId, wrapper, onChange)
        );
    });

    // Abrir/fechar
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Fecha todos os outros abertos
        document.querySelectorAll('.custom-select.open').forEach(el => {
            if (el.id !== wrapperId) el.classList.remove('open');
        });
        const rect = trigger.getBoundingClientRect();
        optionsContainer.style.top   = (rect.bottom + 4) + 'px';
        optionsContainer.style.left  = rect.left + 'px';
        optionsContainer.style.width = rect.width + 'px';
        wrapper.classList.toggle('open');
    });

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
//  POPULAR FILTROS — custom selects padrão comunicados
// ============================================================
function popularFiltros() {
    // ── Status ──
    montarCustomSelect({
        wrapperId:  'filterSelectStatus',
        optionsId:  'filterStatusOptions',
        textId:     'filterStatusText',
        hiddenId:   'statusFilter',
        items: [
            { value: 'pendente',  label: 'Pendentes' },
            { value: 'concluida', label: 'Concluídas' }
        ],
        placeholder: 'Todas',
        onChange: () => { paginaAtual = 1; renderizarAtividades(); }
    });

    // ── Dificuldade ──
    const dificuldades = [...new Set(
        todasAtividades.map(a => a.nivelDificuldade?.nome).filter(Boolean)
    )];

    montarCustomSelect({
        wrapperId:  'filterSelectDificuldade',
        optionsId:  'filterDificuldadeOptions',
        textId:     'filterDificuldadeText',
        hiddenId:   'dificuldadeFilter',
        items:      dificuldades.map(d => ({ value: d, label: d })),
        placeholder: 'Dificuldade',
        onChange: () => { paginaAtual = 1; renderizarAtividades(); }
    });

    // ── Disciplina ──
    const disciplinas = [...new Set(
        todasAtividades.map(a => a.disciplina?.nome).filter(Boolean)
    )];

    montarCustomSelect({
        wrapperId:  'filterSelectDisciplina',
        optionsId:  'filterDisciplinaOptions',
        textId:     'filterDisciplinaText',
        hiddenId:   'disciplinaFilter',
        items:      disciplinas.map(d => ({ value: d, label: d })),
        placeholder: 'Disciplina',
        onChange: () => { paginaAtual = 1; renderizarAtividades(); }
    });
}

// ============================================================
//  DADOS
// ============================================================
async function carregarDadosAluno() {
    try {
        const response = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error('Erro ao carregar aluno');
        dadosAluno = await response.json();
    } catch (error) {
        console.error('Erro ao carregar aluno:', error);
    }
}

async function carregarAtividades() {
    const container = document.getElementById('atividadesList');
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i><p>Carregando atividades...</p></div>';

    try {
        const response = await fetch(`${API_URL}/atividades`);
        if (!response.ok) throw new Error('Erro ao carregar atividades');
        todasAtividades = await response.json();
        document.getElementById('totalAtividades').textContent = todasAtividades.length;
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar atividades</p></div>';
    }
}

async function carregarAtividadesRespondidas() {
    try {
        const response = await fetch(`${API_URL}/atividadesrespostas`);
        if (response.ok) {
            atividadesRespondidas = await response.json();

            const minhasRespostas = atividadesRespondidas.filter(r => r.aluno?.id === ID_ALUNO_LOGADO);
            document.getElementById('atividadesConcluidas').textContent = minhasRespostas.length;

            if (minhasRespostas.length > 0) {
                const soma = minhasRespostas.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
                const media = (soma / minhasRespostas.length).toFixed(1);
                const el = document.getElementById('mediaGeral');
                if (el) el.textContent = media;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar respostas:', error);
    }
}

// ============================================================
//  PAGINAÇÃO
// ============================================================
const ITENS_POR_PAGINA = 12;
let paginaAtual = 1;

// ============================================================
//  RENDERIZAR ATIVIDADES
// ============================================================
function renderizarAtividades() {
    const container = document.getElementById('atividadesList');
    const filtroStatus      = document.getElementById('statusFilter')?.value      || '';
    const busca             = document.getElementById('searchAtividade')?.value.toLowerCase() || '';
    const filtroDificuldade = document.getElementById('dificuldadeFilter')?.value || '';
    const filtroDisciplina  = document.getElementById('disciplinaFilter')?.value  || '';

    let atividadesFiltradas = [...todasAtividades].sort((a, b) => b.idAtividade - a.idAtividade);

    if (filtroStatus === 'pendente') {
        atividadesFiltradas = atividadesFiltradas.filter(a => !isAtividadeConcluida(a.idAtividade));
    } else if (filtroStatus === 'concluida') {
        atividadesFiltradas = atividadesFiltradas.filter(a => isAtividadeConcluida(a.idAtividade));
    }

    if (busca) {
        atividadesFiltradas = atividadesFiltradas.filter(a =>
            a.titulo?.toLowerCase().includes(busca)
        );
    }

    if (filtroDificuldade) {
        atividadesFiltradas = atividadesFiltradas.filter(a =>
            a.nivelDificuldade?.nome === filtroDificuldade
        );
    }

    if (filtroDisciplina) {
        atividadesFiltradas = atividadesFiltradas.filter(a =>
            a.disciplina?.nome === filtroDisciplina
        );
    }

    if (atividadesFiltradas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma atividade encontrada.</p>
            </div>
        `;
        const paginacaoEl = document.getElementById('paginacao');
        if (paginacaoEl) paginacaoEl.innerHTML = '';
        return;
    }

    const totalPaginas = Math.ceil(atividadesFiltradas.length / ITENS_POR_PAGINA);
    if (paginaAtual > totalPaginas) paginaAtual = 1;

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const atividadesPagina = atividadesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);

    container.innerHTML = atividadesPagina.map(atividade => {
        const concluida = isAtividadeConcluida(atividade.idAtividade);
        const resposta = atividadesRespondidas.find(
            r => r.atividade?.idAtividade === atividade.idAtividade && r.aluno?.id === ID_ALUNO_LOGADO
        );
        const nota = resposta?.pontuacao ?? '—';

        return `
            <div class="atividade-card" onclick="abrirAtividade(${atividade.idAtividade})">
                <h3><i class="fas fa-file-alt" style="color: var(--primary-color); margin-right: 8px;"></i>${escapeHtml(atividade.titulo || 'Sem título')}</h3>
                <div class="info">
                    <span><i class="fas fa-calendar-alt"></i> ${formatarData(atividade.dataCriacao)}</span>
                    <span class="pontuacao"><i class="fas fa-star"></i> Max: ${atividade.pontuacaoMaxima || 0} pts</span>
                </div>
                <div class="info">
                    <span><i class="fas fa-chart-line"></i> Nível: ${atividade.nivelDificuldade?.nome || 'Não definido'}</span>
                </div>
                <div class="info">
                    <span><i class="fas fa-book"></i> Disciplina: ${atividade.disciplina?.nome || 'Não definida'}</span>
                    <span class="status ${concluida ? 'concluida' : 'pendente'}">
                        ${concluida ? 'Respondida' : 'Pendente'}
                    </span>
                </div>
                ${concluida ? `
                    <div class="nota-aluno">
                        <span class="nota-label-card">Sua nota</span>
                        <span class="nota-valor">${nota} / ${atividade.pontuacaoMaxima || 0}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    renderizarPaginacao(totalPaginas);
}

function renderizarPaginacao(totalPaginas) {
    let paginacaoEl = document.getElementById('paginacao');
    if (!paginacaoEl) {
        paginacaoEl = document.createElement('div');
        paginacaoEl.id = 'paginacao';
        document.getElementById('atividadesList').insertAdjacentElement('afterend', paginacaoEl);
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
            <span style="color:var(--text-muted); font-size:0.9rem;">
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
    renderizarAtividades();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
//  FILTRAR (chamado apenas por busca — selects usam onChange)
// ============================================================
function filterAtividades() {
    paginaAtual = 1;
    renderizarAtividades();
}

// ============================================================
//  ABRIR ATIVIDADE
// ============================================================
function isAtividadeConcluida(idAtividade) {
    return atividadesRespondidas.some(
        r => r.atividade?.idAtividade === idAtividade && r.aluno?.id === ID_ALUNO_LOGADO
    );
}

async function abrirAtividade(idAtividade) {
    atividadeAtual = todasAtividades.find(a => a.idAtividade === idAtividade);
    if (!atividadeAtual) return;

    if (isAtividadeConcluida(idAtividade)) {
        showAlert('⚠️ Você já realizou esta atividade!', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/atividadeconteudo/${idAtividade}/temArquivo`);
        const temPDF = await response.json();

        if (temPDF) {
            window.location.href = `visualizarPDF.html?id=${idAtividade}`;
        } else {
            window.location.href = `responderAtividade.html?id=${idAtividade}`;
        }
    } catch (error) {
        console.error("Erro ao verificar PDF:", error);
        window.location.href = `responderAtividade.html?id=${idAtividade}`;
    }
}

// ============================================================
//  CARREGAR PERGUNTAS
// ============================================================
async function carregarPerguntas(idAtividade) {
    try {
        const response = await fetch(`${API_URL}/atividadesPergunta`);
        if (!response.ok) throw new Error('Erro ao carregar perguntas');

        const todasPerguntas = await response.json();
        perguntasAtuais = todasPerguntas.filter(p => p.atividade?.idAtividade === idAtividade);

        if (perguntasAtuais.length === 0) {
            showAlert('Esta atividade não possui perguntas!', 'error');
            return;
        }

        respostasTextuais = {};

        document.getElementById('modalTitulo').textContent = atividadeAtual.titulo;
        document.getElementById('modalInfoAtividade').innerHTML = `
            <div class="atividade-info-box">
                <div class="atividade-info-item">
                    <i class="fas fa-book"></i>
                    <div>
                        <span>Disciplina</span>
                        <strong>${atividadeAtual.disciplina?.nome || 'Não definida'}</strong>
                    </div>
                </div>
                <div class="atividade-info-item">
                    <i class="fas fa-layer-group"></i>
                    <div>
                        <span>Dificuldade</span>
                        <strong>${atividadeAtual.nivelDificuldade?.nome || 'Não definida'}</strong>
                    </div>
                </div>
                <div class="atividade-info-item">
                    <i class="fas fa-star"></i>
                    <div>
                        <span>Pontuação</span>
                        <strong>${atividadeAtual.pontuacaoMaxima || 0} pts</strong>
                    </div>
                </div>
                <div class="atividade-info-item">
                    <i class="fas fa-calendar"></i>
                    <div>
                        <span>Criada em</span>
                        <strong>${formatarData(atividadeAtual.dataCriacao)}</strong>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('perguntasContainer').innerHTML = renderizarPerguntas();
        document.getElementById('modalAtividade').style.display = 'block';
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
        showAlert('Erro ao carregar perguntas da atividade', 'error');
    }
}

function renderizarPerguntas() {
    if (perguntasAtuais.length === 0) {
        return '<div class="empty-state">Nenhuma pergunta encontrada</div>';
    }

    return perguntasAtuais.map((pergunta, idx) => `
        <div class="pergunta-item">
            <div class="pergunta-texto">
                <strong>${idx + 1}.</strong> ${escapeHtml(pergunta.enunciado)}
            </div>
            <textarea
                class="resposta-textarea"
                id="resposta_${pergunta.id}"
                rows="4"
                placeholder="Digite sua resposta aqui..."
                oninput="salvarResposta(${pergunta.id}, this.value)"
            >${respostasTextuais[pergunta.id] || ''}</textarea>
        </div>
    `).join('');
}

function salvarResposta(idPergunta, valor) {
    respostasTextuais[idPergunta] = valor;
}

// ============================================================
//  XP
// ============================================================
const XP_POR_DIFICULDADE = { 'Fácil': 50, 'Médio': 100, 'Difícil': 200 };

async function concederXP(atividade) {
    try {
        const nomeDificuldade = atividade.nivelDificuldade?.nome;
        const xpGanho = XP_POR_DIFICULDADE[nomeDificuldade] || 50;

        const resAluno = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
        if (!resAluno.ok) throw new Error();
        const aluno = await resAluno.json();
        const novoXP = (aluno.xp || 0) + xpGanho;

        const resPut = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...aluno, xp: novoXP })
        });

        if (!resPut.ok) throw new Error();
        console.log(`[XP] +${xpGanho} XP (${nomeDificuldade}) → Total: ${novoXP}`);
    } catch (e) {
        console.error('[XP] Erro ao conceder XP:', e);
    }
}

// ============================================================
//  ENVIAR RESPOSTAS
// ============================================================
async function enviarRespostas() {
    const totalPerguntas = perguntasAtuais.length;
    const respondidas = Object.keys(respostasTextuais).filter(key => respostasTextuais[key]?.trim()).length;

    if (respondidas < totalPerguntas) {
        showAlert(`⚠️ Responda todas as perguntas! (${respondidas}/${totalPerguntas})`, 'error');
        return;
    }

    const submitBtn = document.querySelector('#modalAtividade .btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
    submitBtn.disabled = true;

    try {
        const respostaData = {
            idAluno: ID_ALUNO_LOGADO,
            idAtividade: atividadeAtual.idAtividade,
            momentoInicio: new Date().toISOString(),
            momentoFim: new Date().toISOString(),
            pontuacao: null,
            respostas: respostasTextuais
        };

        const response = await fetch(`${API_URL}/atividadesrespostas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(respostaData)
        });

        if (!response.ok) throw new Error('Erro ao salvar respostas');

        await concederXP(atividadeAtual);
        showAlert('✅ Atividade enviada! Aguarde a correção do professor.', 'success');

        closeModalAtividade();
        await carregarAtividadesRespondidas();
        renderizarAtividades();

    } catch (error) {
        console.error('Erro:', error);
        showAlert('❌ Erro ao enviar respostas', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ============================================================
//  MODAL
// ============================================================
function closeModalAtividade() {
    document.getElementById('modalAtividade').style.display = 'none';
    document.body.style.overflow = 'auto';
    perguntasAtuais = [];
    respostasTextuais = {};
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR');
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

// Menu toggle
const menuToggle = document.getElementById('menu-toggle');
if (menuToggle) {
    menuToggle.addEventListener('click', function () {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('active');
    });
}

// Animações
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(100%); }
    }
`;
document.head.appendChild(style);