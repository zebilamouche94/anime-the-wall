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
    
    startBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        setTimeout(() => {
            startScreen.style.display = 'none';
            startGame();
        }, 600);
    });
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
// GÉNÉRATION DE LA GRILLE
// ============================================
function renderGrid() {
    const grid = document.getElementById('poster-grid');
    grid.innerHTML = '';
    
    animeData.forEach((anime, index) => {
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.dataset.id = anime.id;
        
        if (foundAnimes.includes(anime.id)) {
            card.classList.add('found');
        }
        
        // Rotation aléatoire
        const rotation = (Math.random() * 10 - 5);
        card.style.transform = `rotate(${rotation}deg)`;
        
        const img = document.createElement('img');
        img.src = `assets/posters/${anime.poster}`;
        img.alt = `Affiche ${anime.id}`;
        img.loading = 'lazy';
        
        card.appendChild(img);
        card.addEventListener('click', () => openModal(anime));
        grid.appendChild(card);
    });
}

// ============================================
// PANZOOM (Zoom/Pan interactif avec limites)
// ============================================
function initPanzoom() {
    const container = document.getElementById('wall-container');
    const element = document.getElementById('zoom-container');
    
    if (element && typeof Panzoom !== 'undefined') {
        const panzoom = Panzoom(element, {
            maxScale: 2.5,      // Zoom max
            minScale: 1,        // IMPORTANT : Ne peut pas dézoomer en dessous de 100%
            step: 0.15,
            contain: 'outside',
            cursor: 'grab',
            animate: true,
            startScale: 1,
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
        
        console.log('✅ Panzoom activé - Zoom limité entre 100% et 250%');
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
    card.classList.add('found');
    
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
    
    document.querySelector('.modal-content').classList.add('shake');
    setTimeout(() => {
        document.querySelector('.modal-content').classList.remove('shake');
    }, 400);
    
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
    scoreEl.textContent = foundAnimes.length;
    scoreEl.classList.add('score-update');
    setTimeout(() => scoreEl.classList.remove('score-update'), 500);
    
    document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, lives));
    
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
    
    document.getElementById('completion-time').textContent = 
        `Temps : ${minutes}min ${seconds}s`;
    
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
    document.getElementById('final-score').textContent = foundAnimes.length;
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
    document.getElementById('submit-btn').addEventListener('click', validateAnswer);
    
    document.getElementById('guess-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validateAnswer();
    });
    
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.querySelector('#modal .modal-backdrop')?.addEventListener('click', closeModal);
    
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('restart-btn')?.addEventListener('click', resetGame);
    document.getElementById('retry-btn')?.addEventListener('click', resetGame);
    
    document.getElementById('share-btn')?.addEventListener('click', shareScore);
    
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
