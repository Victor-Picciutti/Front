// professor-criar-redacao.js

const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const ID_PROFESSOR_LOGADO = 6;

let redacaoSelecionada = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarRedacoesCriadas();
    inicializarEventos();
});

async function carregarRedacoesCriadas() {
    const container = document.getElementById('redacoesCriadasList');
    
    try {
        const response = await fetch(`${API_URL}/redacoes/professor/${ID_PROFESSOR_LOGADO}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar');
        }
        
        const redacoes = await response.json();
        
        if (redacoes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Você ainda não criou nenhuma redação.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = redacoes.map(red => `
            <div class="redacao-criada-item" onclick="verDetalhesRedacao(${red.idRedacao})">
                <div class="redacao-criada-titulo">
                    <span>${escapeHtml(red.titulo)}</span>
                </div>
                <div class="redacao-criada-tema">
                    <i class="fas fa-tag"></i> ${escapeHtml(red.tema)}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar redações.</p>
            </div>
        `;
    }
}

// ============================================================
//  VER DETALHES DA REDAÇÃO (MODAL)
// ============================================================
async function verDetalhesRedacao(idRedacao) {
    try {
        const response = await fetch(`${API_URL}/redacoes/${idRedacao}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar detalhes');
        }
        
        const redacao = await response.json();
        redacaoSelecionada = redacao;
        
        // Preencher modal
        document.getElementById('modalTitulo').textContent = redacao.titulo;
        document.getElementById('modalTema').textContent = redacao.tema;
        document.getElementById('modalDescricao').textContent = redacao.textoRedacao || 'Sem descrição adicional';
        
        // Mostrar modal
        document.getElementById('modal-redacao').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarToast('Erro ao carregar detalhes da redação', 'error');
    }
}

function fecharModalRedacao() {
    document.getElementById('modal-redacao').style.display = 'none';
    redacaoSelecionada = null;
}

async function excluirRedacao() {
    if (!redacaoSelecionada) return;
    
    if (confirm(`Tem certeza que deseja excluir a redação "${redacaoSelecionada.titulo}"?`)) {
        try {
            const response = await fetch(`${API_URL}/redacoes/${redacaoSelecionada.idRedacao}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao excluir');
            }
            
            mostrarToast('✅ Redação excluída com sucesso!', 'success');
            fecharModalRedacao();
            await carregarRedacoesCriadas();
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarToast('❌ Erro ao excluir redação', 'error');
        }
    }
}

async function criarRedacao(event) {
    event.preventDefault();
    
    const titulo = document.getElementById('titulo').value.trim();
    const tema = document.getElementById('tema').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    
    if (!titulo || !tema) {
        mostrarToast('Preencha título e tema.', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('criarBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Criando...';
    
    try {
        const redacaoData = {
            titulo: titulo,
            tema: tema,
            textoRedacao: descricao || ''
        };
        
        const response = await fetch(`${API_URL}/redacoes/professor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(redacaoData)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao criar');
        }
        
        mostrarToast('✅ Redação criada com sucesso!', 'success');
        
        document.getElementById('titulo').value = '';
        document.getElementById('tema').value = '';
        document.getElementById('descricao').value = '';
        
        await carregarRedacoesCriadas();
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarToast('❌ Erro ao criar redação.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function limparFormulario() {
    if (confirm('Limpar formulário?')) {
        document.getElementById('titulo').value = '';
        document.getElementById('tema').value = '';
        document.getElementById('descricao').value = '';
        mostrarToast('Formulário limpo!', 'info');
    }
}

function mostrarToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const msgEl = document.getElementById('toast-msg');
    if (!toast || !icon || !msgEl) return;

    msgEl.textContent = msg;
    toast.className = 'toast';

    if (tipo === 'error') {
        toast.classList.add('error');
        icon.className = 'fas fa-circle-xmark';
    } else if (tipo === 'info') {
        toast.classList.add('info');
        icon.className = 'fas fa-info-circle';
    } else {
        icon.className = 'fas fa-circle-check';
    }

    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function inicializarEventos() {
    document.getElementById('criarRedacaoForm')?.addEventListener('submit', criarRedacao);
    document.getElementById('limparBtn')?.addEventListener('click', limparFormulario);
    document.getElementById('refreshRedacoesBtn')?.addEventListener('click', () => carregarRedacoesCriadas());
}

// Expor funções globalmente
window.verDetalhesRedacao = verDetalhesRedacao;
window.fecharModalRedacao = fecharModalRedacao;
window.excluirRedacao = excluirRedacao;