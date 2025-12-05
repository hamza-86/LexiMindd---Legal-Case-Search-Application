/* PART 1 — Safe DOM selection, utilities & initial boot */
(function () {
  'use strict';

  // Helper: safe query helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const byId = (id) => document.getElementById(id);

  // DOM Elements (use safe selections)
  const form = $('form') || null;
  const textInput = $('textarea[name="text_input"]') || null;
  const submitButton = $('button[type="submit"]') || null;
  const themeToggle = byId('theme-toggle') || null;
  const body = document.body;

  // Drag & Drop Elements (may be absent on some pages)
  const uploadZone = byId('upload-zone') || null;
  const fileInput = byId('file-input') || null;
  const filePreview = byId('file-preview') || null;
  const fileName = byId('file-name') || null;
  const fileSize = byId('file-size') || null;
  const removeFileBtn = byId('remove-file') || null;

  // Modal Elements
  const caseModal = byId('case-modal') || null;
  const modalClose = byId('modal-close') || null;
  const modalCloseBottom = byId('modal-close-bottom') || null;
  const modalCopy = byId('modal-copy') || null;
  const modalCaseTitle = byId('modal-case-title') || null;
  const modalCaseName = byId('modal-case-name') || null;
  const modalSimilarity = byId('modal-similarity') || null;
  const modalRank = byId('modal-rank') || null;
  const modalCaseContent = byId('modal-case-content') || null;

  // Loading Elements
  const loadingOverlay = byId('loading-overlay') || null;
  const loadingSkeletons = byId('loading-skeletons') || null;

  // Filter/Sort Elements
  const resultsControls = byId('results-controls') || null;
  const resultsContainer = byId('results-container') || null;
  const sortSelect = byId('sort-select') || null;
  const filterSelect = byId('filter-select') || null;
  const visibleResultsSpan = byId('visible-results') || null;
  const totalResultsSpan = byId('total-results-2') || null;
  const noResultsDiv = byId('no-results') || null;

  // Sidebar / Chatbot / Reset controls
  const sidebar = byId('right-sidebar') || null;
  const sidebarToggleBtn = byId('sidebar-toggle-btn') || null;
  const chatbotToggleBtn = byId('chatbot-toggle-btn') || null;
  const chatbotPanel = byId('chatbot-panel') || null;
  const chatbotCloseBtn = byId('chatbot-close-btn') || null;
  const forceResetBtn = byId('force-reset-btn') || null; // if you have a button

  // State
  let originalResults = [];
  let currentResults = [];

  // Utility: format bytes
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enable/disable submit button defensively
  const updateButtonState = () => {
    if (!submitButton) return;
    const isTextFilled = textInput && textInput.value.trim() !== '';
    const isFileSelected = fileInput && fileInput.files && fileInput.files.length > 0;
    if (isTextFilled || isFileSelected) {
      submitButton.removeAttribute('disabled');
      submitButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
      submitButton.style.opacity = '';
    } else {
      submitButton.setAttribute('disabled', 'true');
      submitButton.classList.add('bg-gray-400', 'cursor-not-allowed');
      submitButton.style.opacity = '0.6';
    }
  };

  // Expose to outer scope via top-level init function
  window.LexiMind = {
    elements: {
      form, textInput, submitButton, themeToggle, body, uploadZone, fileInput,
      filePreview, fileName, fileSize, removeFileBtn, caseModal, modalClose,
      modalCloseBottom, modalCopy, modalCaseTitle, modalCaseName, modalSimilarity,
      modalRank, modalCaseContent, loadingOverlay, loadingSkeletons,
      resultsControls, resultsContainer, sortSelect, filterSelect,
      visibleResultsSpan, totalResultsSpan, noResultsDiv,
      sidebar, sidebarToggleBtn, chatbotToggleBtn, chatbotPanel, chatbotCloseBtn, forceResetBtn
    },
    utils: { formatFileSize, updateButtonState, $ , $$, byId, formatFileSize }
  };
})();
/* PART 2 — File upload, drag-and-drop, preview logic */
(function () {
  'use strict';
  const { uploadZone, fileInput, filePreview, fileName, fileSize, removeFileBtn } = window.LexiMind.elements;
  const { formatFileSize, updateButtonState } = window.LexiMind.utils;

  // Show/hide preview safely
  function showFilePreview(file) {
    if (!filePreview || !fileName || !fileSize) return;
    fileName.textContent = file.name || 'Selected file';
    fileSize.textContent = formatFileSize(file.size || 0);
    filePreview.classList.add('show');
    if (uploadZone) uploadZone.style.display = 'none';
  }

  function hideFilePreview() {
    if (filePreview) filePreview.classList.remove('show');
    if (uploadZone) uploadZone.style.display = 'block';
    if (fileInput) fileInput.value = '';
    updateButtonState();
  }

  function handleFileSelect(file) {
    if (!file) return;
    if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
      // clear text input if present
      const ti = window.LexiMind.elements.textInput;
      if (ti) ti.value = '';
      showFilePreview(file);
    } else {
      alert('Please select a PDF file only.');
    }
    updateButtonState();
  }

  // Click to open file picker
  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', () => fileInput.click());
  }

  // File input change
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) handleFileSelect(e.target.files[0]);
      updateButtonState();
    });
  }

  // Remove file
  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      hideFilePreview();
      updateButtonState();
    });
  }

  // Drag & drop
  if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove('dragover');
    });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove('dragover');
      const dt = e.dataTransfer;
      if (!dt) return;
      const files = dt.files;
      if (files && files.length > 0) {
        // Use a DataTransfer wrapper to set file input for forms if needed
        try {
          if (fileInput) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(files[0]);
            fileInput.files = dataTransfer.files;
          }
        } catch (err) {
          // some browsers don't allow assignment; still proceed with handling
          console.warn('Could not assign files to file input programmatically', err);
        }
        handleFileSelect(files[0]);
      }
    });
  }
})();
/* PART 3 — Modal functions (show/hide/copy) */
(function () {
  'use strict';
  const { caseModal, modalClose, modalCloseBottom, modalCopy, modalCaseTitle, modalSimilarity, modalRank, modalCaseContent } = window.LexiMind.elements;

  function openCaseModal(caseObj) {
    if (!caseModal || !modalCaseTitle || !modalCaseContent) return;
    const { case: caseTitle = 'Unknown', score = 0, rank = '-', preview = '' } = caseObj || {};
    modalCaseTitle.textContent = caseTitle;
    if (modalSimilarity) modalSimilarity.textContent = `${(parseFloat(score) * 100).toFixed(1)}%`;
    if (modalRank) modalRank.textContent = `#${rank}`;
    modalCaseContent.textContent = preview || '';
    caseModal.classList.remove('hidden');
    caseModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeCaseModal() {
    if (!caseModal) return;
    caseModal.classList.add('hidden');
    caseModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  // Add event listeners defensively
  if (modalClose) modalClose.addEventListener('click', closeCaseModal);
  if (modalCloseBottom) modalCloseBottom.addEventListener('click', closeCaseModal);
  if (caseModal) {
    caseModal.addEventListener('click', (e) => {
      if (e.target === caseModal) closeCaseModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && caseModal && caseModal.classList.contains('show')) closeCaseModal();
  });

  if (modalCopy && modalCaseContent) {
    modalCopy.addEventListener('click', () => {
      const text = modalCaseContent.textContent || '';
      if (!navigator.clipboard) {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (err) { /* ignore */ }
        ta.remove();
      } else {
        navigator.clipboard.writeText(text).catch((err) => console.error('Clipboard error', err));
      }
      // feedback
      const original = modalCopy.innerHTML;
      modalCopy.innerHTML = '✅ Copied!';
      setTimeout(() => { modalCopy.innerHTML = original; }, 1500);
    });
  }

  // Expose open/close for other modules
  window.LexiMind.openCaseModal = openCaseModal;
  window.LexiMind.closeCaseModal = closeCaseModal;
})();
/* PART 4 — Results: init, sort, filter, view & copy handlers */
(function () {
  'use strict';
  const {
    resultsContainer, resultsControls, sortSelect, filterSelect,
    visibleResultsSpan, totalResultsSpan, noResultsDiv
  } = window.LexiMind.elements;

  // internal arrays
  let originalResults = [];
  let currentResults = [];

  function initializeSimilarityBars(root = document) {
    const fills = Array.from(root.querySelectorAll('.similarity-fill'));
    fills.forEach(fill => {
      const score = parseFloat(fill.dataset.score) || 0;
      fill.style.width = Math.round(score * 100) + '%';
    });
  }

  function initializeResults() {
    const resultCards = Array.from(document.querySelectorAll('.result-card'));
    originalResults = resultCards.map((card, index) => {
      const titleEl = card.querySelector('h4') || { textContent: '' };
      const fillEl = card.querySelector('.similarity-fill') || { dataset: { score: 0 } };
      return {
        element: card,
        case: (titleEl.textContent || '').trim(),
        score: parseFloat(fillEl.dataset.score || 0),
        rank: index + 1
      };
    });
    currentResults = [...originalResults];
    // show controls if any
    if (resultsControls) resultsControls.classList.remove('hidden');
    updateResultsDisplay();
  }

  function sortResults(type) {
    currentResults.sort((a, b) => {
      if (type === 'similarity-desc') return b.score - a.score;
      if (type === 'similarity-asc') return a.score - b.score;
      if (type === 'name-asc') return a.case.localeCompare(b.case);
      if (type === 'name-desc') return b.case.localeCompare(a.case);
      return 0;
    });
  }

  function filterResults(minScore) {
    return originalResults.filter(r => r.score >= (minScore || 0));
  }

  function updateResultsDisplay() {
    if (!resultsContainer) return;
    // clear previous
    resultsContainer.innerHTML = '';
    noResultsDiv && noResultsDiv.classList.add('hidden');

    if (!currentResults || currentResults.length === 0) {
      if (noResultsDiv) noResultsDiv.classList.remove('hidden');
    } else {
      currentResults.forEach((r, idx) => {
        // clone the original element to preserve structure
        const card = r.element.cloneNode(true);
        const rankBadge = card.querySelector('.rank-badge');
        if (rankBadge) rankBadge.textContent = `#${idx + 1}`;
        // attach small event handler for view-details buttons inside the card
        const viewBtn = card.querySelector('.view-details, .view-details-btn');
        if (viewBtn) {
          viewBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            const caseData = {
              case: viewBtn.dataset.case || r.case,
              score: viewBtn.dataset.score || r.score,
              rank: idx + 1,
              preview: viewBtn.dataset.preview || (r.element.querySelector('.case-preview-text')?.textContent || '')
            };
            window.LexiMind.openCaseModal(caseData);
          });
        }
        // copy-text buttons inside card
        const copyBtn = card.querySelector('.copy-text');
        if (copyBtn) {
          copyBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            const txt = copyBtn.dataset.preview || copyBtn.closest('.result-card')?.querySelector('.case-preview-text')?.textContent || '';
            if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(()=>{});
            const orig = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            setTimeout(()=> copyBtn.textContent = orig, 1400);
          });
        }

        resultsContainer.appendChild(card);
      });
    }

    if (visibleResultsSpan) visibleResultsSpan.textContent = currentResults.length;
    if (totalResultsSpan) totalResultsSpan.textContent = originalResults.length;
    initializeSimilarityBars(resultsContainer);
  }

  // Expose handlers used elsewhere
  window.LexiMind.initializeResults = initializeResults;
  window.LexiMind.sortResults = sortResults;
  window.LexiMind.filterResults = filterResults;
  window.LexiMind.updateResultsDisplay = updateResultsDisplay;

  // wire select controls if present
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortResults(sortSelect.value);
      updateResultsDisplay();
    });
  }
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      const minScore = parseFloat(filterSelect.value) || 0;
      currentResults = filterResults(minScore);
      sortResults(sortSelect ? sortSelect.value : '');
      updateResultsDisplay();
    });
  }

  // initial attempt to initialize if cards exist
  setTimeout(() => {
    if (document.querySelector('.result-card')) initializeResults();
  }, 120);
})();
/* PART 5 — Sidebar/chatbot toggles, form submit, reset, final init */
(function () {
  'use strict';
  const {
    form, textInput, submitButton, themeToggle, body,
    sidebar, sidebarToggleBtn, chatbotToggleBtn, chatbotPanel, chatbotCloseBtn,
    loadingOverlay, loadingSkeletons
  } = window.LexiMind.elements;

  // Sidebar toggle
  let sidebarOpen = false;
  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener('click', () => {
      sidebarOpen = !sidebarOpen;
      sidebar.style.transform = sidebarOpen ? 'translateX(0)' : 'translateX(110%)';
      sidebar.style.opacity = sidebarOpen ? '1' : '0';
      // Adjust main container margin if needed
      const mainContainer = document.querySelector('div[style*="max-width: 1200px"], .main-container');
      if (mainContainer) mainContainer.style.marginRight = sidebarOpen ? '320px' : '160px';
      sidebarToggleBtn.style.transform = sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  }

  // Chatbot panel toggle
  let chatbotOpen = false;
  if (chatbotToggleBtn && chatbotPanel) {
    chatbotToggleBtn.addEventListener('click', () => {
      chatbotOpen = !chatbotOpen;
      chatbotPanel.style.transform = chatbotOpen ? 'translateX(0)' : 'translateX(100%)';
      chatbotToggleBtn.style.display = chatbotOpen ? 'none' : 'flex';
      const mainContainer = document.querySelector('div[style*="max-width: 1200px"], .main-container');
      if (mainContainer) mainContainer.style.marginRight = chatbotOpen ? '320px' : '160px';
    });
  }

  if (chatbotCloseBtn && chatbotPanel) {
    chatbotCloseBtn.addEventListener('click', () => {
      chatbotPanel.style.transform = 'translateX(100%)';
      if (chatbotToggleBtn) chatbotToggleBtn.style.display = 'flex';
      const mainContainer = document.querySelector('div[style*="max-width: 1200px"], .main-container');
      if (mainContainer) mainContainer.style.marginRight = '160px';
      chatbotOpen = false;
    });
  }

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      body.classList.toggle('dark-mode');
      const isDark = body.classList.contains('dark-mode');
      try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
      themeToggle.textContent = isDark ? '☀️' : '🌙';
    });
  }

  // Show/hide loading helpers
  function showLoadingState() {
    if (loadingOverlay) { loadingOverlay.classList.remove('hidden'); loadingOverlay.classList.add('flex'); }
    if (loadingSkeletons) loadingSkeletons.classList.remove('hidden');
    const hand = document.getElementById('hand-loading');
    if (hand) hand.classList.add('show');
    if (submitButton) {
      submitButton.innerHTML = '<span class="loading-spinner"></span> Analyzing...';
      submitButton.setAttribute('disabled', 'true');
      submitButton.classList.add('opacity-75', 'cursor-wait');
    }
  }

  function hideLoadingState() {
    if (loadingOverlay) { loadingOverlay.classList.add('hidden'); loadingOverlay.classList.remove('flex'); }
    if (loadingSkeletons) loadingSkeletons.classList.add('hidden');
    const hand = document.getElementById('hand-loading');
    if (hand) hand.classList.remove('show');
    if (submitButton) {
      submitButton.innerHTML = 'Analyze';
      submitButton.removeAttribute('disabled');
      submitButton.classList.remove('opacity-75', 'cursor-wait');
    }
  }

  // Safe form submit — keep server POST, but avoid replacing full document on success
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // ensure something present
      const text = textInput ? textInput.value.trim() : '';
      const hasFile = (window.LexiMind.elements.fileInput && window.LexiMind.elements.fileInput.files.length > 0);
      if (!text && !hasFile) return alert('Please provide text or upload a PDF.');

      showLoadingState();
      const formData = new FormData(form);
      try {
        const resp = await fetch(form.action || '/', { method: form.method || 'POST', body: formData });
        if (!resp.ok) throw new Error('Server error');
        // Prefer partial update: if server returns HTML snippet for results, inject it into resultsContainer
        const textResp = await resp.text();
        // Try to find a marker in response and replace resultsContainer if present
        if (resultsContainer && textResp.includes('id="results-container"')) {
          // parse and extract
          const parser = new DOMParser();
          const doc = parser.parseFromString(textResp, 'text/html');
          const newResults = doc.getElementById('results-container');
          if (newResults) {
            resultsContainer.innerHTML = newResults.innerHTML;
            // re-initialize dynamic parts
            window.LexiMind.initializeResults && window.LexiMind.initializeResults();
            hideLoadingState();
            return;
          }
        }
        // fallback: reload the page (preserves server state)
        window.location.reload();
      } catch (err) {
        console.error(err);
        hideLoadingState();
        alert('An error occurred while processing your request. Try again.');
      }
    });
  }

  // Force reset button (if present) — clears results, chat, file input and reloads minimally
  const forcePageReset = () => {
    try {
      // hide results
      const cat = document.getElementById('category-result');
      const search = document.getElementById('search-results');
      if (cat) { cat.style.display = 'none'; cat.innerHTML = ''; }
      if (search) { search.style.display = 'none'; search.innerHTML = ''; }

      // reset form
      if (form) form.reset();
      // hide file preview
      const fp = document.getElementById('file-preview');
      if (fp) fp.classList.remove('show');
      if (fileInput) fileInput.value = '';

      // clear chat
      const chatbotBody = document.getElementById('chat-body') || document.getElementById('chat-messages');
      if (chatbotBody) {
        chatbotBody.innerHTML = `<div style="background: linear-gradient(135deg,#8B5CF6,#3B82F6); color:#fff; padding:10px 14px; border-radius:12px; margin-bottom:8px;">Hi! I’m your LexiMind Assistant. Ask me anything about your document.</div>`;
      }

      // reset UI states
      hideLoadingState();
      updateButtonState();

      // Soft reload to ensure server and client synced
      window.location.href = window.location.pathname + '?reset=' + Date.now();
    } catch (err) {
      console.error('Force reset failed', err);
      window.location.reload();
    }
  };

  if (window.LexiMind.elements.forceResetBtn) {
    window.LexiMind.elements.forceResetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      forcePageReset();
    });
  }

  // Final init: load theme, wire some remaining handlers
  function loadTheme() {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') body.classList.add('dark-mode');
      else body.classList.remove('dark-mode');
      if (themeToggle) themeToggle.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
    } catch (err) {}
  }

  // Wire some global click delegation for case-title and view-details (works even for dynamic content)
  document.addEventListener('click', (ev) => {
    // case-title click
    const title = ev.target.closest('.case-title');
    if (title) {
      const ds = title.dataset || {};
      window.LexiMind.openCaseModal && window.LexiMind.openCaseModal({
        case: ds.case || title.textContent,
        score: ds.score || 0,
        rank: ds.rank || '-',
        preview: ds.content || ''
      });
      return;
    }
    // view-details elements
    const viewBtn = ev.target.closest('.view-details, .view-details-btn');
    if (viewBtn) {
      const ds = viewBtn.dataset || {};
      window.LexiMind.openCaseModal && window.LexiMind.openCaseModal({
        case: ds.case || '',
        score: ds.score || 0,
        rank: ds.rank || '-',
        preview: ds.preview || ''
      });
      return;
    }
  });

  // run final initializers
  loadTheme();
  window.LexiMind.utils.updateButtonState && window.LexiMind.utils.updateButtonState();
  window.LexiMind.initializeResults && window.LexiMind.initializeResults();
  window.LexiMind.utils.initializeSimilarityBars && window.LexiMind.utils.initializeSimilarityBars();

})();
