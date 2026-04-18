

// -- State --
let friends = [];
let isSpinning = false;
let spinHistory = [];
let currentRotation = 0;

// Wheel color palette (rich, vibrant)
const WHEEL_COLORS = [
    '#7c3aed', '#a855f7', '#6366f1', '#3b82f6',
    '#0ea5e9', '#14b8a6', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'
];

// -- Init --
document.addEventListener('DOMContentLoaded', () => {
    // Parse friends from DOM
    const items = document.querySelectorAll('.friend-item');
    items.forEach(item => {
        friends.push(item.dataset.name);
    });

    drawWheel();
    createBackgroundParticles();
});

// -- Background Particles --
function createBackgroundParticles() {
    const container = document.getElementById('bgParticles');
    const particleCount = 25;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 10;
        const hue = Math.random() > 0.5 ? '260' : '45';
        const opacity = Math.random() * 0.4 + 0.1;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.background = `hsla(${hue}, 80%, 70%, ${opacity})`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;

        container.appendChild(particle);
    }
}

// -- Draw Wheel --
function drawWheel() {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, size, size);

    if (friends.length === 0) {
        // Empty wheel
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a3e';
        ctx.fill();
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#6a6a9a';
        ctx.font = '500 16px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Add friends to spin!', center, center);
        return;
    }

    const sliceAngle = (2 * Math.PI) / friends.length;

    friends.forEach((friend, i) => {
        const startAngle = i * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        // Draw slice
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();

        const color = WHEEL_COLORS[i % WHEEL_COLORS.length];
        ctx.fillStyle = color;
        ctx.fill();

        // Slice border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(startAngle + sliceAngle / 2);

        ctx.fillStyle = '#ffffff';
        ctx.font = `600 ${friends.length > 8 ? 11 : 14}px Outfit`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textRadius = radius * 0.62;
        ctx.fillText(friend, textRadius, 0);

        ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a1a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Outer ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();
}

// -- Spin Wheel --
function spinWheel() {
    if (isSpinning || friends.length === 0) return;

    isSpinning = true;
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;

    // Hide previous result
    document.getElementById('resultSection').classList.add('hidden');

    // Call Flask API
    fetch('/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friends: friends })
    })
    .then(res => res.json())
    .then(data => {
        const chosenIndex = friends.indexOf(data.chosen);
        animateWheel(chosenIndex, data.chosen);
    })
    .catch(err => {
        console.error('Spin error:', err);
        isSpinning = false;
        spinBtn.disabled = false;
    });
}

function animateWheel(chosenIndex, chosenName) {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const sliceAngle = (2 * Math.PI) / friends.length;

    // Calculate target rotation so the chosen slice lands under the top pointer
    // The pointer is at the top (270° / -90° / -π/2)
    const sliceMiddle = chosenIndex * sliceAngle + sliceAngle / 2;
    // We want sliceMiddle + totalRotation ≡ 3π/2 (mod 2π) for the top pointer
    const targetSliceAngle = (3 * Math.PI / 2) - sliceMiddle;
    const extraSpins = Math.floor(Math.random() * 3 + 5) * 2 * Math.PI; // 5-7 full rotations
    const totalRotation = currentRotation + extraSpins + targetSliceAngle - (currentRotation % (2 * Math.PI));

    const duration = 4000;
    const startTime = performance.now();
    const startRotation = currentRotation;

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);

        currentRotation = startRotation + (totalRotation - startRotation) * eased;

        // Redraw with rotation
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(currentRotation);
        ctx.translate(-center, -center);

        // Draw slices
        friends.forEach((friend, i) => {
            const startAngle = i * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.fillStyle = '#ffffff';
            ctx.font = `600 ${friends.length > 8 ? 11 : 14}px Outfit`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(friend, radius * 0.62, 0);
            ctx.restore();
        });

        // Center
        ctx.beginPath();
        ctx.arc(center, center, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a1a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Outer ring
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.restore();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Done spinning
            showResult(chosenName);
        }
    }

    requestAnimationFrame(animate);
}

function showResult(name) {
    const resultSection = document.getElementById('resultSection');
    const resultName = document.getElementById('resultName');

    resultName.textContent = name;
    resultSection.classList.remove('hidden');

    // Highlight the friend in the list
    document.querySelectorAll('.friend-item').forEach(item => {
        item.classList.remove('highlight');
        if (item.dataset.name === name) {
            item.classList.add('highlight');
        }
    });

    // Spawn confetti
    spawnConfetti();

    // Add to history
    addToHistory(name);

    // Re-enable button
    isSpinning = false;
    document.getElementById('spinBtn').disabled = false;
}

// -- Confetti --
function spawnConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';

    const colors = ['#fbbf24', '#7c3aed', '#a855f7', '#f43f5e', '#10b981', '#3b82f6', '#ec4899', '#06b6d4'];
    const count = 60;

    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.classList.add('confetti-piece');
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.top = `${Math.random() * 30}%`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = `${Math.random() * 0.5}s`;
        piece.style.animationDuration = `${Math.random() * 1.5 + 1.5}s`;
        piece.style.width = `${Math.random() * 8 + 4}px`;
        piece.style.height = `${Math.random() * 8 + 4}px`;
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(piece);
    }
}

// -- History --
function addToHistory(name) {
    spinHistory.unshift({
        name: name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('historyList');

    if (spinHistory.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No spins yet. Give it a go!</p>';
        return;
    }

    historyList.innerHTML = spinHistory.map((entry, i) => `
        <div class="history-item">
            <div class="history-number">${spinHistory.length - i}</div>
            <span class="history-name">${entry.name}</span>
            <span class="history-time">${entry.time}</span>
        </div>
    `).join('');
}

// -- Add Friend --
function addFriend() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'addModal';
    overlay.innerHTML = `
        <div class="modal-card">
            <h4 class="modal-title">Add a Friend</h4>
            <input class="modal-input" id="friendInput" type="text"
                   placeholder="Enter name..." maxlength="20" autocomplete="off" autofocus>
            <div class="modal-actions">
                <button class="modal-btn cancel" onclick="closeModal()">Cancel</button>
                <button class="modal-btn confirm" onclick="confirmAddFriend()">Add</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Focus input
    setTimeout(() => {
        const input = document.getElementById('friendInput');
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmAddFriend();
            if (e.key === 'Escape') closeModal();
        });
    }, 100);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

function confirmAddFriend() {
    const input = document.getElementById('friendInput');
    const name = input.value.trim().toUpperCase();

    if (!name) return;
    if (friends.includes(name)) {
        input.style.borderColor = '#f43f5e';
        input.value = '';
        input.placeholder = 'Name already exists!';
        return;
    }

    friends.push(name);
    renderFriendsList();
    drawWheel();
    closeModal();
}

function closeModal() {
    const modal = document.getElementById('addModal');
    if (modal) modal.remove();
}

// -- Remove Friend --
function removeFriend(btn) {
    const item = btn.closest('.friend-item');
    const name = item.dataset.name;

    item.style.transform = 'translateX(40px)';
    item.style.opacity = '0';

    setTimeout(() => {
        friends = friends.filter(f => f !== name);
        renderFriendsList();
        drawWheel();
    }, 200);
}

// -- Render Friends List --
function renderFriendsList() {
    const list = document.getElementById('friendsList');
    list.innerHTML = friends.map(name => `
        <li class="friend-item" data-name="${name}">
            <div class="friend-avatar">${name[0]}</div>
            <span class="friend-name">${name}</span>
            <button class="remove-btn" onclick="removeFriend(this)" title="Remove">✕</button>
        </li>
    `).join('');
}
