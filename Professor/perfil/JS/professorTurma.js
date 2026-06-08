// professorTurma.js

const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const PROFESSOR_ID = 6;

// ─── Utilitários ─────────────────────────────────────────────────────────────

async function apiFetch(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status} em ${endpoint}`);
    return response.json();
}

function getIniciais(nome = '') {
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0][0]?.toUpperCase() || '?';
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function showAlert(mensagem, tipo = 'error') {
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed; top:20px; right:20px; z-index:9999;
        padding:14px 22px; border-radius:12px; font-weight:500;
        background:${tipo === 'success' ? '#00E67620' : '#FF3D0020'};
        border:1px solid ${tipo === 'success' ? '#00E676' : '#FF3D00'};
        color:${tipo === 'success' ? '#00E676' : '#FF3D00'};
        font-family:'Poppins',sans-serif; font-size:0.9rem;
        animation: slideIn 0.3s ease;
    `;
    el.textContent = mensagem;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

// ─── Perfil do Professor ──────────────────────────────────────────────────────

async function carregarPerfil() {
    const container = document.getElementById('profileHeader');

    try {
        const professor = await apiFetch(`/utilizadores/${PROFESSOR_ID}`);

        const nome = professor.nome || 'Professor';
        const iniciais = getIniciais(nome);

        container.innerHTML = `
            <div class="avatar-large">
                <div style="
                    width:100px; height:100px; border-radius:50%;
                    background:linear-gradient(135deg,#BB86FC,#a21fa2);
                    display:flex; align-items:center; justify-content:center;
                    font-size:2rem; font-weight:700; color:#121212;
                    border:3px solid #BB86FC;
                ">${iniciais}</div>
            </div>

            <div class="profile-info">
                <h2>${nome}</h2>
                <p class="instituicao">
                    <i class="fas fa-map-marker-alt" style="color:var(--secondary-color)"></i>
                    ${professor.cidade} · ${professor.uf}
                </p>
                <p class="instituicao">
                    <i class="fas fa-id-badge" style="color:var(--secondary-color)"></i>
                    ${professor.tipoUtilizador?.cargo || 'Professor'}
                </p>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Não foi possível carregar o perfil.</p>
            </div>
        `;
    }
}

// ─── Selos ────────────────────────────────────────────────────────────────────

async function carregarSelos() {
    const container = document.getElementById('selosContainer');

    try {
        // Tenta buscar selos do professor — ajuste o endpoint se necessário
        const selos = await apiFetch(`/professores/${PROFESSOR_ID}/selos`);

        if (!selos || selos.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Nenhum selo conquistado ainda.</p>';
            return;
        }

        container.innerHTML = selos.map(s => `
            <div class="selo" title="${s.nome || 'Selo'}">
                ${s.icone || '🏅'}
            </div>
        `).join('');

    } catch {
        // Endpoint ainda não existe ou sem selos — apenas oculta a seção
        document.getElementById('selosSection').style.display = 'none';
    }
}

// ─── Turmas ───────────────────────────────────────────────────────────────────

async function carregarTurmas() {
    const container = document.getElementById('turmasGrid');

    try {
        const turmas = await apiFetch('/series');

        if (!turmas || turmas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>Nenhuma turma encontrada.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = turmas.map(turma => `
            <div class="turma-card" onclick="carregarAlunos(${turma.id}, '${escapeAttr(turma.nomeSerie)}')">
                <div class="icone"><i class="fas fa-user-graduate"></i></div>
                <div class="nome-turma">${turma.nomeSerie}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar turmas:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar turmas.</p>
            </div>
        `;
    }
}

// ─── Alunos da Turma ──────────────────────────────────────────────────────────

async function carregarAlunos(turmaId, turmaNome) {
    const section = document.getElementById('alunosSection');
    const container = document.getElementById('alunosContainer');
    const titulo = document.getElementById('turmaTitulo');

    section.style.display = 'block';
    titulo.innerHTML = `<i class="fas fa-user-graduate"></i> Alunos — ${turmaNome}`;
    container.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando alunos...</p>
        </div>
    `;

    // Scroll suave até a seção
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const alunos = await apiFetch(`/alunos/serie/${turmaId}`);

        if (!alunos || alunos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <p>Nenhum aluno nesta turma.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = alunos.map(aluno => `
    <div class="aluno-card">
        <div class="aluno-avatar">${getIniciais(aluno.nome)}</div>
        <div class="aluno-info">
            <h4>${aluno.nome}</h4>
            ${aluno.email ? `<p><i class="fas fa-envelope"></i> ${aluno.email}</p>` : ''}
        </div>
    </div>
`).join('');


    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar alunos da turma.</p>
            </div>
        `;
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeAttr(str = '') {
    return str.replace(/'/g, "\\'");
}

// ─── Inicialização ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    // Fechar seção de alunos
    document.getElementById('fecharAlunos')?.addEventListener('click', () => {
        document.getElementById('alunosSection').style.display = 'none';
    });

    // Fechar modal
    document.getElementById('modalClose')?.addEventListener('click', () => {
        document.getElementById('modal').style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modal');
        if (e.target === modal) modal.style.display = 'none';
    });

    // Carregar dados
    carregarPerfil();
    carregarSelos();
    carregarTurmas();
});
