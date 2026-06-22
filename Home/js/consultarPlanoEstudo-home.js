// consultarPlanoEstudo-home.js - Página de Plano de Estudo
// AGENDA baseada em MATÉRIAS/DISCIPLINAS

// ========== CONFIGURAÇÕES ==========
//const API_URL = 'http://localhost:8080';
const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_ALUNO_LOGADO = 1;

// Variáveis globais
let dadosAluno = null;
let dadosSerie = null;
let listaDisciplinas = [];
let todasAtividades = [];
let atividadesRespondidas = [];
let dadosUtilizador = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    inicializarSidebar();
    inicializarNotificacoes();
    inicializarLogout();
});

// ========== CARREGAR TODOS OS DADOS ==========
async function carregarDados() {
    try {
        await Promise.all([
            carregarAluno(),
            carregarDisciplinas(),
            carregarAtividades(),
            carregarAtividadesRespondidas()
        ]);
        
        atualizarPerfilAluno();
        renderizarAtividadesRecomendadas();
        renderizarAgendaPorMaterias();  // ← AGENDA POR MATÉRIAS
        renderizarRecomendacoes();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        carregarDadosMockados();
    }
}

// ========== REQUISIÇÕES API ==========

async function carregarAluno() {
    try {
        const response = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error('Erro ao carregar aluno');
        dadosAluno = await response.json();
        
        if (dadosAluno.serie?.idSerie) {
            await carregarSerie(dadosAluno.serie.idSerie);
        }
        
        await carregarUtilizador();
        
    } catch (error) {
        console.error('Erro ao carregar aluno:', error);
        throw error;
    }
}

async function carregarUtilizador() {
    try {
        const response = await fetch(`${API_URL}/utilizadores`);
        if (!response.ok) throw new Error('Erro ao carregar utilizador');
        const utilizadores = await response.json();
        dadosUtilizador = utilizadores.find(u => u.id === ID_ALUNO_LOGADO);
    } catch (error) {
        console.error('Erro ao carregar utilizador:', error);
    }
}

async function carregarSerie(idSerie) {
    try {
        const response = await fetch(`${API_URL}/series`);
        if (!response.ok) throw new Error('Erro ao carregar série');
        const series = await response.json();
        dadosSerie = series.find(s => s.idSerie === idSerie);
    } catch (error) {
        console.error('Erro ao carregar série:', error);
    }
}

async function carregarDisciplinas() {
    try {
        const response = await fetch(`${API_URL}/disciplinas`);
        if (!response.ok) throw new Error('Erro ao carregar disciplinas');
        listaDisciplinas = await response.json();
        
        // Se não veio nenhuma disciplina, usar mock
        if (listaDisciplinas.length === 0) {
            listaDisciplinas = [
                { id: 1, nome: 'Matemática' },
                { id: 2, nome: 'Português' },
                { id: 3, nome: 'Ciências' },
                { id: 4, nome: 'História' },
                { id: 5, nome: 'Geografia' },
                { id: 6, nome: 'Inglês' },
                { id: 7, nome: 'Física' },
                { id: 8, nome: 'Química' }
            ];
        }
        
    } catch (error) {
        console.error('Erro ao carregar disciplinas:', error);
        listaDisciplinas = [
            { id: 1, nome: 'Matemática' },
            { id: 2, nome: 'Português' },
            { id: 3, nome: 'Ciências' },
            { id: 4, nome: 'História' },
            { id: 5, nome: 'Geografia' },
            { id: 6, nome: 'Inglês' }
        ];
    }
}

async function carregarAtividades() {
    try {
        const response = await fetch(`${API_URL}/atividades`);
        if (!response.ok) throw new Error('Erro ao carregar atividades');
        todasAtividades = await response.json();
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        todasAtividades = [];
    }
}

