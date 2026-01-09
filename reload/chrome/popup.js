document.getElementById('reloadBtn').addEventListener('click', () => {
  chrome.tabs.reload(); // Reloads current tab
  window.close(); // Close the popup immediately
});
