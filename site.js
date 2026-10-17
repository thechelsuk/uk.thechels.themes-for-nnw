const themeNames = new Set(["Claudio", "Fresh", "Guro", "Magda", "Retro", "Thechelsuk"]);

if (document.documentElement.hasAttribute("data-theme-preview")) {
    const theme = new URLSearchParams(window.location.search).get("theme");

    if (themeNames.has(theme)) {
        document.title = `${theme} preview — NetNewsWire Themes`;

        async function loadTheme() {
            const stylesheetUrl = new URL(`${theme}.nnwtheme/stylesheet.css`, document.baseURI);
            const response = await fetch(stylesheetUrl);

            if (!response.ok) {
                throw new Error(`Theme stylesheet request failed with status ${response.status}`);
            }

            const stylesheetText = await response.text();
            const imports = [...stylesheetText.matchAll(/^\s*@import\s+url\((['"]?)(.*?)\1\);/gm)];

            for (const rule of imports) {
                const fontStylesheet = document.createElement("link");
                fontStylesheet.rel = "stylesheet";
                fontStylesheet.href = new URL(rule[2], stylesheetUrl).href;
                document.head.append(fontStylesheet);
            }

            const style = document.createElement("style");
            style.textContent = stylesheetText
                .replace(/^\s*@import\s+url\((['"]?)(.*?)\1\);\s*/gm, "")
                .replace(/url\((['"]?)(.*?)\1\)/g, (match, quote, resource) => {
                    if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(resource)) {
                        return match;
                    }

                    return `url("${new URL(resource, stylesheetUrl).href}")`;
                });
            document.head.append(style);
        }

        loadTheme().catch((error) => {
            document.body.textContent = "Couldn't load this preview's theme stylesheet.";
            console.error(error);
        });
    } else {
        document.body.textContent = "This theme preview is unavailable.";
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
