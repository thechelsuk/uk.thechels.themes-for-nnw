(function () {
    const PROCESSED_ATTRIBUTE = "data-nnw-ref-processed";
    const CITATION_CLASS = "nnw-ref-citation";
    const MAX_PATH_LENGTH = 50;

    // Common tracking parameters to strip from display
    const TRACKING_PARAMS = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "ref",
        "source",
        "fbclid",
        "gclid",
        "msclkid",
        "mc_cid",
        "mc_eid",
    ];

    /**
     * Extract URLs from text supporting multiple schemes
     * Matches: https://, http://, x://, app://, and other custom schemes
     */
    function extractUrlsFromText(text) {
        const urlRegex = /(?:https?|x|app|[a-z][\w-]*):\/\/[^\s<>"']+/gi;
        return text.match(urlRegex) || [];
    }

    /**
     * Remove tracking parameters from URL for display purposes
     */
    function cleanUrlForDisplay(urlString) {
        try {
            const url = new URL(urlString);
            TRACKING_PARAMS.forEach((param) => {
                url.searchParams.delete(param);
            });
            return url.toString();
        } catch {
            return urlString;
        }
    }

    /**
     * Format URL for display as hostname/path
     * Strips tracking params and truncates long paths
     */
    function formatUrlDisplay(urlString) {
        try {
            const cleanedUrl = cleanUrlForDisplay(urlString);
            const url = new URL(cleanedUrl);

            let display = url.hostname;

            // Add path and search if present
            if (url.pathname && url.pathname !== "/") {
                display += url.pathname;
            }
            if (url.search) {
                display += url.search;
            }
            if (url.hash) {
                display += url.hash;
            }

            // Truncate if too long
            const hostnameLength = url.hostname.length;
            const pathPart = display.substring(hostnameLength);

            if (pathPart.length > MAX_PATH_LENGTH) {
                display =
                    url.hostname +
                    pathPart.substring(0, MAX_PATH_LENGTH) +
                    "...";
            }

            return display;
        } catch {
            // For non-standard URLs (custom schemes), return as-is with basic truncation
            if (urlString.length > MAX_PATH_LENGTH + 20) {
                return urlString.substring(0, MAX_PATH_LENGTH + 20) + "...";
            }
            return urlString;
        }
    }

    /**
     * Normalize URL for deduplication
     * Uses original URL without tracking params
     */
    function normalizeUrl(urlString) {
        return cleanUrlForDisplay(urlString);
    }

    /**
     * Check if an element is within excluded containers
     */
    function isInExcludedContainer(element) {
        // Walk up the DOM tree to check for excluded containers
        let current = element;
        while (current) {
            // Exclude elements in footer, meta sections, or article title
            if (
                current.id === "footer" ||
                current.classList?.contains("footer") ||
                current.classList?.contains("meta") ||
                current.classList?.contains("articleTitle") ||
                current.classList?.contains("post-title") ||
                current.classList?.contains("blog-bar") ||
                current.classList?.contains("nnw-youtube-actions")
            ) {
                return true;
            }
            // Stop if we've reached bodyContainer (we're inside it, which is good)
            if (current.id === "bodyContainer") {
                return false;
            }
            current = current.parentElement;
        }
        return true; // If we didn't find bodyContainer, exclude it
    }

    /**
     * Build reference map from all URLs found in the document
     * Returns: { urlToRef: Map, refToUrl: Map, orderedUrls: Array }
     */
    function buildReferenceMap() {
        const bodyContainer = document.getElementById("bodyContainer");
        if (!bodyContainer) {
            return {
                urlToRef: new Map(),
                refToUrl: new Map(),
                orderedUrls: [],
            };
        }

        const urlToRef = new Map();
        const refToUrl = new Map();
        const orderedUrls = [];
        let refNumber = 1;

        // Helper to add URL to maps
        function addUrl(url) {
            const normalized = normalizeUrl(url);
            if (!urlToRef.has(normalized)) {
                urlToRef.set(normalized, refNumber);
                refToUrl.set(refNumber, url); // Store original URL
                orderedUrls.push(url);
                refNumber++;
            }
            return urlToRef.get(normalized);
        }

        // 1. Collect URLs from anchor tags first (document order)
        const anchors = Array.from(bodyContainer.querySelectorAll("a[href]"));
        anchors.forEach((anchor) => {
            // Skip if in excluded container
            if (isInExcludedContainer(anchor)) {
                return;
            }

            const href = anchor.getAttribute("href");
            if (href && /^(?:https?|x|app|[a-z][\w-]*):\/\//i.test(href)) {
                addUrl(href);
            }
        });

        // 2. Collect URLs from plain text
        const walker = document.createTreeWalker(
            bodyContainer,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    if (node.parentElement && node.parentElement.closest("a")) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Skip if in excluded container
                    if (isInExcludedContainer(node.parentElement)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                },
            },
            false,
        );

        let node;
        while ((node = walker.nextNode())) {
            const urls = extractUrlsFromText(node.textContent);
            urls.forEach((url) => addUrl(url));
        }

        return { urlToRef, refToUrl, orderedUrls };
    }

    /**
     * Insert citation superscript after an element
     */
    function insertCitation(element, refNumber) {
        // Check if citation already exists
        const nextSibling = element.nextSibling;
        if (
            nextSibling &&
            nextSibling.nodeType === Node.ELEMENT_NODE &&
            nextSibling.classList &&
            nextSibling.classList.contains(CITATION_CLASS)
        ) {
            return; // Already has citation
        }

        const sup = document.createElement("sup");
        sup.className = CITATION_CLASS;
        sup.textContent = `[${refNumber}]`;

        // Insert after the element
        element.parentNode.insertBefore(sup, element.nextSibling);
    }

    /**
     * Process anchor tags to add citation numbers
     */
    function processAnchorTags(urlToRef) {
        const bodyContainer = document.getElementById("bodyContainer");
        if (!bodyContainer) return;

        const anchors = Array.from(bodyContainer.querySelectorAll("a[href]"));

        anchors.forEach((anchor) => {
            if (anchor.hasAttribute(PROCESSED_ATTRIBUTE)) {
                return;
            }

            // Skip if in excluded container
            if (isInExcludedContainer(anchor)) {
                return;
            }

            const href = anchor.getAttribute("href");
            if (!href || !/^(?:https?|x|app|[a-z][\w-]*):\/\//i.test(href)) {
                return;
            }

            const normalized = normalizeUrl(href);
            const refNumber = urlToRef.get(normalized);

            if (refNumber) {
                insertCitation(anchor, refNumber);
                anchor.setAttribute(PROCESSED_ATTRIBUTE, "true");
            }
        });
    }

    /**
     * Convert plain text URLs to links with citations
     */
    function linkifyTextUrls(urlToRef) {
        const bodyContainer = document.getElementById("bodyContainer");
        if (!bodyContainer) return;

        const walker = document.createTreeWalker(
            bodyContainer,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    // Skip if nested anywhere inside an anchor (not just a direct child) or already processed
                    if (node.parentElement) {
                        if (node.parentElement.closest("a")) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (
                            node.parentElement.hasAttribute(PROCESSED_ATTRIBUTE)
                        ) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        // Skip if in excluded container
                        if (isInExcludedContainer(node.parentElement)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                    }
                    return NodeFilter.FILTER_ACCEPT;
                },
            },
            false,
        );

        const nodesToProcess = [];
        let node;
        while ((node = walker.nextNode())) {
            const urls = extractUrlsFromText(node.textContent);
            if (urls.length > 0) {
                nodesToProcess.push(node);
            }
        }

        // Process nodes (doing this separately to avoid iterator issues)
        nodesToProcess.forEach((textNode) => {
            const text = textNode.textContent;
            const urls = extractUrlsFromText(text);

            if (urls.length === 0) return;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            // Find all URL matches with their positions
            const urlRegex = /(?:https?|x|app|[a-z][\w-]*):\/\/[^\s<>"']+/gi;
            let match;

            while ((match = urlRegex.exec(text)) !== null) {
                const url = match[0];
                const startIndex = match.index;

                // Add text before URL
                if (startIndex > lastIndex) {
                    fragment.appendChild(
                        document.createTextNode(
                            text.substring(lastIndex, startIndex),
                        ),
                    );
                }

                // Create link
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.textContent = url;
                anchor.target = "_blank";
                anchor.setAttribute(PROCESSED_ATTRIBUTE, "true");
                fragment.appendChild(anchor);

                // Add citation
                const normalized = normalizeUrl(url);
                const refNumber = urlToRef.get(normalized);
                if (refNumber) {
                    const sup = document.createElement("sup");
                    sup.className = CITATION_CLASS;
                    sup.textContent = `[${refNumber}]`;
                    fragment.appendChild(sup);
                }

                lastIndex = startIndex + url.length;
            }

            // Add remaining text
            if (lastIndex < text.length) {
                fragment.appendChild(
                    document.createTextNode(text.substring(lastIndex)),
                );
            }

            // Replace text node with fragment
            textNode.parentNode.replaceChild(fragment, textNode);
        });
    }

    /**
     * Render numbered reference list in footer
     */
    function renderReferenceList(orderedUrls) {
        const footer = document.getElementById("footer");
        if (!footer) return;

        // Remove old list and header if present
        const oldList = footer.querySelector(".extracted-links");
        if (oldList) oldList.remove();
        const oldHeader = footer.querySelector(".extracted-links-header");
        if (oldHeader) oldHeader.remove();

        if (orderedUrls.length === 0) return;

        const header = document.createElement("h3");
        header.className = "extracted-links-header";
        header.textContent = "References:";

        const ol = document.createElement("ol");
        ol.className = "extracted-links";

        orderedUrls.forEach((url, index) => {
            const li = document.createElement("li");
            li.value = index + 1; // Ensure proper numbering

            const a = document.createElement("a");
            a.href = url;
            a.textContent = formatUrlDisplay(url);
            a.target = "_blank";

            li.appendChild(a);
            ol.appendChild(li);
        });

        footer.appendChild(header);
        footer.appendChild(ol);
    }

    /**
     * Main processing function
     */
    function processLinks() {
        // Build reference map from all URLs
        const { urlToRef, refToUrl, orderedUrls } = buildReferenceMap();

        if (orderedUrls.length === 0) return;

        // Add citations to existing anchor tags
        processAnchorTags(urlToRef);

        // Convert plain text URLs to links with citations
        linkifyTextUrls(urlToRef);

        // Render the numbered reference list
        renderReferenceList(orderedUrls);
    }

    // Run when document is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", processLinks);
    } else {
        processLinks();
    }
})();
