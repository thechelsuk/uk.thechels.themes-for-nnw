(function () {
    function extractUrlsFromText(text) {
        // Regex for https:// links
        const urlRegex = /https:\/\/[^\s<>"']+/g;
        return text.match(urlRegex) || [];
    }

    function getTLD(url) {
        try {
            const { hostname } = new URL(url);
            return hostname; // Use full hostname, including subdomain if present
        } catch {
            return url;
        }
    }

    function collectAllUrls() {
        const bodyContainer = document.getElementById("bodyContainer");
        if (!bodyContainer) return [];

        // 1. Anchor tags
        const anchors = Array.from(
            bodyContainer.querySelectorAll("a[href^='https://']"),
        );
        const anchorUrls = anchors.map((a) => a.href);

        // 2. Plain text URLs
        // Get all text nodes
        const walker = document.createTreeWalker(
            bodyContainer,
            NodeFilter.SHOW_TEXT,
            null,
            false,
        );
        let node,
            textUrls = [];
        while ((node = walker.nextNode())) {
            textUrls.push(...extractUrlsFromText(node.textContent));
        }

        // Combine and deduplicate
        return Array.from(new Set([...anchorUrls, ...textUrls]));
    }

    function addLinksToFooter(urls) {
        if (!urls.length) return;
        const footer = document.getElementById("footer");
        if (!footer) return;

        // Remove old list and header if present
        const oldList = footer.querySelector(".extracted-links");
        if (oldList) oldList.remove();
        const oldHeader = footer.querySelector(".extracted-links-header");
        if (oldHeader) oldHeader.remove();

        const header = document.createElement("h3");
        header.className = "extracted-links-header";
        header.textContent = "Found Links:";
        const ul = document.createElement("ul");
        ul.className = "extracted-links";
        urls.forEach((url) => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = url;
            a.textContent = getTLD(url);
            a.target = "_blank";
            li.appendChild(a);
            ul.appendChild(li);
        });
        footer.appendChild(header);
        footer.appendChild(ul);
    }

    function processLinks() {
        const urls = collectAllUrls();
        addLinksToFooter(urls);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", processLinks);
    } else {
        processLinks();
    }
})();
