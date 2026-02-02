// ========================================
// ANIME THE WALL - Game Logic
// Version: Image unique avec zones cliquables
// ========================================

// Variables globales
let lives = 3;
let currentAnime = null;
let startTime = Date.now();
let gameStarted = false;
let fuse;
let foundAnimes = JSON.parse(localStorage.getItem('animeTheWall_found') || '[]');
let savedLives = parseInt(localStorage.getItem('animeTheWall_lives') || '3');
let savedStartTime = parseInt(localStorage.getItem('animeTheWall_startTime') || Date.now());
let clickableZones = [];

lives = savedLives;
startTime = savedStartTime;

// ========================================
// INITIALISATION
// ========================================

window.onload = function() {
    console.log('🎮 Anime The Wall - Chargement...');
    init();
};

async function init() {
    console.log('🚀 Initialisation du jeu');
    
    try {
        // Charger les zones cliquables
        const zonesResponse = await fetch('assets/clickable-zones.json');
        clickableZones = await zonesResponse.json();
        console.log('✅ Zones cliquables chargées:', clickableZones.length);
        
        // Vérifier que animeData existe
        if (typeof animeData === 'undefined') {
            console.error('❌ animeData non trouvé !');
            alert('Erreur: Données des animes manquantes');
            return;
        }
        
        console.log('✅ Données animes:', animeData.length, 'entrées');
        
        // Initialiser Fuse.js pour la recherche floue
        fuse = new Fuse(animeData, {
            keys: ['title', 'synonyms'],
            threshold: 0.35,
            ignoreLocation: true,
            minMatchCharLength: 2
        });
        
        // Configurer les interactions
        setupWallInteraction();
        updateStats();
        setupEventListeners();
        
        // Reprendre la partie ou commencer
        if (foundAnimes.length > 0 || lives < 3) {
            console.log('📦 Reprise de partie');
            hideStartScreen();
            startGame();
        } else {
            console.log('🎬 Nouvelle partie');
            setupStartButton();
        }
        
    } catch (error) {
        console.error('❌ Erreur d\'initialisation:', error);
        alert('Erreur de chargement. Vérifiez la console.');
    }
}

// ========================================
// GESTION DU MUR ET DES CLICS
// ========================================

function setupWallInteraction() {
    const wallImage = document.getElementById('wall-image');
    
    if (!wallImage) {
        console.error('❌ Image du mur introuvable !');
        return;
    }
    
    // Gérer les clics sur l'image
    wallImage.addEventListener('click', handleWallClick);
    
    // Effet hover pour montrer qu'on peut cliquer
    wallImage.addEventListener('mousemove', handleWallHover);
    
    console.log('✅ Interactions du mur configurées');
}

function handleWallClick(e) {
    if (!gameStarted) {
        console.log('⚠️ Jeu non démarré');
        return;
    }
    
    const rect = e.target.getBoundingClientRect();
    
    // Calculer les coordonnées réelles sur l'image
    const scaleX = e.target.naturalWidth / rect.width;
    const scaleY = e.target.naturalHeight / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    console.log('🖱️ Clic à:', Math.round(x), Math.round(y));
    
    // Trouver quelle zone a été cliquée
    const clickedZone = findClickedZone(x, y);
    
    if (clickedZone) {
        const anime = animeData.find(a => a.id === clickedZone.id);
        
        if (anime) {
            if (foundAnimes.includes(anime.id)) {
                console.log('ℹ️ Anime déjà trouvé:', anime.title);
                return;
            }
            
            console.log('✅ Affiche cliquée:', anime.title);
            openModal(anime, clickedZone);
        }
    } else {
        console.log('❌ Aucune affiche à cet endroit');
    }
}

function findClickedZone(x, y) {
    // Chercher dans toutes les zones cliquables
    for (let zone of clickableZones) {
        // Vérification rectangle simple
        if (x >= zone.x && 
            x <= zone.x + zone.width &&
            y >= zone.y && 
            y <= zone.y + zone.height) {
            return zone;
        }
    }
    return null;
}

