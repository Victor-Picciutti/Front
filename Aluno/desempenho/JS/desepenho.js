// ============================================================
//  CONFIGURAÇÃO
// ============================================================
//const API_URL = 'http://localhost:8080';
const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_ALUNO_LOGADO = 1;

// ============================================================
//  ESTADO
// ============================================================
let todasRespostas = [];
let respostasFiltradas = [];
let lineChartInstance = null;
let barChart = null;

window.periodoDias = 30;
window.filtrosDisciplinaGrafico = '';

// Paleta de cores
const CORES_DISCIPLINAS = [
    '#BB86FC', '#03DAC6', '#FF6B6B', '#FFD93D', '#6BCB77',
    '#4D96FF', '#FF922B', '#F06595', '#74C0FC', '#A9E34B',
];

const mapaCores = {};
let indiceCor = 0;

function obterCorDisciplina(titulo) {
    if (!mapaCores[titulo]) {
        mapaCores[titulo] = CORES_DISCIPLINAS[indiceCor % CORES_DISCIPLINAS.length];
        indiceCor++;
    }
    return mapaCores[titulo];
}

function nomeDisciplina(r) {
    return r.atividade?.disciplina?.nome || r.atividade?.titulo || 'Sem disciplina';
}

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarDesempenho();
});

// ============================================================
//  CARREGAR DADOS
// ============================================================
async function carregarDesempenho() {
    try {
        const res = await fetch(`${API_URL}/atividadesrespostas`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const todas = await res.json();
        todasRespostas = todas.filter(r => r.aluno?.id === ID_ALUNO_LOGADO);
        todasRespostas.sort((a, b) => new Date(a.momentoInicio) - new Date(b.momentoInicio));
        respostasFiltradas = [...todasRespostas];

        popularFiltroAtividades();
        atualizarTudo();

    } catch (err) {
        console.error('Erro ao carregar desempenho:', err);
        document.getElementById('atividadesTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar dados. Verifique o backend.</p>
                </td>
            </tr>`;
    }
}

// ============================================================
//  POPULAR FILTROS
// ============================================================
function popularFiltroAtividades() {
    const disciplinas = [...new Map(
        todasRespostas
            .filter(r => r.atividade?.disciplina)
            .map(r => [r.atividade.disciplina.id, r.atividade.disciplina.nome])
    ).entries()].map(([id, nome]) => nome);

    const itens = disciplinas.length > 0
        ? disciplinas
        : [...new Set(todasRespostas.map(r => r.atividade?.titulo || 'Sem título'))];

    itens.forEach(t => obterCorDisciplina(t));

    // Custom select de período
    inicializarCustomSelect(
        'customSelectPeriodo',
        'customSelectPeriodoOptions',
        'customSelectPeriodoText',
        [
            { value: 7, label: 'Últimos 7 dias' },
            { value: 30, label: 'Últimos 30 dias' }
        ],
        30,
        (valor) => {
            window.periodoDias = parseInt(valor);
            atualizarGraficoLinha();
            atualizarGraficoBarra();
        }
    );

    // Custom select de disciplina
    inicializarCustomSelect(
        'customSelectDisciplinaGrafico',
        'customSelectDisciplinaGraficoOptions',
        'customSelectDisciplinaGraficoText',
        [
            { value: '', label: 'Todas as disciplinas' },
            ...itens.map(nome => ({ value: nome, label: nome }))
        ],
        '',
        (valor) => {
            window.filtrosDisciplinaGrafico = valor;
            atualizarGraficoLinha();
            atualizarGraficoBarra();
        }
    );
}

function inicializarCustomSelect(wrapperId, optionsId, textId, opcoes, valorPadrao, onChange) {
    const wrapper = document.getElementById(wrapperId);
    const optionsContainer = document.getElementById(optionsId);
    const trigger = wrapper.querySelector('.custom-select-trigger');

    optionsContainer.innerHTML = '';

    opcoes.forEach(({ value, label }) => {
        const option = document.createElement('div');
        option.className = 'custom-option' + (String(value) === String(valorPadrao) ? ' selected' : '');
        option.textContent = label;
        option.dataset.value = value;

        option.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById(textId).textContent = label;
            optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            wrapper.classList.remove('open');
            onChange(value);
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
        if (!e.target.closest(`#${wrapperId}`)) wrapper.classList.remove('open');
    });
}

// ============================================================
//  APLICAR FILTRO
// ============================================================
function aplicarFiltro() {
    respostasFiltradas = [...todasRespostas];
    paginaTabela = 1;
    atualizarTudo();
}

// ============================================================
//  ATUALIZAR TUDO
// ============================================================
function atualizarTudo() {
    atualizarEstatisticas();
    atualizarCirculoDesempenho();
    atualizarGraficoLinha();
    atualizarGraficoBarra();
    atualizarTabela();
}

// ============================================================
//  ESTATÍSTICAS RÁPIDAS
// ============================================================
function atualizarEstatisticas() {
    const total = respostasFiltradas.length;
    const somaNotas = respostasFiltradas.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
    const media = total > 0 ? (somaNotas / total).toFixed(1) : '0';

    document.getElementById('totalRespondidas').textContent = total;
    document.getElementById('mediaGeral').textContent = media;
}

// ============================================================
//  CÍRCULO DE DESEMPENHO
// ============================================================
function atualizarCirculoDesempenho() {
    const total = respostasFiltradas.length;
    const somaNotas = respostasFiltradas.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
    const somaMax = respostasFiltradas.reduce((acc, r) => acc + (r.atividade?.pontuacaoMaxima || 10), 0);
    const totalPontos = somaNotas;
    const mediaPorAtividade = total > 0 ? (somaNotas / total).toFixed(1) : 0;
    const notasMaximas = respostasFiltradas.filter(r => r.pontuacao >= (r.atividade?.pontuacaoMaxima || 10)).length;
    const percentual = somaMax > 0 ? Math.round((somaNotas / somaMax) * 100) : 0;

    let classificacao = 'Iniciante';
    if (percentual >= 90) classificacao = 'Expert';
    else if (percentual >= 75) classificacao = 'Avançado';
    else if (percentual >= 60) classificacao = 'Intermediário';
    else if (percentual >= 40) classificacao = 'Básico';

    document.getElementById('percentualAcerto').textContent = `${percentual}%`;
    document.getElementById('classificacao').textContent = classificacao;
    document.getElementById('totalPontos').textContent = totalPontos;
    document.getElementById('mediaPorAtividade').textContent = mediaPorAtividade;
    document.getElementById('notasMaximas').textContent = notasMaximas;

    const circunferencia = 282.7;
    const offset = circunferencia - (percentual / 100) * circunferencia;
    const circle = document.getElementById('performanceCircle');
    if (circle) circle.style.strokeDashoffset = offset;
}

// ============================================================
//  GRÁFICO DE LINHA
// ============================================================
function atualizarGraficoLinha() {
    let el = document.getElementById('lineChart');
    if (!el) return;

    if (todasRespostas.length === 0) { el.style.display = 'none'; return; }
    el.style.display = '';

    const periodo = window.periodoDias || 30;
    const filtroSelecionado = window.filtrosDisciplinaGrafico || '';

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodo);

    let respostasPeriodo = todasRespostas.filter(r => {
        const dataR = new Date(r.momentoFim || r.momentoInicio);
        return dataR >= dataLimite;
    });


    const disciplinas = [...new Set(respostasPeriodo.map(r => nomeDisciplina(r)))];

    if (disciplinas.length === 0) {
        if (lineChartInstance) { lineChartInstance.destroy(); lineChartInstance = null; }
        el.style.display = 'none';
        return;
    }
    el.style.display = '';

    const todasDatas = [...new Set(
        respostasPeriodo.map(r => new Date(r.momentoFim || r.momentoInicio).toLocaleDateString('pt-BR'))
    )].sort((a, b) => {
        const [da, ma, aa] = a.split('/');
        const [db, mb, ab] = b.split('/');
        return new Date(`${aa}-${ma}-${da}`) - new Date(`${ab}-${mb}-${db}`);
    });

    const datasets = disciplinas.map(d => {
        const cor = obterCorDisciplina(d);
        const destacada = !filtroSelecionado || filtroSelecionado === d;

        const dados = todasDatas.map(data => {
            const respostasDia = respostasPeriodo.filter(r => {
                const dataR = new Date(r.momentoFim || r.momentoInicio).toLocaleDateString('pt-BR');
                return nomeDisciplina(r) === d && dataR === data;
            });
            if (respostasDia.length === 0) return null;
            const soma = respostasDia.reduce((acc, r) => acc + (r.pontuacao ?? 0), 0);
            return parseFloat((soma / respostasDia.length).toFixed(1));
        });

        return {
            label: d,
            data: dados,
            borderColor: destacada ? cor : cor + '22',
            backgroundColor: 'transparent',
            borderWidth: destacada ? 3 : 1,
            pointRadius: destacada ? 6 : 2,
            pointHoverRadius: destacada ? 8 : 3,
            pointBackgroundColor: destacada ? cor : cor + '22',
            tension: 0.4,
            spanGaps: true,
        };
    });

    const notaMaxima = Math.max(...respostasPeriodo.map(r => r.atividade?.pontuacaoMaxima ?? 10));

    if (lineChartInstance) lineChartInstance.destroy();

    lineChartInstance = new Chart(el, {
        type: 'line',
        data: { labels: todasDatas, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#9E9E9E', font: { size: 11 }, boxWidth: 12, padding: 16 }
                },
                tooltip: {
                    callbacks: {
                        title: ctx => `📅 ${ctx[0].label}`,
                        label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}`
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Data', color: '#9E9E9E', font: { size: 11 } },
                    ticks: { color: '#9E9E9E', font: { size: 10 }, maxRotation: 45 },
                    grid: { color: '#2a2a2a' },
                },
                y: {
                    title: { display: true, text: 'Nota Média', color: '#9E9E9E', font: { size: 11 } },
                    min: 0,
                    max: notaMaxima,
                    ticks: { color: '#9E9E9E', stepSize: 1 },
                    grid: { color: '#2a2a2a' },
                }
            }
        }
    });
}

// ============================================================
//  GRÁFICO DE BARRAS
// ============================================================
function atualizarGraficoBarra() {
    const canvas = document.getElementById('barChart');
    if (!canvas || canvas.tagName !== 'CANVAS') return;

    const periodo = window.periodoDias || 30;
    const filtroDisciplina = window.filtrosDisciplinaGrafico || '';

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodo);

    // NÃO filtra por disciplina aqui — só por período
    const respostasFiltro = respostasFiltradas.filter(r => {
        const dataR = new Date(r.momentoFim || r.momentoInicio);
        return dataR >= dataLimite;
    });

    const disciplinas = [...new Set(respostasFiltro.map(r => nomeDisciplina(r)))];
    const dados = disciplinas.map(d => {
        const group = respostasFiltro.filter(r => nomeDisciplina(r) === d);
        const soma  = group.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
        const max   = group.reduce((acc, r) => acc + (r.atividade?.pontuacaoMaxima || 10), 0);
        return max > 0 ? Math.round((soma / max) * 100) : 0;
    });

    if (barChart) barChart.destroy();

    barChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: disciplinas,
            datasets: [{
                label: 'Aproveitamento (%)',
                data: dados,
                backgroundColor: disciplinas.map(d => {
                    const cor = obterCorDisciplina(d);
                    return (!filtroDisciplina || d === filtroDisciplina) ? cor + '99' : cor + '22';
                }),
                borderColor: disciplinas.map(d => {
                    const cor = obterCorDisciplina(d);
                    return (!filtroDisciplina || d === filtroDisciplina) ? cor + 'CC' : cor + '33';
                }),
                borderWidth: disciplinas.map(d => (!filtroDisciplina || d === filtroDisciplina) ? 2 : 1),
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}% de aproveitamento` } }
            },
            scales: {
                x: { ticks: { color: '#9E9E9E', font: { size: 11 } }, grid: { color: '#2a2a2a' } },
                y: {
                    min: 0, max: 100,
                    ticks: { color: '#9E9E9E', callback: v => v + '%' },
                    grid: { color: '#2a2a2a' }
                }
            }
        }
    });
}function atualizarGraficoBarra() {
    const canvas = document.getElementById('barChart');
    if (!canvas || canvas.tagName !== 'CANVAS') return;

    const periodo = window.periodoDias || 30;
    const filtroDisciplina = window.filtrosDisciplinaGrafico || '';

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodo);

    // NÃO filtra por disciplina aqui — só por período
    const respostasFiltro = respostasFiltradas.filter(r => {
        const dataR = new Date(r.momentoFim || r.momentoInicio);
        return dataR >= dataLimite;
    });

    const disciplinas = [...new Set(respostasFiltro.map(r => nomeDisciplina(r)))];
    const dados = disciplinas.map(d => {
        const group = respostasFiltro.filter(r => nomeDisciplina(r) === d);
        const soma  = group.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
        const max   = group.reduce((acc, r) => acc + (r.atividade?.pontuacaoMaxima || 10), 0);
        return max > 0 ? Math.round((soma / max) * 100) : 0;
    });

    if (barChart) barChart.destroy();

    barChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: disciplinas,
            datasets: [{
                label: 'Aproveitamento (%)',
                data: dados,
                backgroundColor: disciplinas.map(d => {
                    const cor = obterCorDisciplina(d);
                    return (!filtroDisciplina || d === filtroDisciplina) ? cor + '99' : cor + '22';
                }),
                borderColor: disciplinas.map(d => {
                    const cor = obterCorDisciplina(d);
                    return (!filtroDisciplina || d === filtroDisciplina) ? cor + 'CC' : cor + '33';
                }),
                borderWidth: disciplinas.map(d => (!filtroDisciplina || d === filtroDisciplina) ? 2 : 1),
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}% de aproveitamento` } }
            },
            scales: {
                x: { ticks: { color: '#9E9E9E', font: { size: 11 } }, grid: { color: '#2a2a2a' } },
                y: {
                    min: 0, max: 100,
                    ticks: { color: '#9E9E9E', callback: v => v + '%' },
                    grid: { color: '#2a2a2a' }
                }
            }
        }
    });
}

// ============================================================
//  TABELA DE HISTÓRICO
// ============================================================
const ITENS_POR_PAGINA_TABELA = 10;
let paginaTabela = 1;

function atualizarTabela() {
    const tbody = document.getElementById('atividadesTableBody');
    if (!tbody) return;

    if (respostasFiltradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Nenhuma atividade encontrada.</p>
                </td>
            </tr>`;
        removePaginacaoTabela();
        return;
    }

    const totalPaginas = Math.ceil(respostasFiltradas.length / ITENS_POR_PAGINA_TABELA);
    if (paginaTabela > totalPaginas) paginaTabela = 1;

    const inicio = (paginaTabela - 1) * ITENS_POR_PAGINA_TABELA;
    const itensPagina = respostasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA_TABELA);

    tbody.innerHTML = itensPagina.map(r => {
        const titulo = r.atividade?.titulo || 'Sem título';
        const disciplina = nomeDisciplina(r);
        const nota = r.pontuacao ?? 0;
        const max = r.atividade?.pontuacaoMaxima ?? 10;
        const perc = max > 0 ? Math.round((nota / max) * 100) : 0;
        const data = formatarData(r.momentoFim || r.momentoInicio);
        const cor = obterCorDisciplina(disciplina);

        let statusClass, statusLabel;
        if (perc >= 90) { statusClass = 'status-excellent'; statusLabel = 'Excelente'; }
        else if (perc >= 70) { statusClass = 'status-good'; statusLabel = 'Bom'; }
        else if (perc >= 50) { statusClass = 'status-average'; statusLabel = 'Regular'; }
        else { statusClass = 'status-low'; statusLabel = 'Baixo'; }

        return `
            <tr>
                <td>
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${cor};margin-right:8px;"></span>
                    <span style="font-weight:600">${disciplina}</span>
                    <span style="color:var(--text-muted);font-size:0.8rem;margin-left:6px;">— ${titulo}</span>
                </td>
                <td>${data}</td>
                <td>${nota}</td>
                <td>${max}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div class="progress-bar-mini">
                            <div class="progress-fill-mini" style="width:${perc}%; background: linear-gradient(90deg, ${cor}, ${cor}99);"></div>
                        </div>
                        <span style="font-size:0.8rem;color:var(--text-muted)">${perc}%</span>
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            </tr>`;
    }).join('');

    renderPaginacaoTabela(totalPaginas);
}

