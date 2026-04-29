// This script rewrites YouTube links as described
(function() {
  function rewriteYouTubeLinks() {
    const anchors = document.querySelectorAll('a[href^="https://youtube.com/"]');
    anchors.forEach(anchor => {
      const url = anchor.getAttribute('href');
      // Extract the path and query after 'https://youtube.com/'
      const rest = url.substring('https://youtube.com/'.length);
      anchor.setAttribute('href', `x://?videoURL=https://youtu.be/${rest}`);
    });
  }
  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rewriteYouTubeLinks);
  } else {
    rewriteYouTubeLinks();
  }
})();
