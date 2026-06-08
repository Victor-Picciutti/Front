// src/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('⚠️ GEMINI_API_KEY não configurada!');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    async gerarTemaRedacao() {
        const prompt = `
            Você é um especialista em redação do ENEM.
            Gere um tema de redação no formato dissertativo-argumentativo,
            inspirado em temas de atualidades.
            O tema deve ser atual, relevante e desafiador.
            Responda APENAS com o tema, sem explicações adicionais.
            Não use aspas no início ou fim.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('Erro ao gerar tema:', error);
            throw error;
        }
    }

    async gerarDicasRedacao() {
        const prompt = `
            Gere 6 dicas rápidas para uma redação nota 1000 no ENEM.
            Responda em formato de lista numerada (1. 2. 3. ...).
            Seja objetivo e prático.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('Erro ao gerar dicas:', error);
            throw error;
        }
    }

    async corrigirRedacao(titulo, conteudo) {
        const prompt = `
            Corrija a seguinte redação no estilo ENEM.
            
            Título: ${titulo}
            
            Redação:
            ${conteudo}
            
            Responda no seguinte formato:
            
            NOTA: (0-1000)
            
            PONTOS FORTES:
            - item 1
            - item 2
            
            PONTOS A MELHORAR:
            - item 1
            - item 2
            
            SUGESTÕES DE MELHORIA:
            - sugestão 1
            - sugestão 2
        `;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('Erro ao corrigir redação:', error);
            throw error;
        }
    }

    async gerarTemaPersonalizado(area) {
        const prompt = `
            Gere um tema de redação no modelo ENEM sobre a área: ${area}.
            O tema deve ser atual, relevante e desafiador.
            Responda APENAS com o tema.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('Erro ao gerar tema personalizado:', error);
            throw error;
        }
    }
}

module.exports = new GeminiService();