function handleWallHover(e) {
    if (!gameStarted) return;
    
    const rect = e.target.getBoundingClientRect();
    const scaleX = e.target.naturalWidth / rect.width;
    const scaleY = e.target.naturalHeight / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const zone = findClickedZone(x, y);
    
    // Changer le curseur si on survole une affiche non trouvée
    if (zone && !foundAnimes.includes(zone.id)) {
        e.target.style.cursor = 'pointer';
    } else {
        e.target.style.cursor = 'grab';
    }
}

// ========================================
// DÉMARRAGE DU JEU
// ========================================

function setupStartButton() {
    const startBtn = document.getElementById('start-game-btn');
    const startScreen = document.getElementById('start-screen');
    
    if (!startBtn || !startScreen) {
        console.error('❌ Bouton ou écran de démarrage introuvable');
        return;
    }
    
    console.log('🔘 Configuration du bouton start');
    
    // Cloner pour supprimer les anciens listeners
    const newBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newBtn, startBtn);
    
    newBtn.addEventListener('click', function() {
        console.log('🎮 DÉMARRAGE DU JEU');
        hideStartScreen();
        startGame();
    });
}

function hideStartScreen() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.add('hidden');
        setTimeout(() => {
            startScreen.style.display = 'none';
        }, 600);
    }
}

function startGame() {
    console.log('🎮 Jeu démarré');
    gameStarted = true;
    
    // Afficher les éléments UI
    const hud = document.getElementById('hud');
    const progressContainer = document.getElementById('progress-container');
    const progressText = document.getElementById('progress-text');
    const instructions = document.getElementById('instructions');
    
    if (hud) hud.classList.add('visible');
    if (progressContainer) progressContainer.classList.add('visible');
    if (progressText) progressText.classList.add('visible');
    if (instructions) instructions.classList.add('visible');
    
    // Initialiser le zoom/pan après un délai
    setTimeout(initPanzoom, 300);
    
    // Initialiser le timer si nouvelle partie
    if (foundAnimes.length === 0) {
        startTime = Date.now();
        localStorage.setItem('animeTheWall_startTime', startTime);
    }
    
    // Marquer les affiches déjà trouvées
    markFoundPosters();
}

// ========================================
// GESTION DES AFFICHES TROUVÉES
// ========================================

function markFoundPosters() {
    const wallContainer = document.getElementById('wall-container');
    
    // Supprimer les anciens overlays
    document.querySelectorAll('.found-overlay').forEach(el => el.remove());
    
    // Ajouter un overlay vert sur chaque affiche trouvée
    foundAnimes.forEach(animeId => {
        const zone = clickableZones.find(z => z.id === animeId);
        if (zone) {
            const overlay = document.createElement('div');
            overlay.className = 'found-overlay';
            overlay.style.cssText = `
                position: absolute;
                left: ${zone.x}px;
                top: ${zone.y}px;
                width: ${zone.width}px;
                height: ${zone.height}px;
                background: rgba(76, 175, 80, 0.3);
                border: 3px solid #4CAF50;
                pointer-events: none;
                transform: rotate(${zone.rotation}deg);
                transform-origin: center;
                transition: all 0.3s ease;
            `;
            
            const zoomContainer = document.getElementById('zoom-container');
            if (zoomContainer) {
                zoomContainer.appendChild(overlay);
            }
        }
    });
}

// ========================================
// ZOOM ET DÉPLACEMENT (PANZOOM)
// ========================================

function initPanzoom() {
    const container = document.getElementById('wall-container');
    const element = document.getElementById('zoom-container');
    
    if (!element) {
        console.error('❌ zoom-container introuvable');
        return;
    }
    
    if (typeof Panzoom === 'undefined') {
        console.warn('⚠️ Panzoom non disponible');
        return;
    }
    
    const panzoom = Panzoom(element, {
        maxScale: 3,
        minScale: 0.5,
        step: 0.15,
        contain: 'outside',
        cursor: 'grab',
        animate: true,
        startScale: 0.7
    });
    
    // Zoom avec la molette
    container.addEventListener('wheel', function(e) {
        e.preventDefault();
        panzoom.zoomWithWheel(e);
    });
    
    console.log('✅ Panzoom activé');
}

// ========================================
// MODAL DE DEVINETTE
// ========================================