function renderPaginacaoTabela(totalPaginas) {
    let paginacaoEl = document.getElementById('paginacao-tabela');
    if (!paginacaoEl) {
        paginacaoEl = document.createElement('div');
        paginacaoEl.id = 'paginacao-tabela';
        const tableContainer = document.querySelector('.table-container');
        tableContainer.insertAdjacentElement('afterend', paginacaoEl);
    }

    if (totalPaginas <= 1) { paginacaoEl.innerHTML = ''; return; }

    paginacaoEl.innerHTML = `
        <div style="display:flex;justify-content:center;align-items:center;gap:15px;margin-top:20px;font-family:var(--font-main);">
            <button onclick="mudarPaginaTabela(${paginaTabela - 1})"
                ${paginaTabela === 1 ? 'disabled' : ''}
                style="background:${paginaTabela === 1 ? 'rgba(187,134,252,0.1)' : 'linear-gradient(135deg,#BB86FC,#a21fa2)'};
                color:${paginaTabela === 1 ? 'var(--text-muted)' : '#000'};
                border:none;padding:10px 20px;border-radius:30px;
                cursor:${paginaTabela === 1 ? 'not-allowed' : 'pointer'};font-weight:700;">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>
            <span style="color:var(--text-muted);font-size:0.9rem;">
                Página <strong style="color:var(--primary-color);">${paginaTabela}</strong> de <strong style="color:var(--primary-color);">${totalPaginas}</strong>
            </span>
            <button onclick="mudarPaginaTabela(${paginaTabela + 1})"
                ${paginaTabela === totalPaginas ? 'disabled' : ''}
                style="background:${paginaTabela === totalPaginas ? 'rgba(187,134,252,0.1)' : 'linear-gradient(135deg,#BB86FC,#a21fa2)'};
                color:${paginaTabela === totalPaginas ? 'var(--text-muted)' : '#000'};
                border:none;padding:10px 20px;border-radius:30px;
                cursor:${paginaTabela === totalPaginas ? 'not-allowed' : 'pointer'};font-weight:700;">
                Próxima <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

function removePaginacaoTabela() {
    const el = document.getElementById('paginacao-tabela');
    if (el) el.innerHTML = '';
}

function mudarPaginaTabela(novaPagina) {
    paginaTabela = novaPagina;
    atualizarTabela();
    document.querySelector('.data-card:last-child').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR') + ' ' +
            data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return dataString; }
}

// ============================================================
//  MENU SIDEBAR
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
            document.querySelector('.dashboard-content').classList.toggle('collapsed');
        });
    }
});