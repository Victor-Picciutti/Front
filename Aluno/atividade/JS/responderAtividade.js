//const API_URL = 'http://localhost:8080';
const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_ALUNO_LOGADO = 1; // substituir pelo ID real após login

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

let idAtividade = null;
let atividade = null;
let perguntas = [];
let respostas = {}; // { idPergunta: idOpcao }

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    idAtividade = parseInt(params.get('id'));

    if (!idAtividade) {
        showToast('ID da atividade não encontrado.', 'error');
        return;
    }

    carregarAtividade();
});

// ============================================================
//  CARREGAR ATIVIDADE E PERGUNTAS
// ============================================================
async function carregarAtividade() {
    try {
        const resAtividade = await fetch(`${API_URL}/atividades/${idAtividade}`);
        if (!resAtividade.ok) throw new Error('Atividade não encontrada');
        atividade = await resAtividade.json();

        // ✅ Verifica se já respondeu ANTES de carregar tudo
        const resRespostas = await fetch(`${API_URL}/atividadesrespostas`);
        if (resRespostas.ok) {
            const todasRespostas = await resRespostas.json();
            const jaRespondeu = todasRespostas.some(
                r => r.atividade?.idAtividade === idAtividade && r.aluno?.id === ID_ALUNO_LOGADO
            );
            if (jaRespondeu) {
                document.getElementById('telaLoading').innerHTML = `
                    <i class="fas fa-lock" style="font-size:2rem; color: var(--accent-color)"></i>
                    <p style="margin-top: 16px; font-size: 1rem;">Você já realizou esta atividade e não pode refazê-la.</p>
                    <button class="btn-voltar-lista" onclick="window.history.back()" style="margin-top: 24px">
                        <i class="fas fa-arrow-left"></i> Voltar para Atividades
                    </button>
                `;
                return;
            }
        }

        const resPerguntas = await fetch(`${API_URL}/atividadesPergunta`);
        if (!resPerguntas.ok) throw new Error('Erro ao carregar perguntas');
        const todasPerguntas = await resPerguntas.json();
        perguntas = todasPerguntas.filter(p => p.atividade?.idAtividade === idAtividade);

        if (perguntas.length === 0) {
            document.getElementById('telaLoading').innerHTML = `
                <i class="fas fa-inbox"></i>
                <p>Nenhuma pergunta encontrada para esta atividade.</p>
            `;
            return;
        }

        document.getElementById('headerTitulo').textContent = atividade.titulo || 'Atividade';
        document.getElementById('headerSubtitulo').textContent =
            `${perguntas.length} questão(ões) • ${atividade.nivelDificuldade?.nome || ''} • Vale ${atividade.pontuacaoMaxima || 0} ponto(s)`;

        document.getElementById('progressoHeader').style.display = 'flex';
        atualizarProgresso();
        renderizarPerguntas();

        document.getElementById('telaLoading').style.display = 'none';
        document.getElementById('telaPerguntas').style.display = 'block';

    } catch (err) {
        console.error(err);
        document.getElementById('telaLoading').innerHTML = `
            <i class="fas fa-triangle-exclamation"></i>
            <p>Erro ao carregar atividade. Verifique o backend.</p>
        `;
    }
}

