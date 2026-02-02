// 
// ANIME THE WALL - Game Logic
// Version: Zone-based wall with click detection
// 

// Variables globales
let lives = 3;
let foundAnimes = [];
let startTime = Date.now();
let gameStarted = false;
let fuse;

// Charger les données sauvegardées
let savedLives = parseInt(localStorage.getItem('animeTheWall_lives') || '3');
let savedFound = JSON.parse(localStorage.getItem('animeTheWall_found') || '[]');
let savedStartTime = parseInt(localStorage.getItem('animeTheWall_startTime') || Date.now());

// 
// INITIALISATION
// 

window.addEventListener('DOMContentLoaded', function() {
    console.log('Anime The Wall - Initialisation');

    // Vérifier si une partie est en cours
    if (savedFound.length > 0 || savedLives < 3) {
        lives = savedLives;
        foundAnimes = savedFound;
        startTime = savedStartTime;
        gameStarted = true;

        // Cacher l'écran de démarrage
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.style.display = 'none';
        }

        // Reprendre la partie
        resumeGame();
    }

    // Initialiser Fuse.js pour la recherche floue
    initializeFuse();

    // Event listeners
    setupEventListeners();
});

function initializeFuse() {
    const options = {
        keys: ['name'],
        threshold: 0.3,
        ignoreLocation: true
    };

    fuse = new Fuse(animeData, options);
    console.log('Fuse.js initialisé avec', animeData.length, 'animes');
}

function setupEventListeners() {
    // Bouton démarrer
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }

    // Clic sur le mur
    const wallImage = document.getElementById('wall-image');
    if (wallImage) {
        wallImage.addEventListener('click', handleWallClick);
    }

    // Input de recherche
    const guessInput = document.getElementById('guess-input');
    if (guessInput) {
        guessInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitGuess();
            }
        });
    }

    // Bouton submit
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.addEventListener('click', submitGuess);
    }

    // Bouton fermer modal
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Bouton reset
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }

    // Boutons de partage
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', shareScore);
    }
}

// 
// DÉMARRAGE DU JEU
// 

function startGame() {
    console.log('Démarrage du jeu');

    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'none';
    }

    gameStarted = true;
    startTime = Date.now();
    lives = 3;
    foundAnimes = [];

    saveGameState();
    updateUI();

    playSound('start');
}

function resumeGame() {
    console.log('Reprise de la partie');

    gameStarted = true;
    updateUI();

    // Marquer les animes déjà trouvés
    foundAnimes.forEach(anime => {
        markAnimeAsFound(anime);
    });
}

// 
// GESTION DES CLICS
// 

let selectedAnime = null;

function handleWallClick(e) {
    if (!gameStarted || lives <= 0) return;

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convertir en coordonnées de l'image naturelle
    const scaleX = e.target.naturalWidth / rect.width;
    const scaleY = e.target.naturalHeight / rect.height;

    const clickX = Math.round(x * scaleX);
    const clickY = Math.round(y * scaleY);

    console.log('Clic à:', clickX, clickY);

    // Trouver l'anime cliqué
    const clickedAnime = findAnimeAtPosition(clickX, clickY);

    if (clickedAnime) {
        if (foundAnimes.includes(clickedAnime.name)) {
            console.log('Anime déjà trouvé');
            return;
        }

        selectedAnime = clickedAnime;
        openModal();

        // Focus sur l'input
        const guessInput = document.getElementById('guess-input');
        if (guessInput) {
            guessInput.focus();
        }
    }
}

function findAnimeAtPosition(x, y) {
    for (let anime of animeData) {
        if (x >= anime.x1 && x <= anime.x2 && y >= anime.y1 && y <= anime.y2) {
            console.log('Anime trouvé:', anime.name);
            return anime;
        }
    }
    return null;
}

// 
// VALIDATION DES RÉPONSES
// 

function submitGuess() {
    const guessInput = document.getElementById('guess-input');
    if (!guessInput || !selectedAnime) return;

    const guess = guessInput.value.trim();
    if (!guess) return;

    console.log('Réponse:', guess, '| Attendu:', selectedAnime.name);

    // Recherche avec Fuse.js
    const results = fuse.search(guess);
    const isCorrect = results.length > 0 && results[0].item.name === selectedAnime.name;

    if (isCorrect) {
        handleCorrectGuess();
    } else {
        handleWrongGuess();
    }

    guessInput.value = '';
}

function handleCorrectGuess() {
    console.log('Bonne réponse!');

    foundAnimes.push(selectedAnime.name);
    markAnimeAsFound(selectedAnime);

    playSound('correct');
    closeModal();

    saveGameState();
    updateUI();

    // Vérifier la victoire
    if (foundAnimes.length === animeData.length) {
        showVictory();
    }
}

function handleWrongGuess() {
    console.log('Mauvaise réponse!');

    lives--;
    playSound('wrong');

    const livesElement = document.getElementById('lives');
    if (livesElement) {
        livesElement.classList.add('shake');
        setTimeout(() => livesElement.classList.remove('shake'), 500);
    }

    saveGameState();
    updateUI();

    if (lives <= 0) {
        closeModal();
        setTimeout(showGameOver, 500);
    }
}

