//const API_URL = 'http://localhost:8080';
const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_PROFESSOR_LOGADO = 6; // substituir pelo ID real após login

let todasAtividades = [];
let atividadeIdParaDeletar = null;

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarAtividades();
    inicializarFechamentoModais();
});

// ============================================================
//  CARREGAR ATIVIDADES
// ============================================================
async function carregarAtividades() {
    try {
        const res = await fetch(`${API_URL}/atividades`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const atividades = await res.json();
        todasAtividades = atividades.filter(a => a.idOrientador === ID_PROFESSOR_LOGADO);

        atualizarStats();
        renderizarAtividades(todasAtividades);

    } catch (err) {
        console.error('Erro ao carregar atividades:', err);
        document.getElementById('atividadesList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-triangle-exclamation"></i>
                <p>Erro ao carregar atividades. Verifique o backend.</p>
            </div>
        `;
    }
}

// ============================================================
//  STATS
// ============================================================
function atualizarStats() {
    document.getElementById('totalAtividades').textContent = todasAtividades.length;
}

// ============================================================
//  RENDERIZAR CARDS
// ============================================================
function renderizarAtividades(lista) {
    const container = document.getElementById('atividadesList');

    if (lista.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>Nenhuma atividade encontrada.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = lista.map(a => {
        const dificuldade = a.nivelDificuldade?.nome || '—';
        const badgeClass = resolverBadgeClass(dificuldade);
        const pontos = a.pontuacaoMaxima ?? 0;
        const data = a.dataCriacao ? formatarData(a.dataCriacao) : '—';
        const disciplina = a.disciplina?.nome || 'Sem disciplina';

        return `
            <div class="atividade-card" id="card-${a.idAtividade}" 
                onclick="abrirModalRespostas(${a.idAtividade}, '${(a.titulo || '').replace(/'/g, "\\'")}')"
                style="cursor:pointer;">
                <div class="card-actions">
                    <button class="btn-card-action btn-deletar" title="Excluir atividade"
                        onclick="event.stopPropagation(); deletarAtividade(${a.idAtividade})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="atividade-card-header">
                    <div>
                        <span class="atividade-titulo">
                            <i class="fas fa-file-alt" style="margin-right:8px; font-size:0.85rem;"></i>
                            ${a.titulo || 'Sem título'}
                        </span>

                        <div class="atividade-disciplina">
                        <i class="fas fa-book"></i>
                        ${disciplina}
                    </div>
                </div>

    <span class="dificuldade-badge ${badgeClass}">${dificuldade}</span>
</div>

                <div class="atividade-meta">
                    <div class="meta-pontos">
                        <i class="fas fa-star" style="color: var(--status-average);"></i>
                        <strong>${pontos}</strong>
                        <span>${pontos === 1 ? 'ponto' : 'pontos'}</span>
                    </div>
                    <div class="meta-data">
                        <i class="far fa-calendar-alt"></i>
                        <span>${data}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
//  FILTRO DE BUSCA
// ============================================================
function filtrarAtividades() {
    const termo = document.getElementById('searchAtividade').value.toLowerCase().trim();

    const filtradas = todasAtividades.filter(a =>
        (a.titulo || '').toLowerCase().includes(termo) ||
        (a.nivelDificuldade?.nome || '').toLowerCase().includes(termo)
    );

    renderizarAtividades(filtradas);
}

// ============================================================
//  DELETAR
// ============================================================
function deletarAtividade(id) {
    atividadeIdParaDeletar = id;
    const modal = document.getElementById('modalConfirmDelete');
    modal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('active')));
}

function fecharConfirmDelete() {
    atividadeIdParaDeletar = null;
    const modal = document.getElementById('modalConfirmDelete');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
}

async function confirmarDelete() {
    if (!atividadeIdParaDeletar) return;

    const btnConfirmar = document.getElementById('btnConfirmarDelete');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';

    try {
        const response = await fetch(`${API_URL}/atividades/${atividadeIdParaDeletar}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const card = document.getElementById(`card-${atividadeIdParaDeletar}`);
        if (card) {
            card.style.transition = 'opacity 0.3s, transform 0.3s';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => card.remove(), 300);
        }

        todasAtividades = todasAtividades.filter(a => a.idAtividade !== atividadeIdParaDeletar);
        document.getElementById('totalAtividades').textContent = todasAtividades.length;

        fecharConfirmDelete();
        showAlert('✅ Atividade excluída com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir:', error);
        showAlert('❌ Erro ao excluir a atividade.', 'error');
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '<i class="fas fa-trash"></i> Sim, excluir';
    }
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function resolverBadgeClass(nomeDificuldade) {
    const n = (nomeDificuldade || '').toLowerCase();
    if (n.includes('fácil') || n.includes('facil') || n.includes('baixo')) return 'facil';
    if (n.includes('médio') || n.includes('medio') || n.includes('moderado')) return 'medio';
    if (n.includes('difícil') || n.includes('dificil') || n.includes('alto')) return 'dificil';
    return 'default';
}

function formatarData(dataStr) {
    try {
        const d = new Date(dataStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
}

function inicializarFechamentoModais() {
    window.onclick = function (event) {
        if (event.target === document.getElementById('modalConfirmDelete')) fecharConfirmDelete();
        if (event.target === document.getElementById('modalRespostas')) fecharModalRespostas();
    };
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

// ============================================================
//  MODAL RESPOSTAS
// ============================================================
let todasRespostas = [];

async function abrirModalRespostas(idAtividade, tituloAtividade) {
    const modal = document.getElementById('modalRespostas');
    const body = document.getElementById('modalRespostasBody');
    const titulo = document.getElementById('modalRespostasTitulo');

    titulo.textContent = tituloAtividade;
    body.innerHTML = `
        <div style="text-align:center; padding:30px; color:#9ca3af;">
            <i class="fas fa-spinner fa-spin" style="font-size:1.5rem;"></i>
            <p style="margin-top:10px;">Carregando respostas...</p>
        </div>
    `;

    modal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('active')));

    try {
        const res = await fetch(`${API_URL}/atividadesrespostas/atividade/${idAtividade}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        todasRespostas = await res.json(); 
        console.log('Primeira resposta:', JSON.stringify(todasRespostas[0], null, 2)); 
        popularFiltroSerie(todasRespostas); 
        renderizarRespostas(todasRespostas);
    } catch (err) {
        console.error('Erro ao carregar respostas:', err);
        body.innerHTML = `
            <div style="text-align:center; padding:30px; color:#9ca3af;">
                <i class="fas fa-triangle-exclamation" style="font-size:1.5rem; color:#f59e0b;"></i>
                <p style="margin-top:10px;">Erro ao carregar respostas.</p>
            </div>
        `;
    }
}

function popularFiltroSerie(respostas) {
    const select = document.getElementById('filtroSerie');
    if (!select) return;

    const series = [...new Map(
        respostas
            .filter(r => r.aluno?.serie)
            .map(r => [r.aluno.serie.id, r.aluno.serie])
    ).values()];

    select.innerHTML = '<option value="">Todas as turmas</option>';
    series.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.nomeSerie;
        select.appendChild(opt);
    });
}

