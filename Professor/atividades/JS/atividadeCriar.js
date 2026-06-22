//const API_URL = 'http://localhost:8080';
const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_PROFESSOR_LOGADO = 6;

// ============================================================
//  ESTADO
// ============================================================
let idAtividadeCriada = null;
let questoes = [];
let questaoAtual = 0;
let opcaoCorretaIndex = null;

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    adicionarOpcao();
    atualizarProgresso();
    initSidebar();
});


const LETRAS = ['A', 'B', 'C', 'D', 'E'];

// ============================================================
//  INDEXEDDB - BUSCAR E LIMPAR PDF
// ============================================================
function buscarPDFIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("EstudeXDB", 1);

        request.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("arquivos")) {
                db.createObjectStore("arquivos", { keyPath: "id" });
            }
        };

        request.onsuccess = function(e) {
            const db = e.target.result;
            const tx = db.transaction("arquivos", "readonly");
            const store = tx.objectStore("arquivos");
            const get = store.get("pdfAtividade");

            get.onsuccess = () => resolve(get.result?.arquivo || null);
            get.onerror = () => reject(get.error);
        };

        request.onerror = () => reject(request.error);
    });
}

function limparPDFIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("EstudeXDB", 1);

        request.onsuccess = function(e) {
            const db = e.target.result;
            const tx = db.transaction("arquivos", "readwrite");
            const store = tx.objectStore("arquivos");
            store.delete("pdfAtividade");

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        };

        request.onerror = () => reject(request.error);
    });
}

// ============================================================
//  ADICIONAR ALTERNATIVA
// ============================================================
function adicionarOpcao() {
    const container = document.getElementById('opcoes-container');
    const total = container.children.length;

    if (total >= 5) {
        showToast('Máximo de 5 alternativas por questão.', 'error');
        return;
    }

    const idx = total;
    const row = document.createElement('div');
    row.className = 'opcao-row';
    row.dataset.idx = idx;

    row.innerHTML = `
        <div class="opcao-letra" id="letra-${idx}" title="Clique para marcar como correta">${LETRAS[idx]}</div>
        <input type="radio" name="correta" class="opcao-radio" id="radio-${idx}" value="${idx}">
        <input type="text" class="opcao-input" id="opcao-input-${idx}" placeholder="Alternativa ${LETRAS[idx]}..." autocomplete="off">
        <button class="btn-remove" onclick="removerOpcao(this)" title="Remover alternativa">
            <i class="fas fa-xmark"></i>
        </button>
    `;

    container.appendChild(row);

    const radio = row.querySelector('.opcao-radio');
    radio.addEventListener('change', () => {
        if (radio.checked) marcarCorreta(idx);
    });

    const letra = row.querySelector('.opcao-letra');
    letra.addEventListener('click', () => {
        radio.checked = true;
        marcarCorreta(idx);
    });

    atualizarContador();
    document.getElementById(`opcao-input-${idx}`)?.focus();
}

// ============================================================
//  REMOVER ALTERNATIVA
// ============================================================
function removerOpcao(btn) {
    const container = document.getElementById('opcoes-container');
    if (container.children.length <= 1) {
        showToast('É necessário ao menos uma alternativa.', 'error');
        return;
    }

    const row = btn.closest('.opcao-row');
    const idx = parseInt(row.dataset.idx);
    if (idx === opcaoCorretaIndex) {
        opcaoCorretaIndex = null;
        atualizarIndicadorCorreta();
    }

    row.remove();
    renumerarOpcoes();
    atualizarContador();
}

// ============================================================
//  RENUMERAR OPÇÕES
// ============================================================
function renumerarOpcoes() {
    opcaoCorretaIndex = null;

    document.querySelectorAll('.opcao-row').forEach((row, i) => {
        row.dataset.idx = i;
        row.classList.remove('marcada-correta');

        const letra = row.querySelector('.opcao-letra');
        letra.id = `letra-${i}`;
        letra.textContent = LETRAS[i];
        letra.classList.remove('correta');
        letra.onclick = null;
        letra.addEventListener('click', () => {
            const radio = row.querySelector('.opcao-radio');
            radio.checked = true;
            marcarCorreta(i);
        });

        const radio = row.querySelector('.opcao-radio');
        radio.id = `radio-${i}`;
        radio.value = i;
        radio.checked = false;
        radio.onchange = null;
        radio.addEventListener('change', () => {
            if (radio.checked) marcarCorreta(i);
        });

        const input = row.querySelector('.opcao-input');
        input.id = `opcao-input-${i}`;
        input.placeholder = `Alternativa ${LETRAS[i]}...`;
    });

    atualizarIndicadorCorreta();
}

