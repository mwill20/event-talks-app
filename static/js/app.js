// STATE MANAGEMENT
let feedEntries = [];      // Raw feed entries list
let parsedItems = [];      // Flattened list of individual sub-updates (specific updates)
let selectedItem = null;   // Active selected sub-update item
let activeFilter = 'all';  // Category filter
let searchQuery = '';      // Search keyword filter
let isEditing = false;     // Edit state of the mock post textarea

// DOM ELEMENT SELECTORS
const DOM = {
    // Header
    btnRefresh: document.getElementById('btn-refresh'),
    btnSettings: document.getElementById('btn-settings'),
    btnTheme: document.getElementById('btn-theme'),
    syncText: document.getElementById('sync-text'),
    syncDot: document.querySelector('.sync-status .status-dot'),
    
    // Left Panel
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    filterPills: document.getElementById('filter-pills'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    feedContainer: document.getElementById('feed-container'),
    
    // Right Panel States
    emptyState: document.getElementById('empty-state'),
    workspaceState: document.getElementById('workspace-state'),
    
    // Selected Update Detail
    selectedTypeBadge: document.getElementById('selected-type-badge'),
    selectedDate: document.getElementById('selected-date'),
    selectedHtml: document.getElementById('selected-html'),
    selectedDocLink: document.getElementById('selected-doc-link'),
    
    // Generator Config
    toneGrid: document.querySelector('.tone-grid'),
    toggleEmojis: document.getElementById('toggle-emojis'),
    toggleHashtags: document.getElementById('toggle-hashtags'),
    toggleLink: document.getElementById('toggle-link'),
    customLinkContainer: document.getElementById('custom-link-container'),
    customLink: document.getElementById('custom-link'),
    btnGenerate: document.getElementById('btn-generate'),
    
    // LinkedIn Card Preview
    authorAvatarContainer: document.getElementById('author-avatar-container'),
    userDisplayName: document.getElementById('user-display-name'),
    userDisplayTitle: document.getElementById('user-display-title'),
    postDraftArea: document.getElementById('post-draft-area'),
    charCounter: document.getElementById('char-counter'),
    aiGenerationIndicator: document.getElementById('ai-generation-indicator'),
    btnEditPost: document.getElementById('btn-edit-post'),
    editBtnText: document.getElementById('edit-btn-text'),
    btnCopyPost: document.getElementById('btn-copy-post'),
    
    // Settings Modal
    settingsModal: document.getElementById('settings-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    geminiKeyInput: document.getElementById('gemini-key'),
    btnToggleKeyVisibility: document.getElementById('btn-toggle-key-visibility'),
    profileNameInput: document.getElementById('profile-name'),
    profileTitleInput: document.getElementById('profile-title'),
    profileAvatarInput: document.getElementById('profile-avatar'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnClearSettings: document.getElementById('btn-clear-settings'),
    
    // Toast
    toastContainer: document.getElementById('toast-container')
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadTheme();
    bindEvents();
    fetchFeed(false);
});

// THEME MANAGEMENT
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    const newTheme = isLight ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    showToast('info', `Switched to ${newTheme} theme.`);
}

function updateThemeIcon(theme) {
    if (theme === 'light') {
        DOM.btnTheme.innerHTML = `
            <svg class="icon-theme" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
        `;
    } else {
        DOM.btnTheme.innerHTML = `
            <svg class="icon-theme" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path class="sun-path" d="M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0 M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42" />
            </svg>
        `;
    }
}

// LOAD & SAVE SETTINGS FROM LOCALSTORAGE
function loadSettings() {
    const key = localStorage.getItem('gemini_api_key') || '';
    const name = localStorage.getItem('linkedin_name') || 'Google Cloud Architect';
    const title = localStorage.getItem('linkedin_title') || 'Data Platform & Analytics Expert';
    const avatar = localStorage.getItem('linkedin_avatar') || '';
    
    DOM.geminiKeyInput.value = key;
    DOM.profileNameInput.value = name;
    DOM.profileTitleInput.value = title;
    DOM.profileAvatarInput.value = avatar;
    
    // Update preview card right away
    DOM.userDisplayName.textContent = name;
    DOM.userDisplayTitle.textContent = title;
    updateAvatarImage(avatar);
    
    updateAPIIndicator(key);
}

function saveSettings() {
    const key = DOM.geminiKeyInput.value.trim();
    const name = DOM.profileNameInput.value.trim() || 'Google Cloud Architect';
    const title = DOM.profileTitleInput.value.trim() || 'Data Platform & Analytics Expert';
    const avatar = DOM.profileAvatarInput.value.trim();
    
    localStorage.setItem('gemini_api_key', key);
    localStorage.setItem('linkedin_name', name);
    localStorage.setItem('linkedin_title', title);
    localStorage.setItem('linkedin_avatar', avatar);
    
    DOM.userDisplayName.textContent = name;
    DOM.userDisplayTitle.textContent = title;
    updateAvatarImage(avatar);
    
    updateAPIIndicator(key);
    
    DOM.settingsModal.classList.add('hidden');
    showToast('success', 'Settings saved successfully!');
}

function clearSettings() {
    DOM.geminiKeyInput.value = '';
    DOM.profileNameInput.value = '';
    DOM.profileTitleInput.value = '';
    DOM.profileAvatarInput.value = '';
    
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('linkedin_name');
    localStorage.removeItem('linkedin_title');
    localStorage.removeItem('linkedin_avatar');
    
    DOM.userDisplayName.textContent = 'Google Cloud Architect';
    DOM.userDisplayTitle.textContent = 'Data Platform & Analytics Expert';
    updateAvatarImage('');
    
    updateAPIIndicator('');
    
    DOM.settingsModal.classList.add('hidden');
    showToast('info', 'Settings cleared successfully.');
}

function updateAvatarImage(url) {
    if (url) {
        DOM.authorAvatarContainer.innerHTML = `<img src="${url}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        DOM.authorAvatarContainer.innerHTML = `
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="12" transform="scale(1.666)" fill="#1e293b"/>
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#64748b"/>
            </svg>
        `;
    }
}

function updateAPIIndicator(apiKey) {
    if (apiKey) {
        DOM.aiGenerationIndicator.textContent = 'Gemini AI Active ⚡';
        DOM.aiGenerationIndicator.classList.add('ai');
        DOM.btnGenerate.querySelector('.btn-text').textContent = 'Generate with Gemini AI ⚡';
    } else {
        DOM.aiGenerationIndicator.textContent = 'Local Engine 📝';
        DOM.aiGenerationIndicator.classList.remove('ai');
        DOM.btnGenerate.querySelector('.btn-text').textContent = 'Generate Post Draft';
    }
}

// FETCH FEED FROM FLASK SERVER
async function fetchFeed(forceRefresh = false) {
    // Show loading state
    setLoadingState(true);
    DOM.feedContainer.innerHTML = `
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
    `;
    
    try {
        const response = await fetch(`/api/feed?refresh=${forceRefresh}`);
        const result = await response.json();
        
        if (result.success) {
            feedEntries = result.entries;
            
            // Flatten the entries into individual sub-updates
            parsedItems = [];
            feedEntries.forEach(entry => {
                entry.sub_items.forEach(item => {
                    parsedItems.push(item);
                });
            });
            
            // Update time status
            const fetchDate = new Date(result.last_fetched * 1000);
            DOM.syncText.textContent = `Synced: ${fetchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            DOM.syncDot.className = 'status-dot green';
            
            renderFeed();
            
            if (forceRefresh) {
                showToast('success', 'Feed refreshed and updated!');
            }
        } else {
            throw new Error(result.error || 'Failed to fetch release notes.');
        }
    } catch (error) {
        console.error(error);
        DOM.syncText.textContent = 'Sync Failed';
        DOM.syncDot.className = 'status-dot red';
        DOM.feedContainer.innerHTML = `
            <div class="feed-empty">
                <svg viewBox="0 0 24 24" width="40" height="40" stroke="var(--accent-red)" stroke-width="2" fill="none">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>Error loading feed notes.</p>
                <button class="btn-secondary" style="margin-top: 1rem; width: auto;" onclick="fetchFeed(true)">Retry Fetch</button>
            </div>
        `;
        showToast('error', `Error: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(isLoading) {
    if (isLoading) {
        DOM.btnRefresh.querySelector('.icon-refresh').classList.add('spinning');
        DOM.syncDot.className = 'status-dot loading';
        DOM.syncText.textContent = 'Syncing...';
    } else {
        DOM.btnRefresh.querySelector('.icon-refresh').classList.remove('spinning');
    }
}

// RENDER FEED LIST WITH FILTERS & SEARCH
function renderFeed() {
    // Filter and search logic
    const filteredItems = parsedItems.filter(item => {
        // Category Filter
        const matchesCategory = (activeFilter === 'all' || item.type.toLowerCase() === activeFilter.toLowerCase());
        
        // Search query filter
        const matchesSearch = searchQuery === '' || 
            item.text.toLowerCase().includes(searchQuery) || 
            item.type.toLowerCase().includes(searchQuery) ||
            item.date.toLowerCase().includes(searchQuery);
            
        return matchesCategory && matchesSearch;
    });
    
    if (filteredItems.length === 0) {
        DOM.feedContainer.innerHTML = `
            <div class="feed-empty">
                <svg viewBox="0 0 24 24" width="40" height="40" stroke="var(--text-muted)" stroke-width="2" fill="none">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p>No release notes found matching criteria.</p>
            </div>
        `;
        return;
    }
    
    DOM.feedContainer.innerHTML = '';
    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = `feed-card ${selectedItem && selectedItem.id === item.id ? 'active' : ''}`;
        card.dataset.id = item.id;
        
        // Determine type class for badge color
        const typeClass = item.type.toLowerCase();
        
        card.innerHTML = `
            <div class="feed-card-header">
                <span class="badge ${typeClass}">${item.type}</span>
                <span class="card-date">${item.date}</span>
            </div>
            <div class="feed-card-body">
                <p>${item.text}</p>
            </div>
            <button class="card-copy-btn" title="Copy raw update content">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
            </button>
        `;
        
        // Bind copy button click
        const copyBtn = card.querySelector('.card-copy-btn');
        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent selecting the card
            try {
                await navigator.clipboard.writeText(item.text);
                
                // Show copied state
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                `;
                showToast('success', 'Update text copied to clipboard!');
                
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    `;
                }, 1500);
            } catch (err) {
                console.error(err);
                showToast('error', 'Failed to copy card content.');
            }
        });
        
        card.addEventListener('click', () => selectUpdateItem(item));
        DOM.feedContainer.appendChild(card);
    });
}

// SELECT AN UPDATE ITEM FOR DETAIL VIEW
function selectUpdateItem(item) {
    selectedItem = item;
    
    // Highlight active card
    document.querySelectorAll('.feed-card').forEach(card => {
        if (card.dataset.id === item.id) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    // Setup detail views
    DOM.selectedTypeBadge.textContent = item.type;
    DOM.selectedTypeBadge.className = `badge ${item.type.toLowerCase()}`;
    DOM.selectedDate.textContent = item.date;
    DOM.selectedHtml.innerHTML = item.html;
    DOM.selectedDocLink.href = item.link;
    DOM.customLink.value = item.link;
    
    // Show Workspace Panel
    DOM.emptyState.classList.add('hidden');
    DOM.workspaceState.classList.remove('hidden');
    
    // Clear old post
    DOM.postDraftArea.value = '';
    updateCharCounter();
    
    // Smooth scroll panel-right to top
    document.getElementById('panel-right').scrollTo({ top: 0, behavior: 'smooth' });
}

// POST DRAFT GENERATION
async function generateLinkedInPost() {
    if (!selectedItem) return;
    
    const tone = document.querySelector('.tone-btn.active').dataset.tone;
    const includeEmojis = DOM.toggleEmojis.checked;
    const includeHashtags = DOM.toggleHashtags.checked;
    const includeLink = DOM.toggleLink.checked;
    const customLinkVal = DOM.customLink.value.trim();
    const apiKey = localStorage.getItem('gemini_api_key') || '';
    
    // UI Loading state
    DOM.btnGenerate.classList.add('loading');
    DOM.btnGenerate.disabled = true;
    DOM.btnGenerate.querySelector('.btn-text').textContent = 'Generating Post...';
    
    try {
        const response = await fetch('/api/generate-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: selectedItem.date,
                type: selectedItem.type,
                text: selectedItem.text,
                link: selectedItem.link,
                tone: tone,
                include_hashtags: includeHashtags,
                include_emojis: includeEmojis,
                include_link: includeLink,
                custom_link: customLinkVal,
                api_key: apiKey
            })
        });
        
        const result = await response.json();
        if (result.success) {
            // Put in textarea with smooth typing effect (or immediate insert)
            typeTextEffect(DOM.postDraftArea, result.post);
            
            // Warnings (like API failure fallback)
            if (result.warning) {
                showToast('warning', result.warning);
            } else {
                showToast('success', result.is_ai ? 'LinkedIn post drafted with Gemini AI!' : 'LinkedIn post draft generated!');
            }
        } else {
            throw new Error(result.error || 'Failed to generate post.');
        }
    } catch (err) {
        console.error(err);
        showToast('error', `Generation failed: ${err.message}`);
    } finally {
        DOM.btnGenerate.classList.remove('loading');
        DOM.btnGenerate.disabled = false;
        updateAPIIndicator(apiKey);
    }
}

// TYPING ANIMATION FOR POST GENERATION
function typeTextEffect(element, text) {
    element.value = '';
    isEditing = false;
    DOM.postDraftArea.setAttribute('readonly', 'true');
    DOM.editBtnText.textContent = 'Edit Draft';
    DOM.btnEditPost.classList.remove('active');
    
    let index = 0;
    const speed = 5; // milliseconds per character
    
    function type() {
        if (index < text.length) {
            element.value += text.charAt(index);
            index++;
            updateCharCounter();
            element.scrollTop = element.scrollHeight; // Scroll to bottom while writing
            setTimeout(type, speed);
        } else {
            updateCharCounter();
        }
    }
    
    type();
}

function updateCharCounter() {
    const len = DOM.postDraftArea.value.length;
    DOM.charCounter.textContent = `${len} character${len === 1 ? '' : 's'}`;
}

// TOAST SYSTEM
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose icons
    let svgIcon = '';
    if (type === 'success') {
        svgIcon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === 'error') {
        svgIcon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else if (type === 'warning') {
        svgIcon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
        svgIcon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }
    
    toast.innerHTML = `
        ${svgIcon}
        <span class="toast-message">${message}</span>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    // Auto remove after animation completes
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// BIND ALL BUTTON CLICK & INPUT EVENTS
function bindEvents() {
    // Refresh feed
    DOM.btnRefresh.addEventListener('click', () => fetchFeed(true));
    
    // Theme toggle
    DOM.btnTheme.addEventListener('click', toggleTheme);
    
    // Export CSV
    DOM.btnExportCsv.addEventListener('click', exportFilteredToCSV);
    
    // Toggle modal visibility
    DOM.btnSettings.addEventListener('click', () => {
        DOM.settingsModal.classList.remove('hidden');
    });
    DOM.btnCloseModal.addEventListener('click', () => {
        DOM.settingsModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    DOM.settingsModal.addEventListener('click', (e) => {
        if (e.target === DOM.settingsModal) {
            DOM.settingsModal.classList.add('hidden');
        }
    });
    
    // Password visibility toggle
    DOM.btnToggleKeyVisibility.addEventListener('click', () => {
        const type = DOM.geminiKeyInput.type === 'password' ? 'text' : 'password';
        DOM.geminiKeyInput.type = type;
        
        // Change icon style
        if (type === 'text') {
            DOM.btnToggleKeyVisibility.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
            `;
        } else {
            DOM.btnToggleKeyVisibility.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
            `;
        }
    });
    
    // Save/clear settings
    DOM.btnSaveSettings.addEventListener('click', saveSettings);
    DOM.btnClearSettings.addEventListener('click', clearSettings);
    
    // Search filtering (with debounce)
    let searchTimeout = null;
    DOM.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        
        // Show/hide clear button
        if (searchQuery) {
            DOM.btnClearSearch.style.display = 'block';
        } else {
            DOM.btnClearSearch.style.display = 'none';
        }
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderFeed();
        }, 200);
    });
    
    DOM.btnClearSearch.addEventListener('click', () => {
        DOM.searchInput.value = '';
        searchQuery = '';
        DOM.btnClearSearch.style.display = 'none';
        renderFeed();
    });
    
    // Filter pills selection
    DOM.filterPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        activeFilter = pill.dataset.filter;
        renderFeed();
    });
    
    // Tone selection
    DOM.toneGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.tone-btn');
        if (!btn) return;
        
        document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
    
    // Toggle link display override
    DOM.toggleLink.addEventListener('change', (e) => {
        if (e.target.checked) {
            DOM.customLinkContainer.classList.remove('hidden');
        } else {
            DOM.customLinkContainer.classList.add('hidden');
        }
    });
    
    // Generate post click
    DOM.btnGenerate.addEventListener('click', generateLinkedInPost);
    
    // Edit draft text toggling
    DOM.btnEditPost.addEventListener('click', () => {
        if (!selectedItem) return;
        
        isEditing = !isEditing;
        if (isEditing) {
            DOM.postDraftArea.removeAttribute('readonly');
            DOM.postDraftArea.focus();
            DOM.editBtnText.textContent = 'Lock Draft';
            DOM.btnEditPost.classList.add('active');
            showToast('info', 'Draft unlocked. You can now edit directly inside the LinkedIn preview box.');
        } else {
            DOM.postDraftArea.setAttribute('readonly', 'true');
            DOM.editBtnText.textContent = 'Edit Draft';
            DOM.btnEditPost.classList.remove('active');
            showToast('success', 'Changes locked.');
        }
    });
    
    // Track edit text count
    DOM.postDraftArea.addEventListener('input', updateCharCounter);
    
    // Copy post clipboard operation
    DOM.btnCopyPost.addEventListener('click', async () => {
        const content = DOM.postDraftArea.value;
        if (!content) {
            showToast('warning', 'Nothing to copy. Please generate a post draft first.');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(content);
            
            // Visual success indicator
            DOM.btnCopyPost.classList.add('copied');
            const origHTML = DOM.btnCopyPost.innerHTML;
            DOM.btnCopyPost.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Copied!</span>
            `;
            
            showToast('success', 'Draft copied to clipboard!');
            
            setTimeout(() => {
                DOM.btnCopyPost.classList.remove('copied');
                DOM.btnCopyPost.innerHTML = origHTML;
            }, 2500);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast('error', 'Failed to copy to clipboard.');
        }
    });
}

// EXPORT CURRENT FILTERED ITEMS TO CSV
function exportFilteredToCSV() {
    const filteredItems = parsedItems.filter(item => {
        const matchesCategory = (activeFilter === 'all' || item.type.toLowerCase() === activeFilter.toLowerCase());
        const matchesSearch = searchQuery === '' || 
            item.text.toLowerCase().includes(searchQuery) || 
            item.type.toLowerCase().includes(searchQuery) ||
            item.date.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    if (filteredItems.length === 0) {
        showToast('warning', 'No release notes found to export.');
        return;
    }

    const csvRows = [["Date", "Type", "Description", "URL"]];
    filteredItems.forEach(item => {
        csvRows.push([item.date, item.type, item.text, item.link]);
    });

    const csvString = csvRows.map(row => 
        row.map(value => `"${value.replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', `Exported ${filteredItems.length} release notes to CSV!`);
}
