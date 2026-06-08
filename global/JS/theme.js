/**
 * THEME.JS — Controlador Global de Tema — EstudeX
 * ─────────────────────────────────────────────────────────────────────────
 * ✅ Arquivo ÚNICO para todo o projeto.
 * ✅ Substitui TODOS os themes.js locais (Aluno, Home, Inicio, Professor…).
 * ✅ Mantém compatibilidade com a chave "tema" já salva no localStorage.
 * ✅ Mantém compatibilidade com as aparências (theme-neon, theme-darkpro…).
 * ✅ Injeta o botão toggle automaticamente (sem precisar alterar o HTML).
 * ✅ Detecta preferência do sistema como fallback.
 * ✅ Expõe API pública: ThemeController.toggle() / .setTheme() / .getTheme()
 *
 * COMO INCLUIR EM CADA PÁGINA:
 *   <script src="../../global/JS/theme.js" defer></script>
 *   (ajuste o caminho ../../ de acordo com a profundidade da página)
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {
  "use strict";

  /* ── Constantes ──────────────────────────────────────────────────────── */
  const STORAGE_KEY_TEMA      = "tema";        // compatibilidade com código existente
  const STORAGE_KEY_APARENCIA = "aparencia";   // compatibilidade com código existente
  const LIGHT_CLASS           = "light";       // classe usada no html.light do CSS
  const TOGGLE_BTN_ID         = "theme-toggle";
  const CUSTOM_EVENT          = "themechange";

  const ICON_PARA_CLARO  = "☀️";   // exibido quando o tema está escuro  → clica pra claro
  const ICON_PARA_ESCURO = "🌙";   // exibido quando o tema está claro   → clica pra escuro

  /* ── Utilitários de persistência ─────────────────────────────────────── */
  function lerStorage(chave) {
    try { return localStorage.getItem(chave); } catch { return null; }
  }

  function salvarStorage(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch { /* silencioso */ }
  }

  /* ── Preferência do sistema ──────────────────────────────────────────── */
  function preferenciaDoSistema() {
    return window.matchMedia &&
           window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light" : "dark";
  }

  /* ── Aplicar tema ────────────────────────────────────────────────────── */
  function aplicarTema(tema) {
    const html = document.documentElement;

    if (tema === "light") {
      html.classList.add(LIGHT_CLASS);
    } else {
      html.classList.remove(LIGHT_CLASS);
    }

    // Marca o html para desativar o fallback CSS do prefers-color-scheme
    html.setAttribute("data-theme-set", "true");

    atualizarBotao(tema);
    dispararEvento(tema);
  }

  /* ── Aplicar aparência (theme-neon, theme-darkpro, theme-azuldev) ────── */
  function aplicarAparencia(aparencia) {
    if (!aparencia) return;
    const html = document.documentElement;
    // Remove aparências anteriores
    html.classList.remove("theme-neon", "theme-darkpro", "theme-azuldev");
    html.classList.add(aparencia);
  }

  /* ── Atualizar ícone e aria do botão ─────────────────────────────────── */
  function atualizarBotao(tema) {
    const btn = document.getElementById(TOGGLE_BTN_ID);
    if (!btn) return;

    if (tema === "light") {
      btn.textContent = ICON_PARA_ESCURO;
      btn.setAttribute("aria-label", "Ativar tema escuro");
      btn.title = "Ativar tema escuro";
    } else {
      btn.textContent = ICON_PARA_CLARO;
      btn.setAttribute("aria-label", "Ativar tema claro");
      btn.title = "Ativar tema claro";
    }
  }

  /* ── Evento customizado ──────────────────────────────────────────────── */
  function dispararEvento(tema) {
    document.dispatchEvent(
      new CustomEvent(CUSTOM_EVENT, { detail: { tema }, bubbles: true })
    );
  }

  /* ── Alternar tema ───────────────────────────────────────────────────── */
  function alternarTema() {
    const temaAtual = document.documentElement.classList.contains(LIGHT_CLASS)
      ? "light" : "dark";
    const proximoTema = temaAtual === "light" ? "dark" : "light";

    aplicarTema(proximoTema);
    salvarStorage(STORAGE_KEY_TEMA, proximoTema);
  }

  /* ── Injetar botão toggle ────────────────────────────────────────────── */
  function injetarBotao() {
    // Se o HTML já tiver um botão com id="theme-toggle", apenas vincula o evento
    let btn = document.getElementById(TOGGLE_BTN_ID);

    if (!btn) {
      btn = document.createElement("button");
      btn.id   = TOGGLE_BTN_ID;
      btn.type = "button";
      document.body.appendChild(btn);
    }

    btn.addEventListener("click", alternarTema);
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternarTema(); }
    });
  }

  /* ── Observar mudança de preferência do sistema ──────────────────────── */
  function observarSistema() {
    if (!window.matchMedia) return;
    window.matchMedia("(prefers-color-scheme: light)")
      .addEventListener("change", (e) => {
        // Só reage se o usuário nunca tiver salvo uma preferência manual
        if (!lerStorage(STORAGE_KEY_TEMA)) {
          aplicarTema(e.matches ? "light" : "dark");
        }
      });
  }

  /* ── Inicialização completa (após DOM pronto) ────────────────────────── */
  function init() {
    injetarBotao();
    observarSistema();

    // Sincroniza o tema para o <body> também (alguns CSS usam body.light)
    // Já foi aplicado no <html> pelo antiFlash — aqui só garante consistência
    const temaAtual = document.documentElement.classList.contains(LIGHT_CLASS)
      ? "light" : "dark";
    atualizarBotao(temaAtual);
  }

  /* ── ANTI-FLASH ──────────────────────────────────────────────────────────
     Executado IMEDIATAMENTE (síncrono, sem esperar DOMContentLoaded).
     Aplica o tema no <html> antes do primeiro paint para evitar flash branco.
  ──────────────────────────────────────────────────────────────────────── */
  (function antiFlash() {
    const temaSalvo   = lerStorage(STORAGE_KEY_TEMA);
    const aparenciaSalva = lerStorage(STORAGE_KEY_APARENCIA);
    const temaFinal   = temaSalvo || preferenciaDoSistema();

    aplicarTema(temaFinal);

    if (aparenciaSalva) {
      aplicarAparencia(aparenciaSalva);
    }
  })();

  /* ── Aguarda o DOM para injetar o botão ──────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ── API Pública ─────────────────────────────────────────────────────────
     Disponível globalmente como: window.ThemeController
     
     Exemplos de uso em outros scripts:
       ThemeController.toggle()
       ThemeController.setTheme("light")
       ThemeController.getTheme()          → "dark" | "light"
       ThemeController.setAparencia("theme-azuldev")
       
     Escutar mudanças de tema:
       document.addEventListener("themechange", (e) => {
         console.log("Novo tema:", e.detail.tema);
       });
  ──────────────────────────────────────────────────────────────────────── */
  window.ThemeController = {
    toggle: alternarTema,

    setTheme: function (tema) {
      if (tema !== "light" && tema !== "dark") return;
      aplicarTema(tema);
      salvarStorage(STORAGE_KEY_TEMA, tema);
    },

    getTheme: function () {
      return document.documentElement.classList.contains(LIGHT_CLASS)
        ? "light" : "dark";
    },

    setAparencia: function (aparencia) {
      aplicarAparencia(aparencia);
      salvarStorage(STORAGE_KEY_APARENCIA, aparencia);
    },
  };

})();
