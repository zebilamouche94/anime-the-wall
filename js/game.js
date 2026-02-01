let lives = 3;
let currentAnime = null;
let startTime = Date.now();
let gameStarted = false;
let fuse;
let foundAnimes = JSON.parse(localStorage.getItem('animeTheWall_found') || '[]');
let savedLives = parseInt(localStorage.getItem('animeTheWall_lives') || '3');
let savedStartTime = parseInt(localStorage.getItem('animeTheWall_startTime') || Date.now());

lives = savedLives;
startTime = savedStartTime;

function init() {
    if (typeof animeData === 'undefined') {
        console.error('❌ animeData non défini');
        return;
    }
    
    fuse = new Fuse(animeData, {
        keys: ['title', 'synonyms'],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2
    });
    
    renderGrid();
    updateStats();
    setupEventListeners();
    
    if (foundAnimes.length > 0 || lives < 3) {
        startGame();
    } else {
        showStartScreen();
    }
}

function showStartScreen() {
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.onclick = function() {
            const startScreen = document.getElementById('start-screen');
            startScreen.classList.add('hidden');
            setTimeout(() => {
                startScreen.style.display = 'none';
                startGame();
            }, 600);
        };
    }
}

function startGame() {
    gameStarted = true;
    document.getElementById('hud').classList.add('visible');
    document.getElementById('progress-container').classList.add('visible');
    document.getElementById('progress-text').classList.add('visible');
    document.getElementById('instructions').classList.add('visible');
    setTimeout(initPanzoom, 300);
    if (foundAnimes.length === 0) {
        startTime = Date.now();
        localStorage.setItem('animeTheWall_startTime', startTime);
    }
}

function renderGrid() {
    const grid = document.getElementById('poster-grid');
    grid.innerHTML = '';
    const containerWidth = 5000;
    const containerHeight = 4000;
    const fragmentSize = 200;
    
    animeData.forEach((anime, index) => {
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.dataset.id = anime.id;
        if (foundAnimes.includes(anime.id)) card.classList.add('found');
        
        const cols = Math.floor(containerWidth / (fragmentSize * 0.65));
        const col = index % cols;
        const row = Math.floor(index / cols);
        const baseX = col * (fragmentSize * 0.65);
        const baseY = row * fragmentSize;
        const randomX = (Math.random() - 0.5) * 120;
        const randomY = (Math.random() - 0.5) * 120;
        const x = Math.max(0, Math.min(containerWidth - fragmentSize, baseX + randomX));
        const y = Math.max(0, Math.min(containerHeight - fragmentSize, baseY + randomY));
        const rotation = (Math.random() - 0.5) * 40;
        const zIndex = Math.floor(Math.random() * 66);
        
        card.style.left = `${x}px`;
        card.style.top = `${y}px`;
        card.style.transform = `rotate(${rotation}deg)`;
        card.style.zIndex = zIndex;
        card.style.width = `${fragmentSize}px`;
        card.style.height = `${fragmentSize}px`;
        
        const img = document.createElement('img');
        img.src = `assets/posters/${anime.poster}`;
        img.alt = `Affiche ${anime.id}`;
        img.loading = 'lazy';
        const cropX = 15 + Math.random() * 50;
        const cropY = 30 + Math.random() * 30;
        img.style.width = '400%';
        img.style.height = '400%';
        img.style.objectFit = 'cover';
        img.style.objectPosition = `${cropX}% ${cropY}%`;
        
        card.appendChild(img);
        card.onclick = () => openModal(anime);
        grid.appendChild(card);
    });
}

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
            startScale: 0.9
        });
        container.addEventListener('wheel', (e) => {
            if (!e.target.closest('.poster-card')) {
                e.preventDefault();
                panzoom.zoomWithWheel(e);
            }
        });
    }
}

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
    if (card) card.classList.add('found');
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
    document.getElementById('error-msg').classList.remove('hidden');
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('shake');
        setTimeout(() => modalContent.classList.remove('shake'), 400);
    }
    playSound('wrong');
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-input').focus();
    if (lives === 0) setTimeout(showGameOver, 500);
}

function updateStats() {
    document.getElementById('score').textContent = foundAnimes.length;
    document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, lives));
    const progress = (foundAnimes.length / animeData.length) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
    document.getElementById('progress-text').textContent = Math.round(progress) + '%';
}

function showVictory() {
    closeModal();
    const elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    document.getElementById('completion-time').textContent = `Temps : ${minutes}min ${seconds}s`;
    document.getElementById('victory-modal').classList.remove('hidden');
    playSound('victory');
    if (typeof confetti !== 'undefined') {
        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({particleCount: 7, angle: 60, spread: 55, origin: {x: 0}, colors: ['#ff6b6b', '#51cf66', '#667eea', '#ffd93d']});
            confetti({particleCount: 7, angle: 120, spread: 55, origin: {x: 1}, colors: ['#ff6b6b', '#51cf66', '#667eea', '#ffd93d']});
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}

function showGameOver() {
    closeModal();
    document.getElementById('final-score').textContent = foundAnimes.length;
    document.getElementById('gameover-modal').classList.remove('hidden');
}

function resetGame() {
    if (foundAnimes.length > 0 && lives > 0) {
        if (!confirm('Recommencer ? (progression effacée)')) return;
    }
    localStorage.removeItem('animeTheWall_found');
    localStorage.removeItem('animeTheWall_lives');
    localStorage.removeItem('animeTheWall_startTime');
    foundAnimes = [];
    lives = 3;
    startTime = Date.now();
    gameStarted = false;
    renderGrid
();
    updateStats();
    closeModal();
    document.getElementById('victory-modal').classList.add('hidden');
    document.getElementById('gameover-modal').classList.add('hidden');
    document.getElementById('hud').classList.remove('visible');
    document.getElementById('progress-container').classList.remove('visible');
    document.getElementById('progress-text').classList.remove('visible');
    document.getElementById('instructions').classList.remove('visible');
    const startScreen = document.getElementById('start-screen');
    startScreen.style.display = 'flex';
    startScreen.classList.remove('hidden');
    showStartScreen();
}

function shareScore() {
    const text = `J'ai trouvé les 66 animes sur Anime The Wall ! 🎌\nPeux-tu faire mieux ?\n\n`;
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({title: 'Anime The Wall', text: text, url: url});
    } else {
        navigator.clipboard.writeText(text + url);
        alert('Lien copié !');
    }
}

function playSound(type) {
    try {
        const audio = new Audio(`assets/sounds/${type}.wav`);
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (e) {}
}

function setupEventListeners() {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.onclick = validateAnswer;
    
    const guessInput = document.getElementById('guess-input');
    if (guessInput) {
        guessInput.onkeypress = (e) => {
            if (e.key === 'Enter') validateAnswer();
        };
    }
    
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) closeModalBtn.onclick = closeModal;
    
    const modalBackdrop = document.querySelector('#modal .modal-backdrop');
    if (modalBackdrop) modalBackdrop.onclick = closeModal;
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.onclick = resetGame;
    
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.onclick = resetGame;
    
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) retryBtn.onclick = resetGame;
    
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.onclick = shareScore;
    
    document.onkeydown = (e) => {
        if (e.key === 'Escape') closeModal();
    };
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.onclick = () => {
            document.body.classList.toggle('light-theme');
            themeToggle.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
            localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        };
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.textContent = '☀️';
        }
    }
}

init();
