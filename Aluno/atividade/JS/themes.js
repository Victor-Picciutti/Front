document.addEventListener("DOMContentLoaded", () => {

    // === Ler tema salvo ===
    const savedTheme = localStorage.getItem("tema");
    if (savedTheme === "light") {
        document.documentElement.classList.add("light");
    }

    // === Ler aparência salva ===
    const savedAparencia = localStorage.getItem("aparencia");
    if (savedAparencia) {
        document.documentElement.classList.add(savedAparencia);
    }
});
