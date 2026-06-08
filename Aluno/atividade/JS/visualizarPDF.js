const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';
const params = new URLSearchParams(window.location.search);
const idAtividade = params.get('id');

if (!idAtividade) {
    window.location.href = 'atividades-Estudex.html';
}

async function carregarPDF() {
    try {
        const resAtividade = await fetch(`${API_URL}/atividades/${idAtividade}`);
        if (resAtividade.ok) {
            const atividade = await resAtividade.json();
            document.title = `EstudeX | ${atividade.titulo}`;
        }

        const response = await fetch(`${API_URL}/atividadeconteudo/${idAtividade}/arquivo`);
        if (!response.ok) throw new Error('PDF não encontrado');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        document.getElementById('pdfViewer').innerHTML = `
            <iframe src="${url}" type="application/pdf"></iframe>
        `;

    } catch (error) {
        console.error('Erro ao carregar PDF:', error);
        document.getElementById('pdfViewer').innerHTML = `
            <div class="loading-pdf">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar o material</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnIrAtividade').addEventListener('click', () => {
        window.location.href = `responderAtividade.html?id=${idAtividade}`;
    });

    carregarPDF();
});