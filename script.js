const API_BASE = "https://api.mangadex.org";
const COVER_BASE = "https://uploads.mangadex.org/covers";
const app = document.getElementById('app-container');

// --- STATE MANAGEMENT ---
let popularMangaOffset = 0;
const MANGA_PER_PAGE = 20;

// --- ROUTER ---
const routes = {
    '/': renderHomePage,
    '/search/:query': renderSearchPage, // Rute baru untuk pencarian
    '/manga/:id': renderDetailPage,
    '/reader/:id': renderReaderPage,
    '/history': renderHistoryPage,
    '/favorites': renderFavoritesPage,
};

function router() {
    app.classList.add('page-enter');
    setTimeout(() => app.classList.remove('page-enter'), 400);

    const path = window.location.hash.slice(1) || '/';
    let match = null;

    for (const route in routes) {
        const routeParts = route.split('/');
        const pathParts = path.split('/');
        if (routeParts.length === pathParts.length) {
            const params = {};
            const isMatch = routeParts.every((part, i) => {
                if (part.startsWith(':')) {
                    params[part.substring(1)] = decodeURIComponent(pathParts[i]);
                    return true;
                }
                return part === pathParts[i];
            });
            if (isMatch) {
                match = { route, params };
                break;
            }
        }
    }

    if (match) {
        routes[match.route](match.params);
    } else {
        routes['/'](); // Fallback to home page
    }
    updateActiveNavLink();
}

// --- PAGE RENDERERS ---

async function renderHomePage() {
    popularMangaOffset = 0;
    app.innerHTML = `
        ${createSearchBoxHTML()}
        <section>
            <h2 class="section-title">Populer Saat Ini</h2>
            <div class="grid" id="popularGrid"></div>
            <div class="load-more-container" id="load-more-popular"></div>
        </section>
    `;
    setupSearchBoxListeners();
    await loadPopular(true);
}

async function renderSearchPage({ query }) {
    app.innerHTML = `
        ${createSearchBoxHTML(query)}
        <section class="search-results-section">
            <h2 class="section-title search-results-title">Hasil pencarian untuk: <strong>"${query}"</strong></h2>
            <div class="grid search-grid" id="mangaGrid"></div>
        </section>
    `;
    setupSearchBoxListeners();
    
    const container = document.getElementById("mangaGrid");
    container.innerHTML = `<div class="status-message">Mencari...</div>`;
    
    const data = await fetchApi(`/manga?title=${encodeURIComponent(query)}&limit=40&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive`);
    
    if (data && data.data.length > 0) {
        container.innerHTML = data.data.map(createMangaCard).join('');
    } else {
        container.innerHTML = `<div class="no-results-message">Tidak ada hasil ditemukan untuk "${query}".</div>`;
    }
}

async function renderDetailPage({ id }) {
    app.innerHTML = `<div class="status-message">Memuat detail manga...</div>`;
    const mangaData = await fetchApi(`/manga/${id}?includes[]=author&includes[]=artist&includes[]=cover_art&includes[]=tag`);
    if (!mangaData) return app.innerHTML = `<div class="status-message">Gagal memuat detail manga.</div>`;

    const manga = mangaData.data;
    const { title, description, author, artist, status, coverUrl, tags } = extractMangaDetails(manga);

    sessionStorage.setItem('currentManga', JSON.stringify({ id: manga.id, title, coverUrl }));
    const isFavorited = isMangaFavorited(manga.id);

    app.innerHTML = `
        <div class="detail-controls">
            <button onclick="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Kembali</button>
            <button id="share-btn" class="btn btn-secondary"><i class="fas fa-share-alt"></i> Bagikan</button>
            <button id="favorite-btn" class="btn btn-secondary ${isFavorited ? 'favorited' : ''}">
                <i class="fas fa-star"></i> <span>${isFavorited ? 'Difavoritkan' : 'Favoritkan'}</span>
            </button>
        </div>
        <div id="detail-content">
            <div id="detail-cover"><img src="${coverUrl}" alt="Cover"></div>
            <div id="detail-info">
                <h2>${title}</h2>
                <div id="detail-meta">
                    <p>Author: <span>${author}</span></p>
                    <p>Artist: <span>${artist}</span></p>
                    <p>Status: <span>${status}</span></p>
                </div>
                <div id="detail-tags">${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
            </div>
        </div>
        <p id="mangaDesc" style="margin-top: 20px;">${description}</p>
        <div id="chapters-container">
            <h3 class="section-title">Chapter</h3>
            <div id="chapters"><div class="status-message">Memuat chapter...</div></div>
        </div>
    `;
    document.getElementById('share-btn').addEventListener('click', shareManga);
    document.getElementById('favorite-btn').addEventListener('click', () => toggleFavorite(manga));
    await loadChapters(id);
}