function aplicarFiltroSerie() {
    const idFiltro = document.getElementById('filtroSerie').value;
    const filtradas = idFiltro
        ? todasRespostas.filter(r => String(r.aluno?.serie?.id) === idFiltro)
        : todasRespostas;
    renderizarRespostas(filtradas);
}

function renderizarRespostas(respostas) {
    const body = document.getElementById('modalRespostasBody');

    if (respostas.length === 0) {
        body.innerHTML = `
            <div style="text-align:center; padding:30px; color:#9ca3af;">
                <i class="fas fa-inbox" style="font-size:2rem;"></i>
                <p style="margin-top:10px;">Nenhum aluno respondeu ainda.</p>
            </div>
        `;
        return;
    }

    const linhas = respostas.map(r => {
        const nome = r.aluno?.nome || '—';
        const inicio = r.momentoInicio ? formatarDataHora(r.momentoInicio) : '—';
        const fim = r.momentoFim ? formatarDataHora(r.momentoFim) : '—';
        const nota = r.pontuacao != null ? r.pontuacao.toFixed(1) : '—';

        return `
            <tr>
                <td style="padding:12px 10px; border-bottom:1px solid #2a2a3a;">
                    <i class="fas fa-user-graduate" style="margin-right:8px; color:var(--primary-color);"></i>
                    ${nome}
                </td>
                <td style="padding:12px 10px; border-bottom:1px solid #2a2a3a; color:#9ca3af; font-size:0.85rem;">${inicio}</td>
                <td style="padding:12px 10px; border-bottom:1px solid #2a2a3a; color:#9ca3af; font-size:0.85rem;">${fim}</td>
                <td style="padding:12px 10px; border-bottom:1px solid #2a2a3a; text-align:center;">
                    <span style="
                        background: rgba(187,134,252,0.15);
                        color: var(--primary-color);
                        padding: 3px 10px;
                        border-radius: 999px;
                        font-weight: 600;
                        font-size: 0.85rem;
                    ">${nota}</span>
                </td>
            </tr>
        `;
    }).join('');

    body.innerHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">
            <thead>
                <tr style="color:#9ca3af; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.05em;">
                    <th style="padding:8px 10px; text-align:left; border-bottom:2px solid #2a2a3a;">Aluno</th>
                    <th style="padding:8px 10px; text-align:left; border-bottom:2px solid #2a2a3a;">Início</th>
                    <th style="padding:8px 10px; text-align:left; border-bottom:2px solid #2a2a3a;">Fim</th>
                    <th style="padding:8px 10px; text-align:center; border-bottom:2px solid #2a2a3a;">Nota</th>
                </tr>
            </thead>
            <tbody>${linhas}</tbody>
        </table>
        <p style="margin-top:16px; color:#9ca3af; font-size:0.8rem; text-align:right;">
            ${respostas.length} aluno${respostas.length !== 1 ? 's' : ''} respondeu${respostas.length !== 1 ? 'ram' : ''}
        </p>
    `;
}

function fecharModalRespostas() {
    const modal = document.getElementById('modalRespostas');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
    todasRespostas = [];
    const select = document.getElementById('filtroSerie');
    if (select) select.value = '';
}

function formatarDataHora(dataStr) {
    try {
        const d = new Date(dataStr);
        return d.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return '—'; }
}