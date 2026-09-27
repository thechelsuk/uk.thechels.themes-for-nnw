// Augment YouTube article links with an inline embed and an app deep link.
(function () {
    const APP_LINK_LABEL = "Open in extension.app";
    const APP_URL_PREFIX = "https://vid.thechels.uk/?v=";
    // YouTube rejects embeds without a referrer (Error 153), and NNW sends none,
    // so embed via a hosted wrapper page that supplies one.
    const EMBED_URL_PREFIX = "https://embed.thechels.uk/?v=";
    const EMBED_READY_MESSAGE = "thechels-embed-ready";
    const EMBED_TIMEOUT_MS = 10000;
    const PROCESSED_ATTRIBUTE = "data-youtube-enhanced";

    function isYouTubeHostname(hostname) {
        return hostname === "youtube.com" || hostname === "www.youtube.com";
    }

    function isValidVideoId(videoId) {
        return /^[A-Za-z0-9_-]{11}$/.test(videoId);
    }

    function getVideoInfo(urlString) {
        let url;

        try {
            url = new URL(urlString);
        } catch {
            return null;
        }

        if (!isYouTubeHostname(url.hostname)) {
            return null;
        }

        if (url.pathname === "/watch") {
            const videoId = url.searchParams.get("v");

            if (!isValidVideoId(videoId || "")) {
                return null;
            }

            return {
                videoId,
                canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
            };
        }

        if (url.pathname.startsWith("/shorts/")) {
            const pathParts = url.pathname.split("/").filter(Boolean);
            const videoId = pathParts[1] || "";

            if (!isValidVideoId(videoId)) {
                return null;
            }

            return {
                videoId,
                canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
            };
        }

        return null;
    }

    function getInsertionTarget(anchor) {
        return anchor.closest("p, figure, div, li, blockquote") || anchor;
    }

    function createThumbnailLink(videoInfo, title) {
        const link = document.createElement("a");
        link.className = "nnw-youtube-fallback";
        link.href = videoInfo.canonicalUrl;
        link.title = title;
        link.style.display = "block";

        const image = document.createElement("img");
        image.src = `https://i.ytimg.com/vi/${videoInfo.videoId}/hqdefault.jpg`;
        image.alt = title;
        image.style.display = "block";
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.objectFit = "cover";

        link.appendChild(image);
        return link;
    }

    // If the wrapper page never reports in, swap the iframe for a thumbnail link.
    function watchForEmbedFailure(iframe, videoInfo) {
        let ready = false;

        window.addEventListener("message", (event) => {
            if (
                event.source === iframe.contentWindow &&
                event.data?.type === EMBED_READY_MESSAGE
            ) {
                ready = true;
            }
        });

        function startTimer() {
            setTimeout(() => {
                if (!ready && iframe.isConnected) {
                    iframe.replaceWith(createThumbnailLink(videoInfo, iframe.title));
                }
            }, EMBED_TIMEOUT_MS);
        }

        // The iframe is lazy-loaded, so only start timing once it is on screen.
        if (!("IntersectionObserver" in window)) {
            startTimer();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect();
                startTimer();
            }
        });
        observer.observe(iframe);
    }

    function createEmbedBlock(videoInfo, anchorText) {
        const wrapper = document.createElement("div");
        wrapper.className = "nnw-youtube-embed";

        const frame = document.createElement("div");
        frame.className = "nnw-youtube-frame";

        const iframe = document.createElement("iframe");
        iframe.className = "nnw-youtube-iframe";
        iframe.src = `${EMBED_URL_PREFIX}${encodeURIComponent(videoInfo.videoId)}`;
        iframe.title = anchorText || "Embedded YouTube video";
        iframe.loading = "lazy";
        iframe.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allowFullscreen = true;

        frame.appendChild(iframe);
        watchForEmbedFailure(iframe, videoInfo);

        const actions = document.createElement("div");
        actions.className = "nnw-youtube-actions";

        const appLink = document.createElement("a");
        appLink.className = "nnw-youtube-app-link";
        appLink.href = `${APP_URL_PREFIX}${encodeURIComponent(videoInfo.canonicalUrl)}`;
        appLink.textContent = APP_LINK_LABEL;
        actions.appendChild(appLink);

        wrapper.appendChild(frame);
        wrapper.appendChild(actions);

        return wrapper;
    }

    function getBodyVideoAnchors() {
        const bodyContainer = document.querySelector("#bodyContainer");

        if (!bodyContainer) {
            return [];
        }

        return Array.from(bodyContainer.querySelectorAll("a[href]")).filter(
            (anchor) => getVideoInfo(anchor.getAttribute("href") || ""),
        );
    }

    function getTitleVideoAnchor() {
        const titleAnchor = document.querySelector(".articleTitle a[href]");

        if (!titleAnchor) {
            return null;
        }

        return getVideoInfo(titleAnchor.getAttribute("href") || "")
            ? titleAnchor
            : null;
    }

    function getCandidateAnchors() {
        const bodyVideoAnchors = getBodyVideoAnchors();

        if (bodyVideoAnchors.length > 0) {
            return bodyVideoAnchors;
        }

        const titleVideoAnchor = getTitleVideoAnchor();

        return titleVideoAnchor ? [titleVideoAnchor] : [];
    }

    function rewriteYouTubeLinks() {
        const anchors = getCandidateAnchors();

        anchors.forEach((anchor) => {
            if (anchor.hasAttribute(PROCESSED_ATTRIBUTE)) {
                return;
            }

            const href = anchor.getAttribute("href");
            const videoInfo = getVideoInfo(href || "");

            if (!videoInfo) {
                return;
            }

            const insertionTarget = getInsertionTarget(anchor);

            if (
                !insertionTarget ||
                insertionTarget.nextElementSibling?.classList.contains(
                    "nnw-youtube-embed",
                )
            ) {
                anchor.setAttribute(PROCESSED_ATTRIBUTE, "true");
                return;
            }

            const embedBlock = createEmbedBlock(
                videoInfo,
                anchor.textContent.trim(),
            );
            insertionTarget.insertAdjacentElement("afterend", embedBlock);
            anchor.setAttribute(PROCESSED_ATTRIBUTE, "true");
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", rewriteYouTubeLinks);
    } else {
        rewriteYouTubeLinks();
    }
})();