// ... (renderReaderPage, renderHistoryPage, renderFavoritesPage tetap sama)
async function renderReaderPage({ id }) {
    const currentManga = JSON.parse(sessionStorage.getItem('currentManga'));
    app.innerHTML = `
        <div><button onclick="window.history.back()" class="btn"><i class="fas fa-arrow-left"></i> Kembali ke Detail</button></div>
        <h2 class="section-title">${currentManga?.title || 'Reader'}</h2>
        <div id="readerPages"><div class="status-message">Memuat halaman...</div></div>
    `;
    const data = await fetchApi(`/at-home/server/${id}`);
    const readerPages = document.getElementById('readerPages');
    if (data?.chapter) {
        readerPages.innerHTML = "";
        const { baseUrl, chapter: { hash, data: pages } } = data;
        pages.forEach(p => readerPages.appendChild(createImageNode(`${baseUrl}/data/${hash}/${p}`)));
        if (currentManga) {
            saveHistory(currentManga.id, currentManga.title, currentManga.coverUrl, `Chapter ID ${id}`);
        }
    } else {
        readerPages.innerHTML = `<p class="status-message">Gagal memuat halaman chapter.</p>`;
    }
}

function renderHistoryPage() {
    const history = getFromStorage("bacaYukiHistory");
    let content = `
        <div class="section-title">
            <h2>Riwayat Membaca</h2>
            ${history.length > 0 ? '<button id="clear-history-btn" class="btn btn-secondary"><i class="fas fa-trash"></i> Bersihkan Riwayat</button>' : ''}
        </div>`;
    if (history.length === 0) {
        content += `<p class="status-message">Tidak ada riwayat membaca.</p>`;
    } else {
        content += history.map(createHistoryCard).join("");
    }
    app.innerHTML = content;
    if (history.length > 0) {
        document.getElementById('clear-history-btn').addEventListener('click', () => {
            if (confirm('Anda yakin ingin menghapus semua riwayat?')) {
                localStorage.removeItem("bacaYukiHistory");
                renderHistoryPage();
            }
        });
    }
}

function renderFavoritesPage() {
    const favorites = getFromStorage("bacaYukiFavorites");
    let content = `<h2 class="section-title">Manga Favorit</h2>`;
    if (favorites.length === 0) {
        content += `<p class="status-message">Anda belum punya manga favorit.</p>`;
    } else {
        content += `<div class="grid">${favorites.map(createMangaCard).join("")}</div>`;
    }
    app.innerHTML = content;
}


// --- API & DATA LOGIC ---
async function fetchApi(endpoint) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
    } catch (error) { console.error("API Fetch Error:", error); return null; }
}

async function loadPopular(isInitial = false) {
    // ... (fungsi sama)
    const container = document.getElementById('popularGrid');
    const loadMoreContainer = document.getElementById('load-more-popular');
    if (!container || !loadMoreContainer) return;
    loadMoreContainer.innerHTML = `<p class="status-message">Memuat...</p>`;
    if (isInitial) container.innerHTML = '';
    const data = await fetchApi(`/manga?limit=${MANGA_PER_PAGE}&offset=${popularMangaOffset}&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive`);
    if (data?.data) {
        container.insertAdjacentHTML('beforeend', data.data.map(createMangaCard).join(''));
        popularMangaOffset += MANGA_PER_PAGE;
        if (data.total > popularMangaOffset) {
            loadMoreContainer.innerHTML = `<button id="load-more-btn" class="btn">Muat Lebih Banyak</button>`;
            document.getElementById('load-more-btn').onclick = () => loadPopular();
        } else {
            loadMoreContainer.innerHTML = `<p class="status-message">Sudah mencapai akhir.</p>`;
        }
    } else if (isInitial) {
        container.innerHTML = `<p class="status-message">Gagal memuat manga populer.</p>`;
        loadMoreContainer.innerHTML = '';
    }
}

async function loadChapters(mangaId) {
    // ... (fungsi sama)
    const chaptersDiv = document.getElementById('chapters');
    chaptersDiv.innerHTML = `<div class="status-message">Memuat chapter...</div>`;
    let allChapters = []; let offset = 0; const limit = 500; let hasMore = true;
    while(hasMore) {
        const chapData = await fetchApi(`/manga/${mangaId}/feed?translatedLanguage[]=id&translatedLanguage[]=en&order[chapter]=desc&limit=${limit}&offset=${offset}`);
        if(chapData?.data?.length > 0) {
            allChapters.push(...chapData.data);
            offset += limit;
            hasMore = chapData.total > offset;
        } else { hasMore = false; }
    }
    if (allChapters.length > 0) {
        chaptersDiv.innerHTML = allChapters.map(chap => {
            const chTitle = `Chapter ${chap.attributes.chapter || "?"} ${chap.attributes.title ? `- ${chap.attributes.title}`: ''}`;
            return `<a href="#/reader/${chap.id}" class="chapter-link">${chTitle}</a>`;
        }).join('');
    } else { chaptersDiv.innerHTML = `<p class="status-message">Belum ada chapter tersedia.</p>`; }
}

// --- LOCAL STORAGE & FAVORITES LOGIC ---
const getFromStorage = (key) => JSON.parse(localStorage.getItem(key)) || [];
const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