function openModal(anime, zone) {
    if (foundAnimes.includes(anime.id)) return;
    
    currentAnime = anime;
    
    // Afficher l'affiche dans le modal
    const modalPoster = document.getElementById('modal-poster');
    if (modalPoster) {
        // Utiliser l'affiche individuelle si disponible
        modalPoster.src = anime.poster ? `assets/posters/${anime.poster}` : '';
        modalPoster.alt = 'Affiche anime';
    }
    
    // Afficher le modal
    const modal = document.getElementById('modal');
    if (modal) modal.classList.remove('hidden');
    
    // Focus sur l'input
    const guessInput = document.getElementById('guess-input');
    if (guessInput) {
        guessInput.value = '';
        guessInput.focus();
    }
    
    // Cacher le message d'erreur
    const errorMsg = document.getElementById('error-msg');
    if (errorMsg) errorMsg.classList.add('hidden');
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.classList.add('hidden');
    
    currentAnime = null;
}

// ========================================
// VALIDATION DE LA RÉPONSE
// ========================================

function validateAnswer() {
    const guessInput = document.getElementById('guess-input');
    if (!guessInput) return;
    
    const guess = guessInput.value.trim();
    
    if (!guess || guess.length < 2) {
        console.log('⚠️ Réponse trop courte');
        return;
    }
    
    console.log('🔍 Vérification:', guess);
    
    // Recherche floue avec Fuse.js
    const results = fuse.search(guess);
    const isCorrect = results.length > 0 && results[0].item.id === currentAnime.id;
    
    if (isCorrect) {
        console.log('✅ BONNE RÉPONSE !');
        handleCorrectAnswer();
    } else {
        console.log('❌ MAUVAISE RÉPONSE');
        handleWrongAnswer();
    }
}

function handleCorrectAnswer() {
    // Ajouter aux animes trouvés
    foundAnimes.push(currentAnime.id);
    localStorage.setItem('animeTheWall_found', JSON.stringify(foundAnimes));
    
    // Effet visuel et sonore
    playSound('correct');
    updateStats();
    markFoundPosters();
    closeModal();
    
    // Vérifier la victoire
    if (foundAnimes.length === animeData.length) {
        setTimeout(showVictory, 500);
    }
}

function handleWrongAnswer() {
    // Perdre une vie
    lives--;
    localStorage.setItem('animeTheWall_lives', lives);
    updateStats();
    
    // Afficher l'erreur
    const errorMsg = document.getElementById('error-msg');
    if (errorMsg) errorMsg.classList.remove('hidden');
    
    // Effet de secousse
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('shake');
        setTimeout(() => {
            modalContent.classList.remove('shake');
        }, 400);
    }
    
    // Son d'erreur
    playSound('wrong');
    
    // Vider et refocus
    const guessInput = document.getElementById('guess-input');
    if (guessInput) {
        guessInput.value = '';
        guessInput.focus();
    }
    
    // Game over si plus de vies
    if (lives === 0) {
        setTimeout(showGameOver, 500);
    }
}

// ========================================
// MISE À JOUR DES STATS
// ========================================

function updateStats() {
    // Score
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = foundAnimes.length;
    
    // Vies
    const livesEl = document.getElementById('lives');
    if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
    
    // Barre de progression
    const progress = (foundAnimes.length / animeData.length) * 100;
    
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = progress + '%';
    
    const progressText = document.getElementById('progress-text');
    if (progressText) progressText.textContent = Math.round(progress) + '%';
}

// ========================================
// VICTOIRE ET GAME OVER
// ========================================

