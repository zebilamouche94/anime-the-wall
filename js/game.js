// ============================================
// VARIABLES GLOBALES
// ============================================
let lives = 3;
let currentAnime = null;
let startTime = Date.now();
let gameStarted = false;

// Configuration Fuse.js
const fuse = new Fuse(animeData, {
    keys: ['title', 'synonyms'],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2
});

// Charger progression
let foundAnimes = JSON.parse(localStorage.getItem('animeTheWall_found') || '[]');
let savedLives = parseInt(localStorage.getItem('animeTheWall_lives') || '3');
let savedStartTime = parseInt(localStorage.getItem('animeTheWall_startTime') || Date.now());

lives = savedLives;
startTime = savedStartTime;

// ============================================
// INITIALISATION
// ============================================
function init() {
    renderGrid();
    updateStats();
    setupEventListeners();
    
    // Vérifier si le jeu a déjà été commencé
    if (foundAnimes.length > 0 || lives < 3) {
        // Reprendre la partie en cours
        startGame();
    } else {
        // Afficher l'écran de démarrage
        showStartScreen();
    }
}

// ============================================
// ÉCRAN DE DÉMARRAGE
// ============================================
function showStartScreen() {
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-game-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startScreen.classList.add('hidden');
            setTimeout(() => {
                startScreen.style.display = 'none';
                startGame();
            }, 600);
        });
    }
}

function startGame() {
    gameStarted = true;
    
    // Afficher le HUD et les éléments de jeu
    document.getElementById('hud').classList.add('visible');
    document.getElementById('progress-container').classList.add('visible');
    document.getElementById('progress-text').classList.add('visible');
    document.getElementById('instructions').classList.add('visible');
    
    // Initialiser Panzoom après un court délai
    setTimeout(initPanzoom, 300);
    
    // Réinitialiser le temps si nouvelle partie
    if (foundAnimes.length === 0) {
        startTime = Date.now();
        localStorage.setItem('animeTheWall_startTime', startTime);
    }
}

// ============================================
// GÉNÉRATION - FRAGMENTS DÉCOUPÉS
// ============================================
function renderGrid() {
    const grid = document.getElementById('poster-grid');
    grid.innerHTML = '';
    
    const containerWidth = 5000;
    const containerHeight = 4000;
    const fragmentSize = window.innerWidth > 768 ? 200 : 140;
    
    animeData.forEach((anime, index) => {
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.dataset.id = anime.id;
        
        if (foundAnimes.includes(anime.id)) {
            card.classList.add('found');
        }
        
        // Position aléatoire mais répartie
        const cols = Math.floor(containerWidth / (fragmentSize * 0.65));
        const rows = Math.ceil(animeData.length / cols);
        
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const baseX = col * (fragmentSize * 0.65);
        const baseY = row * (fragmentSize * 1.0);
        
        const randomX = (Math.random() - 0.5) * 120;
        const randomY = (Math.random() - 0.5) * 120;
        
        const x = Math.max(0, Math.min(containerWidth - fragmentSize, baseX + randomX));
        const y = Math.max(0, Math.min(containerHeight - fragmentSize, baseY + randomY));
        
        // Rotation aléatoire
        const rotation = (Math.random() - 0.5) * 40;
        
        // Z-index aléatoire
        const zIndex = Math.floor(Math.random() * 66);
        
        card.style.left = `${x}px`;
        card.style.top = `${y}px`;
        card.style.transform = `rotate(${rotation}deg)`;
        card.style.zIndex = zIndex;
        card.style.width = `${fragmentSize}px`;
        card.style.height = `${fragmentSize}px`;
        
        // IMAGE avec découpage aléatoire
        const img = document.createElement('img');
        img.src = `assets/posters/${anime.poster}`;
        img.alt = `Affiche ${anime.id}`;
        img.loading = 'lazy';
        
        // Découpage : zone centrale pour éviter texte
        const cropX = 15 + Math.random() * 50;
        const cropY = 30 + Math.random() * 30;
        
        img.style.width = '400%';
        img.style.height = '400%';
        img.style.objectFit = 'cover';
        img.style.objectPosition = `${cropX}% ${cropY}%`;
        
        card.appendChild(img);
        card.addEventListener('click', () => openModal(anime));
        grid.appendChild(card);
    });
}

// ============================================
// PANZOOM
// ============================================
function initPanzoom() {
    const container = document.getElementById('wall-container');
    const element = document.getElementById('zoom-container');
    
    if (element && typeof Panzoom !== 'undefined') {
        const panzoom = Panzoom(element, {
            maxScale: 2.5,
            minScale: 0.7,
            step: 0.1,
            contain: 'outside',
            cursor: 'grab',
            animate: true,
            startScale: 0.9,
            startX: 0,
            startY: 0
        });
        
        // Zoom avec la molette
        container.addEventListener('wheel', (e) => {
            if (!e.target.closest('.poster-card')) {
                e.preventDefault();
                panzoom.zoomWithWheel(e);
            }
        });
        
        console.log('✅ Panzoom activé');
    } else {
        console.warn('⚠️ Panzoom non disponible');
    }
}

