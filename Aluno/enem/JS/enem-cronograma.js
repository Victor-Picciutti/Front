
// enem-cronograma.js
const ENEM_API = {
    cronograma: 'http://localhost:3001/api/enem'
};

class EnemCronograma {
    constructor() {
        this.eventos = [];
        this.lembretes = [];
        this.init();
    }

    async init() {
        await this.carregarProximosEventos(90);
        await this.carregarLembretesHoje();
        this.initAccordion();
        this.initFiltros();
    }

    async carregarProximosEventos(dias = 90) {
        try {
            console.log('🔄 Carregando eventos...');
            
            // Timeout de 3 segundos
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${ENEM_API.cronograma}/proximos?dias=${dias}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            const data = await response.json();
            
            if (data.sucesso && data.dados.length > 0) {
                this.eventos = data.dados;
                console.log('✅ Eventos carregados da API');
            } else {
                this.usarEventosFallback();
            }
        } catch (error) {
            console.log('⚠️ API não respondeu, usando dados locais');
            this.usarEventosFallback();
        }
        
        this.renderizarEventos();
    }

    usarEventosFallback() {
        this.eventos = [
            {
                id: 1,
                titulo: "📝 Inscrições ENEM 2026",
                descricao: "Período para realizar a inscrição no ENEM",
                data_inicio: "2026-02-15",
                data_fim: "2026-03-15",
                tipo: "inscricao",
                cor: "#4CAF50",
                icone: "fa-pen-to-square",
                dias_restantes: 45
            },
            {
                id: 2,
                titulo: "📚 1º Dia de Prova",
                descricao: "Linguagens, Redação e Ciências Humanas",
                data: "2026-11-01",
                tipo: "prova",
                cor: "#2196F3",
                icone: "fa-pencil",
                dias_restantes: 210
            },
            {
                id: 3,
                titulo: "🧮 2º Dia de Prova",
                descricao: "Matemática e Ciências da Natureza",
                data: "2026-11-08",
                tipo: "prova",
                cor: "#2196F3",
                icone: "fa-calculator",
                dias_restantes: 217
            },
            {
                id: 4,
                titulo: "⭐ Resultado ENEM",
                descricao: "Divulgação das notas individuais",
                data: "2027-01-15",
                tipo: "resultado",
                cor: "#FF9800",
                icone: "fa-star",
                dias_restantes: 290
            }
        ];
    }

    async carregarLembretesHoje() {
        try {
            const response = await fetch(`${ENEM_API.cronograma}/lembretes/hoje`);
            const data = await response.json();
            
            if (data.sucesso && data.lembretes.length > 0) {
                this.lembretes = data.lembretes;
                this.renderizarLembretes();
            }
        } catch (error) {
            console.log('⚠️ Sem lembretes da API');
        }
    }

    renderizarEventos() {
        const eventosGrid = document.getElementById('eventos-lista');
        if (!eventosGrid) return;

        if (this.eventos.length > 0) {
            eventosGrid.innerHTML = this.eventos.map(evento => this.renderizarEvento(evento)).join('');
        } else {
            eventosGrid.innerHTML = '<div class="nenhum-evento">Nenhum evento encontrado</div>';
        }
    }

    renderizarEvento(evento) {
        const dataEvento = evento.data || evento.data_inicio;
        const dataFim = evento.data_fim ? ` a ${this.formatarData(evento.data_fim)}` : '';
        
        return `
            <div class="evento-item" style="border-left-color: ${evento.cor}">
                <i class="fas ${evento.icone}" style="color: ${evento.cor}"></i>
                <div class="evento-info">
                    <h4>${evento.titulo}</h4>
                    <p>${evento.descricao}</p>
                    <span class="evento-data">
                        <i class="far fa-calendar-alt"></i>
                        ${this.formatarData(dataEvento)}${dataFim}
                    </span>
                    <span class="dias-restantes" style="background-color: ${evento.cor}20; color: ${evento.cor}">
                        ${this.getTextoDiasRestantes(evento.dias_restantes)}
                    </span>
                </div>
            </div>
        `;
    }

    renderizarLembretes() {
        this.lembretes.forEach(lembrete => {
            this.mostrarNotificacao(lembrete);
        });
    }

    mostrarNotificacao(lembrete) {
        let container = document.querySelector('.notificacoes-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notificacoes-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'notificacao-toast';
        toast.style.borderLeftColor = lembrete.cor;
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle" style="color: ${lembrete.cor}"></i>
            <div class="notificacao-conteudo">
                <strong>${lembrete.titulo}</strong>
                <p>${lembrete.mensagem}</p>
            </div>
            <button class="fechar-notificacao">&times;</button>
        `;

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 8000);
        
        toast.querySelector('.fechar-notificacao').addEventListener('click', () => {
            toast.remove();
        });
    }

    formatarData(dataString) {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getTextoDiasRestantes(dias) {
        if (dias > 0) {
            return `⏳ Faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
        } else if (dias === 0) {
            return '🔔 É hoje!';
        } else {
            return '✅ Evento realizado';
        }
    }

    initAccordion() {
        const dicaHeaders = document.querySelectorAll('.dica-header');
        
        dicaHeaders.forEach(header => {
            header.addEventListener('click', function() {
                this.classList.toggle('ativo');
                const conteudo = this.nextElementSibling;
                if (conteudo) {
                    conteudo.classList.toggle('ativo');
                }
            });
        });
    }

    initFiltros() {
        const filtros = document.querySelectorAll('.filtro-btn');
        filtros.forEach(btn => {
            btn.addEventListener('click', () => {
                filtros.forEach(b => b.classList.remove('ativo'));
                btn.classList.add('ativo');
                // Aqui você pode implementar a lógica de filtro
            });
        });
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    new EnemCronograma();
});

// Fallback de segurança após 5 segundos
setTimeout(() => {
    if (!document.querySelector('.evento-item')) {
        console.log('⚠️ Forçando carregamento de fallback');
        new EnemCronograma();
    }
}, 5000);