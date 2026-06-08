document.addEventListener("DOMContentLoaded", function () {

    console.log("👨‍🏫 Página Atividade carregada");

    const API_URL = 'https://apiestudex-b0angcajf4fdgugt.eastus2-01.azurewebsites.net';

    const selectSerie = document.getElementById("serie");
    const selectDificuldade = document.getElementById("dificuldadeQuestao");
    const selectDisciplina = document.getElementById("disciplina");

    // =========================================
    // CARREGAR TURMAS
    // =========================================
    async function carregarTurmas() {
        try {
            const response = await fetch(`${API_URL}/series`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const series = await response.json();
            selectSerie.innerHTML = '<option value="">Selecione a turma</option>';
            series.forEach(serie => {
                const option = document.createElement("option");
                option.value = serie.idSerie || serie.id;
                option.textContent = serie.nomeSerie;
                selectSerie.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
            selectSerie.innerHTML = '<option value="">Erro ao carregar turmas</option>';
        }
    }

    // =========================================
    // CARREGAR DIFICULDADES
    // =========================================
    async function carregarDificuldades() {
        try {
            const response = await fetch(`${API_URL}/niveldificuldade`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const dificuldades = await response.json();
            selectDificuldade.innerHTML = '<option value="">Selecione a dificuldade</option>';
            dificuldades.forEach(dificuldade => {
                const option = document.createElement("option");
                option.value = dificuldade.idNivelDificuldade;
                option.textContent = dificuldade.nome;
                selectDificuldade.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar dificuldades:", error);
            selectDificuldade.innerHTML = '<option value="">Erro ao carregar dificuldades</option>';
        }
    }

    // =========================================
    // CARREGAR DISCIPLINAS
    // =========================================
    async function carregarDisciplinas() {
        try {
            const response = await fetch(`${API_URL}/disciplinas`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const disciplinas = await response.json();
            selectDisciplina.innerHTML = '<option value="">Selecione a disciplina</option>';
            disciplinas.forEach(disciplina => {
                const option = document.createElement("option");
                option.value = disciplina.idDisciplina || disciplina.id;
                option.textContent = disciplina.nome;
                selectDisciplina.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar disciplinas:", error);
            selectDisciplina.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
        }
    }

    // =========================================
    // INDEXEDDB - GUARDAR PDF TEMPORÁRIO
    // =========================================
    function salvarPDFIndexedDB(arquivo) {
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
                const tx = db.transaction("arquivos", "readwrite");
                const store = tx.objectStore("arquivos");
                store.put({ id: "pdfAtividade", arquivo });

                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // =========================================
    // DROPDOWN CUSTOMIZADO
    // =========================================
    function criarDropdownCustom(selectEl) {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';

        const selected = document.createElement('div');
        selected.className = 'custom-select-selected';
        selected.innerHTML = `<span>${selectEl.options[0]?.text || 'Selecione...'}</span><i class="fas fa-chevron-down"></i>`;

        const list = document.createElement('div');
        list.className = 'custom-select-list';

        wrapper.appendChild(selected);
        wrapper.appendChild(list);

        selectEl.style.display = 'none';
        selectEl.parentNode.insertBefore(wrapper, selectEl);
        wrapper.appendChild(selectEl);

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            fecharTodosDropdowns();
            if (!isOpen) {
                wrapper.classList.add('open');
                renderOpcoes();
            }
        });

        function renderOpcoes() {
            list.innerHTML = '';
            Array.from(selectEl.options).forEach((opt) => {
                const item = document.createElement('div');
                item.className = 'custom-select-item';
                if (opt.value === selectEl.value) item.classList.add('active');
                item.textContent = opt.text;
                item.dataset.value = opt.value;

                item.addEventListener('click', () => {
                    selectEl.value = opt.value;
                    selected.innerHTML = `<span>${opt.text}</span><i class="fas fa-chevron-down"></i>`;
                    wrapper.classList.remove('open');
                    selectEl.dispatchEvent(new Event('change'));
                });

                list.appendChild(item);
            });
        }

        const observer = new MutationObserver(() => {
            const firstOpt = selectEl.options[0];
            if (firstOpt) {
                selected.innerHTML = `<span>${firstOpt.text}</span><i class="fas fa-chevron-down"></i>`;
            }
        });
        observer.observe(selectEl, { childList: true });

        return wrapper;
    }

    function fecharTodosDropdowns() {
        document.querySelectorAll('.custom-select-wrapper.open')
            .forEach(w => w.classList.remove('open'));
    }

    document.addEventListener('click', fecharTodosDropdowns);

    // =========================================
    // INICIAR
    // =========================================
    carregarTurmas();
    carregarDificuldades();
    carregarDisciplinas();
    criarDropdownCustom(selectSerie);
    criarDropdownCustom(selectDificuldade);
    criarDropdownCustom(selectDisciplina);

    // =========================================
    // BOTÃO CRIAR ATIVIDADE
    // =========================================
    document.getElementById("btnSalvarAtividade").addEventListener("click", function () {
        const idSerie = selectSerie.value;
        const idDificuldade = selectDificuldade.value;
        const idDisciplina = document.getElementById("disciplina").value;

        if (!idSerie) { alert("Selecione a turma."); return; }
        if (!idDificuldade) { alert("Selecione a dificuldade."); return; }
        if (!idDisciplina) { alert("Selecione a disciplina."); return; }

        localStorage.setItem("idSerie", idSerie);
        localStorage.setItem("idDificuldade", idDificuldade);
        localStorage.setItem("idDisciplina", idDisciplina);

        document.getElementById("modalMaterial").style.display = "flex";
    });

    // =========================================
    // MODAL MATERIAL DE APOIO
    // =========================================

    document.getElementById("btnSimMaterial").addEventListener("click", function () {
        document.getElementById("uploadArea").style.display = "block";
        this.style.display = "none";
    });

    document.getElementById("inputArquivo").addEventListener("change", function () {
        if (this.files[0]) {
            document.getElementById("uploadTexto").textContent = this.files[0].name;

            const uploadArea = document.getElementById("uploadArea");

            const botoesAntigos = document.getElementById("botoesArquivo");
            if (botoesAntigos) botoesAntigos.remove();

            const botoes = document.createElement("div");
            botoes.id = "botoesArquivo";
            botoes.style.cssText = "display:flex; gap:10px; justify-content:center; margin-top:15px;";
            botoes.innerHTML = `
                <button id="btnConfirmarArquivo" class="btn-primary">
                    <i class="fas fa-check"></i> Confirmar
                </button>
                <button id="btnRemoverArquivo" class="btn-secondary">
                    <i class="fas fa-trash"></i> Remover
                </button>
            `;
            uploadArea.appendChild(botoes);

            document.getElementById("btnConfirmarArquivo").addEventListener("click", async function () {
                const arquivo = document.getElementById("inputArquivo").files[0];
                if (!arquivo) return;

                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
                this.disabled = true;

                try {
                    await salvarPDFIndexedDB(arquivo);
                    localStorage.setItem("temMaterial", "true");
                    document.getElementById("modalMaterial").style.display = "none";
                    window.location.href = "atividadeCriar.html";
                } catch (err) {
                    console.error("Erro ao salvar PDF:", err);
                    alert("Erro ao salvar o PDF.");
                    this.innerHTML = '<i class="fas fa-check"></i> Confirmar';
                    this.disabled = false;
                }
            });

            document.getElementById("btnRemoverArquivo").addEventListener("click", function () {
                document.getElementById("inputArquivo").value = "";
                document.getElementById("uploadTexto").textContent = "Clique para selecionar um PDF";
                botoes.remove();
                document.getElementById("uploadArea").style.display = "none";
                document.getElementById("btnSimMaterial").style.display = "inline-flex";
            });
        }
    });

    document.getElementById("btnNaoMaterial").addEventListener("click", function () {
        localStorage.removeItem("temMaterial");
        document.getElementById("modalMaterial").style.display = "none";
        window.location.href = "atividadeCriar.html";
    });

    document.getElementById("modalMaterial").addEventListener("click", function (e) {
        if (e.target === this) {
            this.style.display = "none";
        }
    });

    // =========================================
    // BOTÃO MINHAS ATIVIDADES
    // =========================================
    document.getElementById("btnConsultarAtividade").addEventListener("click", function () {
        window.location.href = "minhasAtividades.html";
    });

});