// ============================================
// GESTION DE LA MODALE
// ============================================
function openModal(anime) {
    if (foundAnimes.includes(anime.id)) return;
    
    currentAnime = anime;
    document.getElementById('modal-poster').src = `assets/posters/${anime.poster}`;
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-input').focus();
    document.getElementById('error-msg').classList.add('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    currentAnime = null;
}

// ============================================
// VALIDATION
// ============================================
function validateAnswer() {
    const guess = document.getElementById('guess-input').value.trim();
    if (!guess || guess.length < 2) return;
    
    const results = fuse.search(guess);
    const isCorrect = results.length > 0 && results[0].item.id === currentAnime.id;
    
    if (isCorrect) {
        handleCorrect();
    } else {
        handleWrong();
    }
}

function handleCorrect() {
    foundAnimes.push(currentAnime.id);
    localStorage.setItem('animeTheWall_found', JSON.stringify(foundAnimes));
    
    const card = document.querySelector(`[data-id="${currentAnime.id}"]`);
    if (card) {
        card.classList.add('found');
    }
    
    playSound('correct');
    updateStats();
    closeModal();
    
    if (foundAnimes.length === animeData.length) {
        setTimeout(showVictory, 500);
    }
}

function handleWrong() {
    lives--;
    localStorage.setItem('animeTheWall_lives', lives);
    updateStats();
    
    const errorMsg = document.getElementById('error-msg');
    errorMsg.classList.remove('hidden');
    
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('shake');
        setTimeout(() => {
            modalContent.classList.remove('shake');
        }, 400);
    }
    
    playSound('wrong');
    
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-input').focus();
    
    if (lives === 0) {
        setTimeout(showGameOver, 500);
    }
}

// ============================================
// MISE À JOUR DES STATS
// ============================================
function updateStats() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
        scoreEl.textContent = foundAnimes.length;
        scoreEl.classList.add('score-update');
        setTimeout(() => scoreEl.classList.remove('score-update'), 500);
    }
    
    const livesEl = document.getElementById('lives');
    if (livesEl) {
        livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
    }
    
    // Barre de progression
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    if (progressBar && progressText) {
        const progress = (foundAnimes.length / animeData.length) * 100;
        progressBar.style.width = progress + '%';
        progressText.textContent = Math.round(progress) + '%';
    }
}

// ============================================
// VICTOIRE / GAME OVER
// ============================================
function showVictory() {
    closeModal();
    
    const elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    
    const completionTimeEl = document.getElementById('completion-time');
    if (completionTimeEl) {
        completionTimeEl.textContent = `Temps : ${minutes}min ${seconds}s`;
    }
    
    document.getElementById('victory-modal').classList.remove('hidden');
    
    playSound('victory');
    
    // Confettis
    if (typeof confetti !== 'undefined') {
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 7,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ff6b6b', '#51cf66', '#667eea', '#ffd93d']
            });
            confetti({
                particleCount: 7,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ff6b6b', '#51cf66', '#667eea', '#ffd93d']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
}

function showGameOver() {
    closeModal();
    const finalScoreEl = document.getElementById('final-score');
    if (finalScoreEl) {
        finalScoreEl.textContent = foundAnimes.length;
    }
    document.getElementById('gameover-modal').classList.remove('hidden');
}

// ============================================
// RESET
// ============================================
function resetGame() {
    if (foundAnimes.length > 0 && lives > 0) {
        if (!confirm('Recommencer le jeu ? (Ta progression sera effacée)')) {
            return;
        }
    }
    
    localStorage.removeItem('animeTheWall_found');
    localStorage.removeItem('animeTheWall_lives');
    localStorage.removeItem('animeTheWall_startTime');
    
    foundAnimes = [];
    lives = 3;
    startTime = Date.now();
    gameStarted = false;
    
    renderGrid();
    updateStats();
    closeModal();
    
    document.getElementById('victory-modal').classList.add('hidden');
    document.getElementById('gameover-modal').classList.add('hidden');
    
    // Masquer le HUD
    document.getElementById('hud').classList.remove('visible');
    document.getElementById('progress-container').classList.remove('visible');
    document.getElementById('progress-text').classList.remove('visible');
    document.getElementById('instructions').classList.remove('visible');
    
    // Afficher l'écran de démarrage
    const startScreen = document.getElementById('start-screen');
    startScreen.style.display = 'flex';
    startScreen.classList.remove('hidden');
    
    showStartScreen();
}

// ============================================
// PARTAGE
// ============================================
function shareScore() {
    const text = `J'ai trouvé les 66 animes sur Anime The Wall ! 🎌\nPeux-tu faire mieux ?\n\n`;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({ title: 'Anime The Wall', text: text, url: url });
    } else {
        navigator.clipboard.writeText(text + url);
        alert('Lien copié dans le presse-papier !');
    }
}

// ============================================
// SONS
// ============================================
function playSound(type) {
    try {
        const audio = new Audio(`assets/sounds/${type}.wav`);
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (e) {}
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', validateAnswer);
    }
    
    const guessInput = document.getElementById('guess-input');
    if (guessInput) {
        guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') validateAnswer();
        });
    }
    
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    const modalBackdrop = document.querySelector('#modal .modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetGame);
    }
    
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', resetGame);
    }
    
    const retryBtn = document.getElementById('retry-btn
    
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', resetGame);
    }
    
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareScore);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
    
    // Thème toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            themeToggle.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
            localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        });
        
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.textContent = '☀️';
        }
    }
}

// ============================================
// LANCEMENT
// ============================================
init();