async function carregarAtividadesRespondidas() {
    try {
        const response = await fetch(`${API_URL}/atividadesrespostas`);
        if (response.ok) {
            const todasRespostas = await response.json();
            atividadesRespondidas = todasRespostas.filter(r => 
                r.idAluno === ID_ALUNO_LOGADO && r.pontuacao !== null
            );
        }
    } catch (error) {
        console.error('Erro ao carregar respostas:', error);
        atividadesRespondidas = [];
    }
}

// ========== ATUALIZAR PERFIL DO ALUNO ==========
function atualizarPerfilAluno() {
    if (!dadosAluno) return;
    
    const nomeElement = document.getElementById('nomeAluno');
    if (nomeElement) {
        const nomeAluno = dadosUtilizador?.nome || dadosAluno.utilizador?.nome || 'Estudante';
        nomeElement.textContent = nomeAluno;
    }
    
    const serieElement = document.getElementById('serieAluno');
    if (serieElement) {
        const serieTexto = dadosSerie ? `${dadosSerie.nome}` : 'Não definida';
        serieElement.textContent = serieTexto;
    }
    
    const xp = dadosAluno.xp || 0;
    const xpElement = document.getElementById('xpAluno');
    if (xpElement) xpElement.textContent = xp;
    
    const nivel = calcularNivel(xp);
    const nivelElement = document.getElementById('nivelAluno');
    if (nivelElement) nivelElement.textContent = nivel;
    
    // Estatísticas
    const totalAtividades = todasAtividades.length;
    const atividadesConcluidas = atividadesRespondidas.length;
    const progressoGeral = totalAtividades > 0 ? Math.round((atividadesConcluidas / totalAtividades) * 100) : 0;
    
    const totalElement = document.getElementById('totalAtividades');
    const concluidasElement = document.getElementById('atividadesConcluidas');
    const progressoElement = document.getElementById('progressoGeral');
    
    if (totalElement) totalElement.textContent = totalAtividades;
    if (concluidasElement) concluidasElement.textContent = atividadesConcluidas;
    if (progressoElement) progressoElement.textContent = `${progressoGeral}%`;
}

function calcularNivel(xp) {
    if (xp < 100) return 'Iniciante';
    if (xp < 300) return 'Aprendiz';
    if (xp < 600) return 'Estudante';
    if (xp < 1000) return 'Dedicado';
    if (xp < 1500) return 'Experiente';
    if (xp < 2100) return 'Avançado';
    if (xp < 2800) return 'Expert';
    return 'Mestre';
}

