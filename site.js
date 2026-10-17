if (document.documentElement.hasAttribute("data-preview-redirect")) {
    const theme = new URLSearchParams(window.location.search).get("theme");
    const previews = {
        Claudio: "claudio.html",
        Franco: "franco.html",
        Fresh: "fresh.html",
        Guro: "guro.html",
        Magda: "magda.html",
        Retro: "retro.html",
        Thechelsuk: "thechelsuk.html",
    };
    const preview = previews[theme];

    if (preview) {
        window.location.replace(`test/${preview}`);
    } else {
        document.body.textContent = "This theme preview is unavailable. Return to the theme collection.";
    }
}

const filters = document.querySelector(".filters");

if (filters) {
    const buttons = [...filters.querySelectorAll("[data-filter]")];
    const cards = [...document.querySelectorAll(".theme-card")];
    const count = document.querySelector("#visible-count");

    filters.addEventListener("click", (event) => {
        const button = event.target.closest("[data-filter]");

        if (!button) {
            return;
        }

        const filter = button.dataset.filter;
        let visibleCount = 0;

        for (const card of cards) {
            const isVisible = filter === "all" || card.dataset.category === filter;
            card.hidden = !isVisible;
            visibleCount += Number(isVisible);
        }

        for (const filterButton of buttons) {
            const isActive = filterButton === button;
            filterButton.classList.toggle("is-active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
        }

        count.textContent = String(visibleCount).padStart(2, "0");
    });
}
