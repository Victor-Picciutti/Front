// server.js - Gerador de temas com Groq (API correta)

const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Inicializar o cliente do Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Função para gerar tema aleatório
async function gerarTemaIA() {
    const prompt = `
        Você é um especialista em redação do ENEM.
        Gere um tema de redação ORIGINAL e SURPREENDENTE.
        O tema deve ser atual, relevante e instigante.
        Pode ser sobre tecnologia, sociedade, meio ambiente, educação, saúde, etc.
        Seja criativo! Pense em algo que não seja clichê.
        Responda APENAS com o tema, sem explicações.
        Não use aspas.
    `;
    
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
        });

        return chatCompletion.choices[0]?.message?.content || "Não foi possível gerar um tema.";
    } catch (error) {
        console.error('Erro detalhado do Groq:', error);
        throw error;
    }
}

// Função para gerar tema por categoria
async function gerarTemaPorCategoria(categoria) {
    const categorias = {
        tecnologia: "tecnologia e inovação",
        meioambiente: "meio ambiente e sustentabilidade",
        educacao: "educação e aprendizado",
        saude: "saúde pública e bem-estar",
        cultura: "cultura e identidade brasileira"
    };
    
    const temaCategoria = categorias[categoria] || categoria;
    
    const prompt = `
        Você é um especialista em redação do ENEM.
        Gere um tema de redação ORIGINAL e CRIATIVO sobre: ${temaCategoria}.
        O tema deve ser atual, relevante e instigante.
        Responda APENAS com o tema, sem explicações.
        Não use aspas.
    `;
    
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
        });

        return chatCompletion.choices[0]?.message?.content || "Não foi possível gerar um tema.";
    } catch (error) {
        console.error('Erro detalhado do Groq:', error);
        throw error;
    }
}

// Endpoint: Tema aleatório
app.get('/api/redacao/tema', async (req, res) => {
    try {
        const tema = await gerarTemaIA();
        res.json({ sucesso: true, tema: tema });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ 
            sucesso: false, 
            erro: error.message,
            tema: "Os desafios da educação brasileira no século XXI"
        });
    }
});

// Endpoint: Tema surpresa
app.get('/api/redacao/tema-surpresa', async (req, res) => {
    try {
        const tema = await gerarTemaIA();
        res.json({ sucesso: true, tema: tema });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ 
            sucesso: false, 
            erro: error.message,
            tema: "Os desafios da sociedade contemporânea"
        });
    }
});

// Endpoint: Tema por categoria
app.get('/api/redacao/tema/:categoria', async (req, res) => {
    const { categoria } = req.params;
    
    try {
        const tema = await gerarTemaPorCategoria(categoria);
        res.json({ sucesso: true, tema: tema, categoria: categoria });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ 
            sucesso: false, 
            erro: error.message,
            tema: "Os desafios da sociedade contemporânea"
        });
    }
});

// Endpoint: Múltiplos temas
app.get('/api/redacao/temas-multiplos/:quantidade', async (req, res) => {
    const quantidade = Math.min(parseInt(req.params.quantidade) || 3, 5);
    
    const prompt = `
        Gere ${quantidade} temas diferentes para redação no estilo ENEM.
        Cada tema deve ser único, original e criativo.
        Responda APENAS com os temas, um por linha, numerados.
        Exemplo:
        1. Tema um
        2. Tema dois
    `;
    
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
        });
        
        const texto = chatCompletion.choices[0]?.message?.content || "";
        const linhas = texto.split('\n');
        const temas = [];
        
        for (const linha of linhas) {
            const match = linha.match(/^\d+\.\s*(.+)$/);
            if (match) {
                temas.push(match[1].trim());
            }
        }
        
        res.json({ sucesso: true, temas: temas, quantidade: temas.length });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Health check
app.get('/api/redacao/health', (req, res) => {
    res.json({ 
        status: 'online', 
        servico: 'Microserviço ENEM - Groq',
        modelo: 'llama-3.3-70b-versatile'
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Microserviço ENEM com Groq rodando!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🎲 Tema aleatório: http://localhost:${PORT}/api/redacao/tema-surpresa`);
    console.log(`📚 Múltiplos temas: http://localhost:${PORT}/api/redacao/temas-multiplos/3\n`);
});