function markAnimeAsFound(anime) {
    // Créer un overlay vert sur la zone
    const wallContainer = document.getElementById('wall-container');
    const wallImage = document.getElementById('wall-image');

    if (!wallContainer || !wallImage) return;

    const rect = wallImage.getBoundingClientRect();
    const containerRect = wallContainer.getBoundingClientRect();

    const scaleX = rect.width / wallImage.naturalWidth;
    const scaleY = rect.height / wallImage.naturalHeight;

    const overlay = document.createElement('div');
    overlay.className = 'found-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = (anime.x1 * scaleX) + 'px';
    overlay.style.top = (anime.y1 * scaleY) + 'px';
    overlay.style.width = ((anime.x2 - anime.x1) * scaleX) + 'px';
    overlay.style.height = ((anime.y2 - anime.y1) * scaleY) + 'px';
    overlay.style.background = 'rgba(0, 255, 0, 0.3)';
    overlay.style.border = '2px solid lime';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10';

    wallContainer.appendChild(overlay);
}

// 
// INTERFACE UTILISATEUR
// 

function updateUI() {
    // Vies
    const livesElement = document.getElementById('lives');
    if (livesElement) {
        livesElement.textContent = '❤️'.repeat(Math.max(0, lives));
    }

    // Score
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = foundAnimes.length;
    }

    // Progression
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    const progress = (foundAnimes.length / animeData.length) * 100;

    if (progressBar) {
        progressBar.style.width = progress + '%';
    }

    if (progressText) {
        progressText.textContent = Math.round(progress) + '%';
    }

    // Total
    const totalElement = document.getElementById('total');
    if (totalElement) {
        totalElement.textContent = animeData.length;
    }
}

// 
// MODAL
// 

function openModal() {
    const modal = document.getElementById('guess-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal() {
    const modal = document.getElementById('guess-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedAnime = null;
}

// 
// VICTOIRE ET GAME OVER
// 

function showVictory() {
    closeModal();

    const elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);

    const completionTime = document.getElementById('completion-time');
    if (completionTime) {
        completionTime.textContent = 'Temps: ' + minutes + 'min ' + seconds + 's';
    }

    const finalScore = document.getElementById('final-score');
    if (finalScore) {
        finalScore.textContent = foundAnimes.length + ' / ' + animeData.length;
    }

    const victoryModal = document.getElementById('victory-modal');
    if (victoryModal) {
        victoryModal.style.display = 'flex';
    }

    playSound('victory');
    createConfetti();

    // Nettoyer le localStorage
    localStorage.removeItem('animeTheWall_found');
    localStorage.removeItem('animeTheWall_lives');
    localStorage.removeItem('animeTheWall_startTime');
}

function showGameOver() {
    const gameOverModal = document.getElementById('gameover-modal');
    if (gameOverModal) {
        gameOverModal.style.display = 'flex';
    }

    const gameOverScore = document.getElementById('gameover-score');
    if (gameOverScore) {
        gameOverScore.textContent = foundAnimes.length + ' / ' + animeData.length;
    }

    playSound('gameover');
}

// 
// SAUVEGARDE
// 

function saveGameState() {
    localStorage.setItem('animeTheWall_lives', lives.toString());
    localStorage.setItem('animeTheWall_found', JSON.stringify(foundAnimes));
    localStorage.setItem('animeTheWall_startTime', startTime.toString());
}

function resetGame() {
    localStorage.removeItem('animeTheWall_found');
    localStorage.removeItem('animeTheWall_lives');
    localStorage.removeItem('animeTheWall_startTime');

    location.reload();
}

// 
// SONS
// 

function playSound(type) {
    const audio = document.getElementById('sound-' + type);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play error:', e));
    }
}

// 
// PARTAGE
// 

function shareScore() {
    const text = 'J\'ai trouvé ' + foundAnimes.length + '/' + animeData.length + ' animes sur Anime The Wall! 🎮';

    if (navigator.share) {
        navigator.share({
            title: 'Anime The Wall',
            text: text,
            url: window.location.href
        }).catch(e => console.log('Share error:', e));
    } else {
        // Copier dans le presse-papier
        navigator.clipboard.writeText(text + ' ' + window.location.href)
            .then(() => alert('Score copié dans le presse-papier!'))
            .catch(e => console.log('Copy error:', e));
    }
}

// 
// CONFETTI
// 

function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.opacity = '1';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';

            document.body.appendChild(confetti);

            const duration = 3000 + Math.random() * 2000;
            const startTime = Date.now();

            function animate() {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;

                if (progress < 1) {
                    confetti.style.top = (progress * window.innerHeight) + 'px';
                    confetti.style.opacity = (1 - progress).toString();
                    requestAnimationFrame(animate);
                } else {
                    confetti.remove();
                }
            }

            animate();
        }, i * 30);
    }
}

console.log('Game.js chargé');
