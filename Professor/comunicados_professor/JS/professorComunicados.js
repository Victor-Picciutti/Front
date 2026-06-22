// ============================================================
//  CONFIGURACAO
// ============================================================
//const API_URL = 'http://localhost:8080';
const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_PROFESSOR_LOGADO = 6;

// ============================================================
//  ESTADO
// ============================================================
let turmasDisponiveis = [];

// ============================================================
//  INICIALIZACAO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarTurmas();
    carregarDisciplinas();
    configurarEventos();
});

// ============================================================
//  CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
    document.getElementById('form-comunicado').addEventListener('submit', enviarComunicado);

    document.getElementById('titulo').addEventListener('input', (e) => {
        document.getElementById('titulo-count').textContent = e.target.value.length;
    });

    document.getElementById('conteudo').addEventListener('input', (e) => {
        document.getElementById('conteudo-count').textContent = e.target.value.length;
    });

}

// ============================================================
//  CARREGAR TURMAS
// ============================================================
function inicializarCustomSelect(wrapperId, optionsId, hiddenId, textId, opcoes, placeholder) {
    const wrapper = document.getElementById(wrapperId);
    const optionsContainer = document.getElementById(optionsId);
    const trigger = wrapper.querySelector('.custom-select-trigger');

    // Adiciona opção padrão se houver placeholder
    optionsContainer.innerHTML = '';

    opcoes.forEach(({ value, label }) => {
        const option = document.createElement('div');
        option.className = 'custom-option';
        option.dataset.value = value;
        option.textContent = label;

        option.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById(hiddenId).value = value;
            document.getElementById(textId).textContent = label;

            optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            wrapper.classList.remove('open');
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

async function carregarTurmas() {
    try {
        const res = await fetch(`${API_URL}/series`);
        if (!res.ok) throw new Error();
        let series = await res.json();
        if (series.content) series = series.content;

        inicializarCustomSelect(
            'customSelectTurma',
            'customSelectTurmaOptions',
            'turma-select',
            'customSelectTurmaText',
            series.map(s => ({ value: s.id, label: s.nomeSerie })),
            'Selecione a turma...'
        );
    } catch (e) {
        console.error('Erro ao carregar turmas:', e);
    }
}

function popularTurmas() {
    const select = document.getElementById('turma-select');

    if (!turmasDisponiveis || turmasDisponiveis.length === 0) {
        select.innerHTML = '<option value="" disabled selected>Nenhuma turma disponível</option>';
        return;
    }

    select.innerHTML = '<option value="" disabled selected>Selecione a turma...</option>' +
        turmasDisponiveis.map(turma => `
            <option value="${turma.id}">${turma.nomeSerie}</option>
        `).join('');
}

// ============================================================
//  CARREGAR DISCIPLINAS
// ============================================================
async function carregarDisciplinas() {
    try {
        const res = await fetch(`${API_URL}/disciplinas`);
        if (!res.ok) throw new Error();
        const disciplinas = await res.json();

        const opcoes = [{ value: '', label: 'Geral' }, ...disciplinas.map(d => ({ value: d.id, label: d.nome }))];

        inicializarCustomSelect(
            'customSelectDisciplina',
            'customSelectDisciplinaOptions',
            'disciplina-select',
            'customSelectDisciplinaText',
            opcoes,
            'Geral'
        );
    } catch (e) {
        console.error('Erro ao carregar disciplinas:', e);
    }
}

// ============================================================
//  ENVIAR COMUNICADO
// ============================================================
async function enviarComunicado(e) {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value.trim();
    const conteudo = document.getElementById('conteudo').value.trim();
    const turmaId = document.getElementById('turma-select').value;
    const disciplinaId = document.getElementById('disciplina-select').value;

    if (!titulo) {
        showToast('Digite um título para o comunicado.', 'error');
        return;
    }

    if (!turmaId) {
        showToast('Selecione uma turma.', 'error');
        return;
    }

    if (!conteudo) {
        showToast('Digite o conteúdo do comunicado.', 'error');
        return;
    }

    const btn = document.querySelector('.form-actions-row .btn-primary-neon');
    setLoading(btn, true, 'Publicando...');

    try {
        const agora = new Date();

        let nomeProfessor = 'Professor';
        try {
            const resProf = await fetch(`${API_URL}/utilizadores/${ID_PROFESSOR_LOGADO}`);
            if (resProf.ok) {
                const prof = await resProf.json();
                nomeProfessor = prof.nome || 'Professor';
            }
        } catch {
            console.warn('Não foi possível buscar o nome do professor.');
        }

        const body = {
            titulo,
            descricao: conteudo,
            serie: { id: parseInt(turmaId) },
            utilizadorResponsavel: nomeProfessor,
            disciplina: { id: disciplinaId ? parseInt(disciplinaId) : 0 }, // ← ID padrão para "Geral"
            dataEnvio: agora.toISOString().split('T')[0],
        };

        console.log('Body enviado:', JSON.stringify(body, null, 2));

        const res = await fetch(`${API_URL}/comunicados`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const responseText = await res.text();
        console.log('Resposta do servidor:', responseText);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        mostrarSucesso();

    } catch (err) {
        console.error('Erro ao publicar comunicado:', err);
        showToast('Erro ao publicar comunicado. Tente novamente.', 'error');
    } finally {
        setLoading(btn, false, '<i class="fas fa-paper-plane"></i> Criar Comunicado');
    }
}

function mostrarSucesso() {
    const toast = document.createElement('div');
    toast.id = 'toast-sucesso';
    toast.innerHTML = `
        <div style="
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #1e1e1e;
            border: 1px solid #00E676;
            border-radius: 16px;
            padding: 20px 25px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-width: 280px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.5);
            animation: slideInRight 0.4s ease;
        ">
            <div style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-check-circle" style="color:#00E676; font-size:1.4rem;"></i>
                <span style="color:#00E676; font-weight:700; font-family:'Orbitron',sans-serif; font-size:0.9rem;">
                    Comunicado criado!
                </span>
            </div>
            <p style="color:#9E9E9E; font-size:0.85rem; margin:0;">
                Seu comunicado foi publicado com sucesso.
            </p>
            <div style="width:100%; background:#333; border-radius:4px; height:4px; overflow:hidden;">
                <div id="toast-progress" style="
                    height:100%;
                    background:#00E676;
                    width:100%;
                    transition: width 3s linear;
                "></div>
            </div>
        </div>
    `;
    document.body.appendChild(toast);

    // Inicia a barra de progresso
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.getElementById('toast-progress').style.width = '0%';
        });
    });

    // Redireciona após 3s
    setTimeout(() => {
        window.location.href = 'meusComunicados.html';
    }, 3000);
}

// ============================================================
//  LIMPAR FORMULÁRIO
// ============================================================
function limparFormulario() {
    document.getElementById('form-comunicado').reset();
    document.getElementById('titulo-count').textContent = '0';
    document.getElementById('conteudo-count').textContent = '0';
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function setLoading(btn, loading, html) {
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<i class="fas fa-spinner fa-spin"></i> ' + html
        : html;
}

function showToast(msg, tipo) {
    tipo = tipo || 'success';
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
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}