// ============================================================
//  MARCAR CORRETA
// ============================================================
function marcarCorreta(idx) {
    opcaoCorretaIndex = idx;

    document.querySelectorAll('.opcao-row').forEach((row, i) => {
        const letra = row.querySelector('.opcao-letra');
        const radio = row.querySelector('.opcao-radio');

        if (i === idx) {
            letra.classList.add('correta');
            row.classList.add('marcada-correta');
            radio.checked = true;
        } else {
            letra.classList.remove('correta');
            row.classList.remove('marcada-correta');
            radio.checked = false;
        }
    });

    atualizarIndicadorCorreta();
}

// ============================================================
//  ATUALIZAR INDICADOR VISUAL DE CORRETA
// ============================================================
function atualizarIndicadorCorreta() {
    const hint = document.getElementById('correta-hint');
    const status = document.getElementById('correta-status');
    const texto = document.getElementById('correta-status-texto');

    if (opcaoCorretaIndex !== null) {
        if (hint) hint.style.display = 'none';
        if (status) status.style.display = 'flex';
        if (texto) texto.textContent = `Alternativa ${LETRAS[opcaoCorretaIndex]} marcada como correta`;
    } else {
        if (hint) hint.style.display = 'flex';
        if (status) status.style.display = 'none';
    }
}

// ============================================================
//  ATUALIZAR CONTADOR
// ============================================================
function atualizarContador() {
    const total = document.getElementById('opcoes-container').children.length;

    const countLabel = document.getElementById('count-label');
    if (countLabel) countLabel.textContent = `${total} / 5`;

    const btnAdd = document.getElementById('btn-add-opcao');
    if (btnAdd) btnAdd.style.display = total >= 5 ? 'none' : 'flex';
}

// ============================================================
//  PROGRESSO
// ============================================================
function atualizarProgresso() {
    const num = questaoAtual + 1;

    const numEl = document.getElementById('questao-numero');
    if (numEl) numEl.textContent = `Questão ${num}`;

    const pct = Math.max((questaoAtual / Math.max(questoes.length + 1, 1)) * 100, 5);
    const fill = document.getElementById('questao-progress');
    if (fill) fill.style.width = `${Math.min(pct, 95)}%`;

    const btnAnt = document.getElementById('btn-anterior');
    if (btnAnt) btnAnt.disabled = questaoAtual === 0;
}