// ========== RENDERIZAR ATIVIDADES RECOMENDADAS ==========
function renderizarAtividadesRecomendadas() {
    const container = document.getElementById('atividadesList');
    if (!container) return;
    
    const idsConcluidas = atividadesRespondidas.map(r => r.idAtividade);
    const atividadesPendentes = todasAtividades.filter(a => !idsConcluidas.includes(a.idAtividade));
    
    if (atividadesPendentes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>Parabéns! Você concluiu todas as atividades!</p>
                <p>Novas atividades serão adicionadas em breve.</p>
            </div>
        `;
        return;
    }
    
    const recomendadas = atividadesPendentes.slice(0, 5);
    
    container.innerHTML = recomendadas.map(atividade => {
        const dificuldade = atividade.nivelDificuldade?.nome || 'Médio';
        return `
            <div class="atividade-item" onclick="irParaAtividade(${atividade.idAtividade})">
                <div class="atividade-info">
                    <div class="atividade-titulo">${escapeHtml(atividade.titulo || 'Atividade')}</div>
                    <div class="atividade-meta">
                        <span><i class="fas fa-star"></i> ${atividade.pontuacaoMaxima || 0} pts</span>
                        <span><i class="fas fa-calendar"></i> ${formatarData(atividade.dataCriacao)}</span>
                    </div>
                </div>
                <span class="dificuldade-badge dificuldade-${dificuldade}">${dificuldade}</span>
            </div>
        `;
    }).join('');
}

// ========== RENDERIZAR AGENDA POR MATÉRIAS (NOVO) ==========
function renderizarAgendaPorMaterias() {
    const container = document.getElementById('agendaList');
    if (!container) return;
    
    // Dias da semana
    const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    // Horários de estudo
    const horarios = [
        '08:00 - 09:30',
        '09:45 - 11:15',
        '11:30 - 12:30',
        '14:00 - 15:30',
        '15:45 - 17:15'
    ];
    
    // Se não tem matérias, mostrar mensagem
    if (listaDisciplinas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar"></i>
                <p>Nenhuma matéria disponível no momento.</p>
                <p>O professor irá atribuir as matérias em breve!</p>
            </div>
        `;
        return;
    }
    
    // Embaralhar as matérias para distribuir na semana
    const materiasEmbaralhadas = [...listaDisciplinas].sort(() => 0.5 - Math.random());
    
    // Distribuir matérias pelos dias da semana
    const agendaHTML = diasSemana.map((dia, indexDia) => {
        // Selecionar matérias para este dia (2 matérias por dia)
        const materiasDoDia = [];
        for (let i = 0; i < 2; i++) {
            const materiaIndex = (indexDia * 2 + i) % materiasEmbaralhadas.length;
            if (materiasEmbaralhadas[materiaIndex]) {
                materiasDoDia.push({
                    nome: materiasEmbaralhadas[materiaIndex].nome,
                    horario: horarios[i % horarios.length]
                });
            }
        }
        
        return `
            <div class="agenda-dia">
                <div class="dia-nome">
                    <i class="fas fa-calendar-day"></i>
                    ${dia}
                </div>
                ${materiasDoDia.map(materia => `
                    <div class="agenda-atividade">
                        <i class="fas fa-book"></i>
                        <span>${escapeHtml(materia.nome)}</span>
                        <span class="agenda-horario">${materia.horario}</span>
                    </div>
                `).join('')}
                ${materiasDoDia.length === 0 ? `
                    <div class="agenda-atividade">
                        <i class="fas fa-check-circle"></i>
                        <span>Dia de revisão</span>
                        <span class="agenda-horario">${horarios[0]}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = agendaHTML;
}

// ========== RENDERIZAR RECOMENDAÇÕES ==========
function renderizarRecomendacoes() {
    const container = document.getElementById('recomendacoes');
    if (!container) return;
    
    const xp = dadosAluno?.xp || 0;
    const totalAtividades = todasAtividades.length;
    const atividadesConcluidas = atividadesRespondidas.length;
    const pendentes = totalAtividades - atividadesConcluidas;
    const totalMaterias = listaDisciplinas.length;
    
    const recomendacoes = [];
    
    // Recomendação baseada no XP
    if (xp < 100) {
        recomendacoes.push({
            icone: 'fa-rocket',
            titulo: 'Comece sua jornada!',
            descricao: 'Você está começando agora. Recomendamos iniciar pelos conteúdos básicos de cada matéria.'
        });
    } else if (xp >= 100 && xp < 500) {
        recomendacoes.push({
            icone: 'fa-chart-line',
            titulo: 'Bom progresso!',
            descricao: 'Continue assim! A consistência nos estudos diários é a chave para o sucesso.'
        });
    } else if (xp >= 500 && xp < 1500) {
        recomendacoes.push({
            icone: 'fa-trophy',
            titulo: 'Excelente desempenho!',
            descricao: 'Você está acima da média. Continue mantendo esse ritmo de estudos.'
        });
    } else {
        recomendacoes.push({
            icone: 'fa-crown',
            titulo: 'Mestre dos Estudos!',
            descricao: 'Parabéns pelo excelente desempenho! Continue compartilhando conhecimento.'
        });
    }
    
    // Recomendação baseada em matérias
    if (totalMaterias > 0) {
        recomendacoes.push({
            icone: 'fa-layer-group',
            titulo: `${totalMaterias} matérias disponíveis`,
            descricao: 'Distribua seu tempo de estudo entre todas as matérias para um aprendizado equilibrado.'
        });
    }
    
    // Recomendação baseada em atividades
    if (pendentes > 0) {
        recomendacoes.push({
            icone: 'fa-tasks',
            titulo: `${pendentes} atividade(s) pendente(s)`,
            descricao: 'Complete as atividades pendentes para avançar nos seus estudos.'
        });
    }
    
    if (atividadesConcluidas === 0 && totalAtividades > 0) {
        recomendacoes.push({
            icone: 'fa-heart',
            titulo: 'Dê o primeiro passo!',
            descricao: 'Comece com uma atividade hoje mesmo. Cada passo conta na sua jornada!'
        });
    }
    
    container.innerHTML = recomendacoes.map(rec => `
        <div class="recomendacao-item">
            <i class="fas ${rec.icone}"></i>
            <div class="recomendacao-text">
                <strong>${rec.titulo}</strong>
                <p>${rec.descricao}</p>
            </div>
        </div>
    `).join('');
}

// ========== FUNÇÕES DA SIDEBAR ==========
function inicializarSidebar() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        }
        
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('active');
            } else {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            }
        });
    }
}