// ============================================================
//  RENDERIZAR PERGUNTAS
// ============================================================
function renderizarPerguntas() {
    const container = document.getElementById('perguntasContainer');
    container.innerHTML = perguntas.map((pergunta, idx) => `
        <div class="pergunta-card" style="animation-delay: ${idx * 0.06}s">
            <div class="pergunta-numero">Questão ${idx + 1} de ${perguntas.length}</div>
            <div class="pergunta-enunciado">${escapeHtml(pergunta.enunciado)}</div>
            <div class="opcoes-list" id="opcoes-${pergunta.idPergunta}">
                ${(pergunta.opcoes || []).map((opcao, i) => `
                    <label class="opcao-label" id="opcao-label-${opcao.idOpcao}"
                           onclick="selecionarOpcao(${pergunta.idPergunta}, ${opcao.idOpcao}, this)">
                        <input type="radio" name="pergunta-${pergunta.idPergunta}" value="${opcao.idOpcao}">
                        <div class="opcao-letra">${LETRAS[i]}</div>
                        <div class="opcao-texto">${escapeHtml(opcao.descricao)}</div>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// ============================================================
//  SELECIONAR OPÇÃO
// ============================================================
function selecionarOpcao(idPergunta, idOpcao, labelClicada) {
    const container = document.getElementById(`opcoes-${idPergunta}`);
    container.querySelectorAll('.opcao-label').forEach(l => l.classList.remove('selecionada'));
    labelClicada.classList.add('selecionada');
    respostas[idPergunta] = idOpcao;
    atualizarProgresso();
}

// ============================================================
//  PROGRESSO
// ============================================================
function atualizarProgresso() {
    const respondidas = Object.keys(respostas).length;
    const total = perguntas.length;
    const pct = total > 0 ? (respondidas / total) * 100 : 0;
    document.getElementById('progressoTexto').textContent = `${respondidas} / ${total}`;
    document.getElementById('progressoFill').style.width = `${pct}%`;
}

// ============================================================
//  ENVIAR RESPOSTAS
// ============================================================
async function enviarRespostas() {
    const naoRespondidas = perguntas.filter(p => !respostas[p.idPergunta]);
    if (naoRespondidas.length > 0) {
        showToast(`Responda todas as questões! Faltam ${naoRespondidas.length}.`, 'error');
        document.getElementById(`opcoes-${naoRespondidas[0].idPergunta}`)
            ?.closest('.pergunta-card')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const btn = document.getElementById('btnEnviar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    // Calcular acertos
    let acertos = 0;
    perguntas.forEach(pergunta => {
        const idOpcaoEscolhida = respostas[pergunta.idPergunta];
        const opcaoEscolhida = (pergunta.opcoes || []).find(o => o.idOpcao === idOpcaoEscolhida);
        if (opcaoEscolhida?.correta) acertos++;
    });

    const total = perguntas.length;
    const pontuacao = atividade.pontuacaoMaxima > 0
        ? parseFloat(((acertos / total) * atividade.pontuacaoMaxima).toFixed(2))
        : acertos;

    // Salvar no backend
    try {
        const agora = new Date().toISOString();
        const res = await fetch(`${API_URL}/atividadesrespostas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                aluno: { id: ID_ALUNO_LOGADO },
                atividade: { idAtividade: idAtividade },
                momentoInicio: agora,
                momentoFim: agora,
                pontuacao: pontuacao
            })
        });
        if (!res.ok) console.warn('Aviso: não foi possível salvar a resposta no servidor.');
    } catch (err) {
        console.warn('Erro ao salvar resposta:', err);
    }

    mostrarResultado(acertos, total, pontuacao);

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Respostas';
}

// ============================================================
//  MOSTRAR RESULTADO
// ============================================================
function mostrarResultado(acertos, total, pontuacao) {
    const erros = total - acertos;
    const pct = Math.round((acertos / total) * 100);

    let emoji, titulo, subtitulo;
    if (pct === 100) { emoji = '🏆'; titulo = 'Perfeito!'; subtitulo = 'Você acertou todas as questões!'; }
    else if (pct >= 70) { emoji = '🎉'; titulo = 'Muito bem!'; subtitulo = `Você acertou ${pct}% das questões.`; }
    else if (pct >= 50) { emoji = '👍'; titulo = 'Bom trabalho!'; subtitulo = `Você acertou ${pct}% das questões.`; }
    else { emoji = '📚'; titulo = 'Continue praticando!'; subtitulo = `Você acertou ${pct}% das questões.`; }

    document.getElementById('resultadoEmoji').textContent = emoji;
    document.getElementById('resultadoTitulo').textContent = titulo;
    document.getElementById('resultadoSubtitulo').textContent = subtitulo;
    document.getElementById('notaDisplay').textContent = `${pontuacao} / ${atividade.pontuacaoMaxima || total}`; document.getElementById('totalAcertos').textContent = acertos;
    document.getElementById('totalErros').textContent = erros;
    document.getElementById('totalQuestoes').textContent = total;

    renderizarGabarito();

    document.getElementById('telaPerguntas').style.display = 'none';
    document.getElementById('telaResultado').style.display = 'block';
    document.getElementById('progressoHeader').style.display = 'none';
    document.getElementById('headerSubtitulo').textContent =
        `Nota: ${pontuacao} / ${atividade.pontuacaoMaxima || total}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
//  GABARITO
// ============================================================
function renderizarGabarito() {
    const container = document.getElementById('gabaritoContainer');
    container.innerHTML = perguntas.map((pergunta, idx) => {
        const idEscolhida = respostas[pergunta.idPergunta];
        const acertou = (pergunta.opcoes || []).find(o => o.idOpcao === idEscolhida)?.correta;

        const opcoesHtml = (pergunta.opcoes || []).map((opcao, i) => {
            const foiEscolhida = opcao.idOpcao === idEscolhida;
            let cls = '';
            if (opcao.correta) cls = 'correta';
            else if (foiEscolhida && !opcao.correta) cls = 'errada';

            return `
                <div class="opcao-label ${cls}" style="cursor:default; pointer-events:none;">
                    <div class="opcao-letra">${LETRAS[i]}</div>
                    <div class="opcao-texto">${escapeHtml(opcao.descricao)}</div>
                    ${opcao.correta ? '<i class="fas fa-check" style="color:var(--status-excellent);margin-left:auto"></i>' : ''}
                    ${foiEscolhida && !opcao.correta ? '<i class="fas fa-times" style="color:var(--accent-color);margin-left:auto"></i>' : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="pergunta-card" style="animation-delay:${idx * 0.05}s">
                <div class="pergunta-numero" style="color:${acertou ? 'var(--status-excellent)' : 'var(--accent-color)'}">
                    <i class="fas fa-${acertou ? 'check-circle' : 'times-circle'}"></i>
                    Questão ${idx + 1} — ${acertou ? 'Acertou' : 'Errou'}
                </div>
                <div class="pergunta-enunciado">${escapeHtml(pergunta.enunciado)}</div>
                <div class="opcoes-list">${opcoesHtml}</div>
            </div>
        `;
    }).join('');
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function escapeHtml(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function showToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    document.getElementById('toast-msg').textContent = msg;
    toast.className = 'toast';
    if (tipo === 'error') { toast.classList.add('error'); icon.className = 'fas fa-circle-xmark'; }
    else { icon.className = 'fas fa-circle-check'; }
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 3500);
}