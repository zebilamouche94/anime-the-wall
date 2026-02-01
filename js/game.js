// ============================================
// VARIABLES GLOBALES
// ============================================
let lives = 3;
let currentAnime = null;
let startTime = Date.now();

// Configuration Fuse.js pour recherche floue
const fuse = new Fuse(animeData, {
    keys: ['title', 'synonyms'],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2
});

// Charger progression depuis LocalStorage
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
    
    // Enregistrer l'heure de démarrage si nouvelle partie
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
        
        // Marquer comme trouvé si dans le localStorage
        if (foundAnimes.includes(anime.id)) {
            card.classList.add('found');
        }
        
        // === RANDOMISATION VISUELLE ===
        
        // Taille aléatoire (certaines affiches plus grandes)
        const sizes = ['small', 'normal', 'large'];
        const randomSize = sizes[index % 3];
        card.classList.add(randomSize);
        
        // Rotation aléatoire légère
        const rotation = (Math.random() * 8 - 4); // Entre -4° et +4°
        card.style.setProperty('--rotation', `${rotation}deg`);
        
        // Décalage vertical aléatoire
        const offsetY = (Math.random() * 20 - 10); // Entre -10px et +10px
        card.style.setProperty('--offset-y', `${offsetY}px`);
        
        // Z-index aléatoire pour superposition
        const zIndex = Math.floor(Math.random() * 10);
        card.style.zIndex = zIndex;
        
        const img = document.createElement('img');
        img.src = `assets/posters/${anime.poster}`;
        img.alt = `Affiche ${anime.id}`;
        img.loading = 'lazy';
        
        card.appendChild(img);
        card.addEventListener('click', () => openModal(anime));
        grid.appendChild(card);
    });
    // Occultation partielle aléatoire (30% des affiches)
if (Math.random() > 0.7 && !foundAnimes.includes(anime.id)) {
    const obscureTypes = ['obscured-top', 'obscured-bottom', 'obscured-left', 'obscured-right'];
    const randomObscure = obscureTypes[Math.floor(Math.random() * obscureTypes.length)];
    card.classList.add('obscured', randomObscure);
}

}


// ============================================
// GESTION DE LA MODALE
// ============================================
function openModal(anime) {
    if (foundAnimes.includes(anime.id)) return; // Déjà trouvé
    
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
// VALIDATION DE LA RÉPONSE
// ============================================
function validateAnswer() {
    const guess = document.getElementById('guess-input').value.trim();
    if (!guess || guess.length < 2) return;
    
    // Recherche floue avec Fuse.js
    const results = fuse.search(guess);
    
    // Vérifier si le premier résultat correspond à l'anime sélectionné
    const isCorrect = results.length > 0 && results[0].item.id === currentAnime.id;
    
    if (isCorrect) {
        handleCorrect();
    } else {
        handleWrong();
    }
}

// ============================================
// BONNE RÉPONSE
// ============================================
function handleCorrect() {
    // Marquer comme trouvé
    foundAnimes.push(currentAnime.id);
    localStorage.setItem('animeTheWall_found', JSON.stringify(foundAnimes));
    
    // Mettre à jour visuellement
    const card = document.querySelector(`[data-id="${currentAnime.id}"]`);
    card.classList.add('found');
    
    // Son de victoire (optionnel)
    playSound('correct');
    
    updateStats();
    closeModal();
    
    // Vérifier si victoire totale
    if (foundAnimes.length === animeData.length) {
        setTimeout(showVictory, 500);
    }
}

// ============================================
// MAUVAISE RÉPONSE
// ============================================
function handleWrong() {
    lives--;
    localStorage.setItem('animeTheWall_lives', lives);
    updateStats();
    
    // Afficher message d'erreur
    const errorMsg = document.getElementById('error-msg');
    errorMsg.classList.remove('hidden');
    
    // Animation shake
    document.querySelector('.modal-content').classList.add('shake');
    setTimeout(() => {
        document.querySelector('.modal-content').classList.remove('shake');
    }, 400);
    
    // Son d'erreur (optionnel)
    playSound('wrong');
    
    // Vider l'input
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-input').focus();
    
    // Game Over
    if (lives === 0) {
        setTimeout(showGameOver, 500);
    }
}

// ============================================
// MISE À JOUR DES STATS
// ============================================
function updateStats() {
    function updateStats() {
    document.getElementById('score').textContent = foundAnimes.length;
    document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, lives));
    
    // Animation du score
    document.getElementById('score').classList.add('score-update');
    setTimeout(() => {
        document.getElementById('score').classList.remove('score-update');
    }, 500);
    
    // Barre de progression
    const progress = (foundAnimes.length / animeData.length) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
    document.getElementById('progress-text').textContent = Math.round(progress) + '%';
}

}