// ========== NOTIFICAÇÕES ==========
function inicializarNotificacoes() {
    const notificationIcon = document.getElementById('notificationsIcon');
    const modal = document.getElementById('notificationsModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (notificationIcon && modal) {
        notificationIcon.addEventListener('click', () => {
            modal.style.display = 'block';
            const badge = document.querySelector('.notification-badge');
            if (badge) badge.style.display = 'none';
        });
    }
    
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (modal && e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// ========== LOGOUT ==========
function inicializarLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Deseja realmente sair?')) {
                localStorage.clear();
                window.location.href = '../../../Login/HTML/login.html';
            }
        });
    }
}

// ========== FUNÇÕES UTILITÁRIAS ==========
function irParaAtividade(idAtividade) {
    window.location.href = '../../../Aluno/atividade/HTML/atividades-Estudex.html';
}

function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR');
    } catch {
        return dataString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== DADOS MOCKADOS PARA FALLBACK ==========
function carregarDadosMockados() {
    todasAtividades = [
        { idAtividade: 1, titulo: 'Matemática - Equações', pontuacaoMaxima: 100, dataCriacao: '2024-11-01', nivelDificuldade: { nome: 'Médio' } },
        { idAtividade: 2, titulo: 'Português - Interpretação', pontuacaoMaxima: 100, dataCriacao: '2024-11-02', nivelDificuldade: { nome: 'Fácil' } },
        { idAtividade: 3, titulo: 'Física - Cinemática', pontuacaoMaxima: 100, dataCriacao: '2024-11-03', nivelDificuldade: { nome: 'Difícil' } },
        { idAtividade: 4, titulo: 'Química - Tabela Periódica', pontuacaoMaxima: 100, dataCriacao: '2024-11-04', nivelDificuldade: { nome: 'Médio' } }
    ];
    
    atividadesRespondidas = [];
    dadosAluno = { id: ID_ALUNO_LOGADO, xp: 350 };
    dadosSerie = { nome: '1º Ano do Ensino Médio' };
    dadosUtilizador = { nome: 'João Silva' };
    listaDisciplinas = [
        { id: 1, nome: 'Matemática' },
        { id: 2, nome: 'Português' },
        { id: 3, nome: 'Ciências' },
        { id: 4, nome: 'História' },
        { id: 5, nome: 'Geografia' },
        { id: 6, nome: 'Inglês' },
        { id: 7, nome: 'Física' },
        { id: 8, nome: 'Química' }
    ];
    
    atualizarPerfilAluno();
    renderizarAtividadesRecomendadas();
    renderizarAgendaPorMaterias();
    renderizarRecomendacoes();
    
    console.log('Usando dados mockados');
}