// ============================================================
//  CRIAR ATIVIDADE
// ============================================================
async function criarAtividadeSeNecessario() {
    if (idAtividadeCriada) return true;

    const titulo = document.getElementById('titulo')?.value.trim();
    const dificuldade = localStorage.getItem('idDificuldade');
    const idDisciplina = localStorage.getItem('idDisciplina');

    if (!dificuldade || dificuldade === 'null') {
        showToast('Erro: nível de dificuldade não encontrado. Volte à tela anterior.', 'error');
        return false;
    }

    if (!idDisciplina || idDisciplina === 'null') {
        showToast('Erro: disciplina não encontrada. Volte à tela anterior.', 'error');
        return false;
    }

    if (!titulo) {
        showToast('Digite o título da atividade.', 'error');
        document.getElementById('titulo')?.focus();
        return false;
    }

    try {
        const payload = {
            titulo,
            idOrientador: ID_PROFESSOR_LOGADO,
            pontuacaoMaxima: 0,
            dataCriacao: new Date().toISOString(),
            nivelDificuldade: { idNivelDificuldade: parseInt(dificuldade) },
            disciplina: { id: parseInt(idDisciplina) }
        };

        const res = await fetch(`${API_URL}/atividades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const atividade = await res.json();
        idAtividadeCriada = atividade.idAtividade ?? atividade.id;

        ['titulo', 'dificuldade'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });

        return true;

    } catch (err) {
        console.error('[EstudeX] Erro ao criar atividade:', err);
        showToast('Erro ao criar a atividade. Verifique o backend.', 'error');
        return false;
    }
}

// ============================================================
//  SALVAR QUESTÃO ATUAL
// ============================================================
async function salvarQuestaoAtual() {
    const enunciado = document.getElementById('enunciado')?.value.trim();

    if (!enunciado) {
        showToast('Digite o enunciado da questão.', 'error');
        document.getElementById('enunciado')?.focus();
        return null;
    }

    const inputs = document.querySelectorAll('.opcao-input');
    const opcoes = Array.from(inputs).map(i => i.value.trim());

    if (opcoes.length < 2) {
        showToast('Adicione ao menos 2 alternativas.', 'error');
        return null;
    }

    if (opcoes.some(o => !o)) {
        showToast('Preencha todas as alternativas antes de continuar.', 'error');
        return null;
    }

    if (opcaoCorretaIndex === null) {
        showToast('Marque a alternativa correta antes de salvar a questão.', 'error');
        const hint = document.getElementById('correta-hint');
        if (hint) {
            hint.style.display = 'flex';
            hint.scrollIntoView({ behavior: 'smooth', block: 'center' });
            hint.style.borderColor = 'var(--accent-color)';
            hint.style.background = 'rgba(255,61,0,0.08)';
            setTimeout(() => {
                hint.style.borderColor = '';
                hint.style.background = '';
            }, 2500);
        }
        return null;
    }

    try {
        const resPergunta = await fetch(`${API_URL}/atividadesPergunta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                enunciado,
                atividade: { idAtividade: idAtividadeCriada }
            })
        });
        if (!resPergunta.ok) throw new Error(`Pergunta HTTP ${resPergunta.status}`);
        const pergunta = await resPergunta.json();
        const idPergunta = pergunta.id ?? pergunta.idPergunta;

        for (let i = 0; i < opcoes.length; i++) {
            const resOpcao = await fetch(`${API_URL}/perguntasopcoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descricao: opcoes[i],
                    correta: i === opcaoCorretaIndex,
                    atividadePergunta: { idPergunta }
                })
            });
            if (!resOpcao.ok) throw new Error(`Opção HTTP ${resOpcao.status}`);
        }

        questoes[questaoAtual] = { idPergunta, enunciado, opcoes, correta: opcaoCorretaIndex };
        return idPergunta;

    } catch (err) {
        console.error('[EstudeX] Erro ao salvar questão:', err);
        showToast('Erro ao salvar a questão. Verifique o backend.', 'error');
        return null;
    }
}

// ============================================================
//  PRÓXIMA QUESTÃO
// ============================================================
async function proximaQuestao() {
    const btn = document.getElementById('btn-proxima');
    const label = '<i class="fas fa-save"></i> Próxima Questão';
    setLoading(btn, true, 'Salvando...');

    const criou = await criarAtividadeSeNecessario();
    if (!criou) { setLoading(btn, false, label); return; }

    const salvo = await salvarQuestaoAtual();
    if (!salvo) { setLoading(btn, false, label); return; }

    showToast(`Questão ${questaoAtual + 1} salva!`);
    questaoAtual++;
    limparFormulario();
    atualizarProgresso();
    setLoading(btn, false, label);
}

// ============================================================
//  QUESTÃO ANTERIOR
// ============================================================
function questaoAnterior() {
    if (questaoAtual === 0) return;
    questaoAtual--;
    carregarQuestao(questaoAtual);
    atualizarProgresso();
}

// ============================================================
//  CARREGAR QUESTÃO NO FORM
// ============================================================
function carregarQuestao(index) {
    const q = questoes[index];
    if (!q) return;

    const enunciadoEl = document.getElementById('enunciado');
    const container = document.getElementById('opcoes-container');

    if (enunciadoEl) enunciadoEl.value = q.enunciado;
    container.innerHTML = '';
    opcaoCorretaIndex = null;

    q.opcoes.forEach((texto, i) => {
        adicionarOpcao();
        const inputEl = document.getElementById(`opcao-input-${i}`);
        if (inputEl) inputEl.value = texto;
    });

    if (q.correta !== null && q.correta !== undefined) {
        const radio = document.getElementById(`radio-${q.correta}`);
        if (radio) radio.checked = true;
        marcarCorreta(q.correta);
    }

    atualizarContador();
    showToast(`Editando questão ${index + 1}.`);
}

// ============================================================
//  PUBLICAR ATIVIDADE
// ============================================================
async function publicarAtividade() {
    const btn = document.querySelector('.main-actions .btn-primary');
    const label = '<i class="fas fa-paper-plane"></i> Publicar Atividade';
    setLoading(btn, true, 'Publicando...');

    const criou = await criarAtividadeSeNecessario();
    if (!criou) { setLoading(btn, false, label); return; }

    const enunciado = document.getElementById('enunciado')?.value.trim();
    const temOpcoes = Array.from(document.querySelectorAll('.opcao-input'))
        .some(i => i.value.trim() !== '');

    const questaoAtualPreenchida = enunciado || temOpcoes;

    if (questaoAtualPreenchida) {
        const salvo = await salvarQuestaoAtual();
        if (!salvo) { setLoading(btn, false, label); return; }
    } else if (questoes.filter(Boolean).length === 0) {
        showToast('Adicione ao menos uma questão antes de publicar.', 'error');
        setLoading(btn, false, label);
        return;
    }

    const total = questoes.filter(Boolean).length;

    try {
        const resUpdate = await fetch(
            `${API_URL}/atividades/${idAtividadeCriada}/pontuacao?pontuacaoMaxima=${total}`,
            { method: 'PATCH' }
        );
        if (!resUpdate.ok) throw new Error(`PATCH HTTP ${resUpdate.status}`);
    } catch (err) {
        console.error('[EstudeX] Erro ao atualizar pontuação:', err);
        showToast('Erro ao atualizar pontuação. Verifique o backend.', 'error');
        setLoading(btn, false, label);
        return;
    }

    // Envia o PDF se existir
    const temMaterial = localStorage.getItem("temMaterial");
    if (temMaterial) {
        try {
            const arquivo = await buscarPDFIndexedDB();
            if (arquivo) {
                const bytes = await arquivo.arrayBuffer();

                const resPDF = await fetch(`${API_URL}/atividadeconteudo/${idAtividadeCriada}/arquivo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: bytes
                });

                if (!resPDF.ok) throw new Error(`PDF HTTP ${resPDF.status}`);

                await limparPDFIndexedDB();
                console.log("PDF enviado com sucesso!");
            }
        } catch (err) {
            console.error('[EstudeX] Erro ao enviar PDF:', err);
            showToast('Atividade publicada, mas erro ao enviar PDF.', 'error');
        }
    }

    // Limpa o localStorage
    localStorage.removeItem("temMaterial");
    localStorage.removeItem("idDificuldade");
    localStorage.removeItem("idDisciplina");
    localStorage.removeItem("idSerie");

    showToast('Atividade publicada com sucesso!');
    setLoading(btn, false, label);
    setTimeout(() => {
        window.location.href = 'minhasAtividades.html';
    }, 2000);
}