// ============================================
// AFFICHAGE VICTOIRE
// ============================================
function showVictory() {
    closeModal();
    
    const elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    
    document.getElementById('completion-time').textContent = 
        `Temps : ${minutes}min ${seconds}s`;
    
    document.getElementById('victory-modal').classList.remove('hidden');
    
    // 🎉 CONFETTIS !
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


// ============================================
// AFFICHAGE GAME OVER
// ============================================
function showGameOver() {
    closeModal();
    document.getElementById('final-score').textContent = foundAnimes.length;
    document.getElementById('gameover-modal').classList.remove('hidden');
}

// ============================================
// RESET DU JEU
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
    
    renderGrid();
    updateStats();
    closeModal();
    
    document.getElementById('victory-modal').classList.add('hidden');
    document.getElementById('gameover-modal').classList.add('hidden');
}

// ============================================
// PARTAGE SOCIAL
// ============================================
function shareScore() {
    const text = `J'ai trouvé les 66 animes sur Anime The Wall ! 🎌\nPeux-tu faire mieux ?\n\n`;
    const url = window.location.href;
    
    // Web Share API (mobile)
    if (navigator.share) {
        navigator.share({
            title: 'Anime The Wall',
            text: text,
            url: url
        });
    } else {
        // Fallback : copier dans le presse-papier
        navigator.clipboard.writeText(text + url);
        alert('Lien copié dans le presse-papier !');
    }
}

// ============================================
// SONS (Optionnel)
// ============================================
function playSound(type) {
    try {
        const audio = new Audio(`assets/sounds/${type}.mp3`);
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignorer les erreurs (pas de son = pas grave)
    } catch (e) {}
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Mode difficile toggle
const hardModeBtn = document.getElementById('hard-mode-toggle');
if (hardModeBtn) {
    hardModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('hard-mode');
        hardModeBtn.textContent = document.body.classList.contains('hard-mode') 
            ? '😵 Mode Normal' 
            : '😎 Mode Difficile';
    });
}

    // Validation
    document.getElementById('submit-btn').addEventListener('click', validateAnswer);
    
    document.getElementById('guess-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validateAnswer();
    });
    
    // Fermeture modale
    document.getElementById('close-modal').addEventListener('click', closeModal);
    
    document.querySelector('#modal .modal-backdrop')?.addEventListener('click', closeModal);
    
    // Boutons reset/restart
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('restart-btn')?.addEventListener('click', resetGame);
    document.getElementById('retry-btn')?.addEventListener('click', resetGame);
    
    // Partage
    document.getElementById('share-btn')?.addEventListener('click', shareScore);
    
    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
    
    // ============================================
    // THÈME CLAIR/SOMBRE (NOUVEAU)
    // ============================================
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Clic sur le bouton
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            themeToggle.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
            localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        });
        
        // Charger le thème au démarrage
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.textContent = '☀️';
        }
    }
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const btn = document.getElementById('theme-toggle');
    btn.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
    
    // Sauvegarder la préférence
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
});

// Effet parallaxe léger au scroll
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const posters = document.querySelectorAll('.poster-card');
    
    posters.forEach((poster, index) => {
        const speed = (index % 5) * 0.05; // Vitesse différente par carte
        const yPos = scrolled * speed;
        poster.style.transform = `translateY(${yPos}px) rotate(var(--rotation, 0deg))`;
    });
});


// ============================================
// LANCEMENT DU JEU
// ============================================
init();