function showVictory() {
    closeModal();
    
    // Calculer le temps écoulé
    const elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    
    // Afficher le temps
    const completionTime = document.getElementById('completion-time');
    if (completionTime) {
        completionTime.textContent = `Temps : ${minutes}min ${seconds}s`;
    }
    
    // Afficher le modal de victoire
    const victoryModal = document.getElementById('victory-modal');
    if (victoryModal) victoryModal.classList.remove('hidden');
    
    // Son de victoire
    playSound('victory');
    
    // Confettis
    if (typeof confetti !== 'undefined') {
        const duration = 3000;
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
    
    console.log('🎉 VICTOIRE !');
}

function showGameOver() {
    closeModal();
    
    // Afficher le score final
    const finalScore = document.getElementById('final-score');
    if (finalScore) finalScore.textContent = foundAnimes.length;
    
    // Afficher le modal
    const gameoverModal = document.getElementById('gameover-modal');
    if (gameoverModal) gameoverModal.classList.remove('hidden');
    
    console.log('💀 Game Over');
}

// ========================================
// RESET DU JEU
// ========================================

function resetGame() {
    // Demander confirmation si partie en cours
    if (foundAnimes.length > 0 && lives > 0) {
        if (!confirm('Recommencer ? (progression effacée)')) {
            return;
        }
    }
    
    console.log('🔄 Reset du jeu');
    
    // Supprimer les données sauvegardées
    localStorage.removeItem('animeTheWall_found');
    localStorage.removeItem('animeTheWall_lives');
    localStorage.removeItem('animeTheWall_startTime');
    
    // Réinitialiser les variables
    foundAnimes = [];
    lives = 3;
    startTime = Date.now();
    gameStarted = false;
    
    // Mettre à jour l'affichage
    updateStats();
    closeModal();
    
    // Supprimer les overlays des affiches trouvées
    document.querySelectorAll('.found-overlay').forEach(el => el.remove());
    
    // Cacher les modals
    const victoryModal = document.getElementById('victory-modal');
    const gameoverModal = document.getElementById('gameover-modal');
    if (victoryModal) victoryModal.classList.add('hidden');
    if (gameoverModal) gameoverModal.classList.add('hidden');
    
    // Cacher le HUD
    const hud = document.getElementById('hud');
    const progressContainer = document.getElementById('progress-container');
    const progressText = document.getElementById('progress-text');
    const instructions = document.getElementById('instructions');
    
    if (hud) hud.classList.remove('visible');
    if (progressContainer) progressContainer.classList.remove('visible');
    if (progressText) progressText.classList.remove('visible');
    if (instructions) instructions.classList.remove('visible');
    
    // Réafficher l'écran de démarrage
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'flex';
        startScreen.classList.remove('hidden');
    }
    
    // Reconfigurer le bouton start
    setupStartButton();
}

// ========================================
// PARTAGE DU SCORE
// ========================================

function shareScore() {
    const text = `J'ai trouvé ${foundAnimes.length}/100 animes sur Anime The Wall ! 🎌\n`;
    const url = window.location.href;
    
    // Utiliser l'API de partage native si disponible
    if (navigator.share) {
        navigator.share({
            title: 'Anime The Wall',
            text: text,
            url: url
        }).catch(err => {
            console.log('❌ Erreur de partage:', err);
        });
    } else {
        // Fallback: copier dans le presse-papier
        navigator.clipboard.writeText(text + url).then(() => {
            alert('✅ Lien copié dans le presse-papier !');
        }).catch(err => {
            console.error('❌ Erreur de copie:', err);
            alert('Impossible de copier le lien');
        });
    }
}

// ========================================
// SONS
// ========================================

function playSound(type) {
    try {
        const audio = new Audio(`assets/sounds/${type}.wav`);
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Ignorer les erreurs de lecture (autoplay policy)
        });
    } catch (e) {
        // Ignorer si les sons ne sont pas disponibles
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    console.log('🎧 Configuration des event listeners');
    
    // Bouton de validation dans le modal
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', validateAnswer);
    }
    
    // Input de devinette (validation avec Enter)
    const guessInput = document.getElementById('guess-input');
    if (guessInput) {
        guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                validateAnswer();
            }
        });
    }
    
    // Bouton fermer le modal
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Clic sur le backdrop pour fermer
    const modalBackdrop = document.querySelector('#modal .modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }
    
    // Bouton reset
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetGame);
    }
    
    // Bouton restart (modal victoire)
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', resetGame);
    }
    
    // Bouton retry (modal game over)
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', resetGame);
    }
    
    // Bouton partage
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareScore);
    }
    
    // Touche Echap pour fermer le modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Toggle thème clair/sombre
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            themeToggle.textContent = isLight ? '☀️' : '🌙';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
        
        // Charger le thème sauvegardé
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.textContent = '☀️';
        }
    }
    
    console.log('✅ Event listeners configurés');
}

// ========================================
// LOG DE DEBUG (optionnel)
// ========================================

console.log(`
╔════════════════════════════════════════╗
║       🎌 ANIME THE WALL 🎌           ║
║     Version: Image unique v2.0        ║
║     100 animes à découvrir            ║
╚════════════════════════════════════════╝
`);