function isMangaFavorited(mangaId) {
    return getFromStorage("bacaYukiFavorites").some(m => m.id === mangaId);
}

function toggleFavorite(manga) {
    let favorites = getFromStorage("bacaYukiFavorites");
    const btn = document.getElementById('favorite-btn');
    if (isMangaFavorited(manga.id)) {
        favorites = favorites.filter(m => m.id !== manga.id);
        btn.classList.remove('favorited');
        btn.querySelector('span').textContent = 'Favoritkan';
    } else {
        favorites.unshift(manga); // Memasukkan objek manga lengkap
        btn.classList.add('favorited');
        btn.querySelector('span').textContent = 'Difavoritkan';
    }
    saveToStorage("bacaYukiFavorites", favorites);
}

// ... (saveHistory, component builders, dan utility functions lainnya)
function saveHistory(mangaId, title, coverUrl, chapter) {
    let history = getFromStorage("bacaYukiHistory").filter(item => item.id !== mangaId);
    history.unshift({ id: mangaId, title, coverUrl, chapter, time: new Date().toLocaleString('id-ID') });
    if (history.length > 50) history.pop();
    saveToStorage("bacaYukiHistory", history);
}

const createSearchBoxHTML = (query = '') => `
    <div class="search-container">
        <i class="fas fa-search search-icon"></i>
        <input type="text" id="search-input" placeholder="Cari judul manga..." autocomplete="off" value="${query}">
        <button class="clear-search-btn" id="clear-search-btn">&times;</button>
    </div>
`;

function setupSearchBoxListeners() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    searchInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            const query = searchInput.value.trim();
            if(query) window.location.hash = `#/search/${encodeURIComponent(query)}`;
        }
    });
    searchInput.addEventListener('input', () => {
        clearBtn.classList.toggle('visible', searchInput.value.length > 0);
    });
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.classList.remove('visible');
        searchInput.focus();
        window.location.hash = '#/'; // Kembali ke home setelah clear
    });
    // Tampilkan tombol clear jika input sudah ada isinya (saat render halaman search)
    clearBtn.classList.toggle('visible', searchInput.value.length > 0);
}

const createMangaCard = (manga) => {
    const { id, title, coverUrl } = extractMangaDetails(manga);
    return `<a href="#/manga/${id}" class="card"><div class="card-img-container"><img src="${coverUrl}" alt="${title}" loading="lazy"></div><h3>${title}</h3></a>`;
};

const createHistoryCard = (h) => `<a href="#/manga/${h.id}" class="history-card"><img src="${h.coverUrl}" alt="${h.title}" loading="lazy"><div class="history-card-info"><strong>${h.title}</strong><p>Terakhir dibaca: ${h.chapter}</p><small>${h.time}</small></div></a>`;
const createImageNode = (src) => { const img = document.createElement("img"); img.className = "page-img"; img.src = src; img.loading = "lazy"; return img; };

function extractMangaDetails(manga) {
    const attributes = manga.attributes || {}; const relationships = manga.relationships || [];
    const title = attributes.title?.en || attributes.title?.[Object.keys(attributes.title)[0]] || "No Title";
    const description = (attributes.description?.en || attributes.description?.[Object.keys(attributes.description)[0]] || "Tidak ada deskripsi.").substring(0, 400) + '...';
    const author = relationships.find(r => r.type === 'author')?.attributes?.name || 'N/A';
    const artist = relationships.find(r => r.type === 'artist')?.attributes?.name || 'N/A';
    const status = (attributes.status || 'N/A').replace(/^\w/, c => c.toUpperCase());
    const coverRel = relationships.find(r => r.type === "cover_art");
    const coverUrl = coverRel ? `${COVER_BASE}/${manga.id}/${coverRel.attributes.fileName}.512.jpg` : "https://via.placeholder.com/512x724?text=No+Cover";
    const tags = attributes.tags?.map(t => t.attributes.name.en).filter(Boolean) || [];
    return { id: manga.id, title, description, author, artist, status, coverUrl, tags };
}

async function shareManga() {
    const title = JSON.parse(sessionStorage.getItem('currentManga'))?.title || 'Manga Keren';
    const url = window.location.href;
    if (navigator.share) {
        try { await navigator.share({ title: `Baca ${title} di BacaYuki`, text: `Cek manga ini: ${title}`, url: url }); } catch (err) { console.error('Error sharing:', err); }
    } else {
        try { await navigator.clipboard.writeText(url); alert('Link manga telah disalin ke clipboard!'); } catch (err) { console.error('Failed to copy: ', err); alert('Gagal menyalin link.'); }
    }
}

function updateActiveNavLink() {
    const currentPath = (window.location.hash.split('/')[1] || 'home').toLowerCase();
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    const activeLink = document.getElementById(`nav-${currentPath}`);
    if (activeLink) activeLink.classList.add('active');
    else document.getElementById('nav-home').classList.add('active'); // Default to home
}

// --- INITIALIZATION ---
window.addEventListener('hashchange', router);
window.addEventListener('load', router);