// ============================================================
//  CANCELAR
// ============================================================
function cancelar() {
    abrirModalCancelar();
}


// ============================================================
//  UTILITÁRIOS
// ============================================================
function limparFormulario() {
    const enunciadoEl = document.getElementById('enunciado');
    const container = document.getElementById('opcoes-container');
    if (enunciadoEl) enunciadoEl.value = '';
    if (container) container.innerHTML = '';
    opcaoCorretaIndex = null;
    atualizarIndicadorCorreta();
    adicionarOpcao();
    atualizarContador();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setLoading(btn, loading, htmlLabel) {
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
        ? `<i class="fas fa-spinner fa-spin"></i> ${htmlLabel}`
        : htmlLabel;
}

function showToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const msgEl = document.getElementById('toast-msg');
    if (!toast || !icon || !msgEl) return;

    msgEl.textContent = msg;
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

// ============================================================
//  MODAL DE CANCELAMENTO
// ============================================================
function abrirModalCancelar() {
    document.getElementById('modal-cancelar').style.display = 'flex';
}

function fecharModalCancelar() {
    document.getElementById('modal-cancelar').style.display = 'none';
}

async function confirmarCancelar() {
    fecharModalCancelar();

    if (idAtividadeCriada) {
        try {
            const res = await fetch(`${API_URL}/atividades/${idAtividadeCriada}`, {
                method: 'DELETE'
            });
            console.log(`[EstudeX] DELETE /atividades/${idAtividadeCriada} → status ${res.status}`);
        } catch (err) {
            console.error('[EstudeX] Erro ao deletar atividade:', err);
        }
    }

    try { await limparPDFIndexedDB(); } catch (_) {}

    localStorage.removeItem("temMaterial");
    localStorage.removeItem("idDificuldade");
    localStorage.removeItem("idDisciplina");
    localStorage.removeItem("idSerie");

    window.location.href = '../HTML/atividades.html';
}