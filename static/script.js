// === 1. GLOBAL STATE & CONSTANTS ===
const gameState = {
    hand: [],
    selectedOrder: [],
    drawSource: null,
    currentPlayer: "",
    pileTop: "🂠",
    allPlayers: [],
    autoRefreshTimer: null,
    playerName: "",
    roundEnded: false,
    readyPlayers: new Set(),
    previousRoundEnded: false,
    lastPlayed: [],
    lastLoggedActionId: sessionStorage.getItem("lastLoggedActionId") || "",
    actionLog: []
};

const PLAYER_COLORS = ["#8fd4ff", "#ffadad", "#ffe083", "#afffaf", "#d1aaff"];
const savedLog = sessionStorage.getItem("actionLog");
if (savedLog) {
    try {
        gameState.actionLog = JSON.parse(savedLog);
    } catch (e) {
    }
}

// === 2. DOM REFERENCES ===
const DOM = {
    playBtn: document.getElementById("play-selected"),
    endGameBtn: document.getElementById("end-game"),
    endBtn: document.getElementById("end-round"),
    deckEl: document.getElementById("deck"),
    pileEl: document.getElementById("pile"),
    turnIndicator: document.getElementById("turn-indicator"),
    logEntry: document.getElementById("log-panel"),
    centerTable: document.getElementById("center-table"),
    playerArea: document.getElementById("player-area")
};

// === 3. UTILITY FUNCTIONS ===
function createPlayingCardElement(cardCode) {
    if (cardCode.startsWith("JOKER")) {
        const suit = cardCode.slice(-1);
        const el = document.createElement("div");
        el.classList.add("card", "joker-card");
        el.setAttribute("data-joker", suit);
        el.innerHTML = `<div class="joker-face">JOKER${suit}</div>`;
        return el;
    }

    const rankMap = {
        A: "Ace", J: "Jack", Q: "Queen", K: "King",
        "10": "10", "9": "9", "8": "8", "7": "7",
        "6": "6", "5": "5", "4": "4", "3": "3", "2": "2"
    };
    const suitMap = {
        "♠": "Spades", "♥": "Hearts", "♦": "Diamonds", "♣": "Clubs"
    };

    let rank = "", suit = "";
    if (cardCode.startsWith("10")) {
        rank = "10";
        suit = cardCode[2];
    } else {
        rank = cardCode[0];
        suit = cardCode[1];
    }

    const el = document.createElement("playing-card");
    el.classList.add("card");
    el.setAttribute("rank", rankMap[rank] || rank);
    el.setAttribute("suit", suitMap[suit] || suit);
    return el;
}

function calculateOverlapOffset(count, offset = 30) {
    return count === 1 ? "0vw" : `-${0.5 * 5.5 * (count - 1) * (offset / 100)}vw`;
}

function getPlayerColor(name) {
    const idx = gameState.allPlayers.indexOf(name);
    return PLAYER_COLORS[idx % PLAYER_COLORS.length];
}

function clearSessionLog() {
    sessionStorage.removeItem("actionLog");
    sessionStorage.removeItem("lastLoggedActionId");
    gameState.actionLog = [];
    gameState.lastLoggedActionId = "";
}

function enterFullscreen() {
    if (!document.fullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
}

document.addEventListener("fullscreenchange", () => {
    const btn = document.getElementById("fullscreen-btn");
    if (btn) {
        const isFull = !!document.fullscreenElement;
        btn.textContent = isFull ? "⛶" : "⛶";
    }
});

async function quitGameAndRedirect() {
    const code = sessionStorage.getItem("roomCode");
    if (!code) return;

    const res = await fetch(`/delete-room/${code}`, {method: "POST"});
    if (res.redirected) {
        clearSessionLog();
        window.location.href = res.url;
    }
}


// === 4. DISPLAY UPDATE FUNCTIONS ===
function updatePileDisplay() {
    DOM.pileEl.innerHTML = "";
    const cards = gameState.lastPlayed;

    if (Array.isArray(cards) && cards.length > 0) {
        const row = document.createElement("div");
        row.classList.add("pile-card-stack");
        row.style.left = calculateOverlapOffset(cards.length);

        cards.forEach((card, i) => {
            const cardEl = createPlayingCardElement(card);
            cardEl.classList.add("card", "played-pile-card");
            cardEl.style.position = "absolute";
            cardEl.style.left = `${i * 30}%`;
            cardEl.style.zIndex = i;

            if (i === cards.length - 1) {
                cardEl.classList.add("top-played");
                if (gameState.drawSource === "pile") {
                    cardEl.classList.add("draw-selected");
                }
                cardEl.onclick = () => {
                    document.querySelectorAll(".draw-selected").forEach(el => el.classList.remove("draw-selected"));
                    cardEl.classList.add("draw-selected");
                    gameState.drawSource = "pile";
                };
            }

            row.appendChild(cardEl);
        });

        DOM.pileEl.appendChild(row);
    } else {
        const isFaceDown = !gameState.pileTop || gameState.pileTop === "🂠";
        const card = isFaceDown ? document.createElement("playing-card") : createPlayingCardElement(gameState.pileTop);
        card.classList.add("card");
        if (isFaceDown) card.setAttribute("cid", "back");
        if (gameState.drawSource === "pile") card.classList.add("draw-selected");
        DOM.pileEl.appendChild(card);
    }
}

function updateDeckDisplay() {
    DOM.deckEl.innerHTML = "";
    const back = document.createElement("playing-card");
    back.setAttribute("cid", "back");
    back.classList.add("card");
    if (gameState.drawSource === "deck") back.classList.add("draw-selected");
    DOM.deckEl.appendChild(back);
}

function updateTurnIndicator() {
    if (DOM.turnIndicator) {
        DOM.turnIndicator.textContent = `Turn: ${gameState.currentPlayer}`;
    }
}

function enforceTurnLock(handValue = null, roundEnded = false) {
    const isYourTurn = gameState.playerName === gameState.currentPlayer;
    DOM.playBtn.disabled = !isYourTurn || roundEnded;
    DOM.endBtn.disabled = roundEnded ? false : (!isYourTurn || (handValue !== null && handValue > 5));
    DOM.endBtn.textContent = "Finish";

    DOM.deckEl.style.pointerEvents = isYourTurn && !roundEnded ? "auto" : "none";
    DOM.pileEl.style.pointerEvents = isYourTurn && !roundEnded ? "auto" : "none";

    document.querySelectorAll(".player-hand .card, .player-hand .joker-card, playing-card")
        .forEach(card => {
            card.style.pointerEvents = isYourTurn ? "auto" : "none";
        });
}

// === 5. RENDERING FUNCTIONS ===
function renderTable(players, scores = {}) {
    DOM.centerTable.querySelectorAll(".opponent-box").forEach(el => el.remove());
    DOM.playerArea.innerHTML = "";

    const youIndex = players.findIndex(p => p.name === gameState.playerName);
    const rotated = [...players.slice(youIndex + 1), ...players.slice(0, youIndex)];
    const you = players[youIndex];
    const seatMap = ["left", "right", "top"];

    rotated.forEach((player, idx) => {
        if (idx >= 3) return;
        const container = document.createElement("div");
        container.classList.add("opponent-box", seatMap[idx]);

        const nameLabel = document.createElement("div");
        nameLabel.classList.add("player-label");
        const score = scores[player.name] ?? 0;
        nameLabel.textContent = `${player.name} (${score})`;
        if (player.name === gameState.currentPlayer) {
            nameLabel.classList.add("current-turn");
        }

        const handBox = document.createElement("div");
        handBox.classList.add("opponent-hand-box");
        const handDiv = document.createElement("div");
        handDiv.classList.add("opponent-hand");
        for (let j = 0; j < player.hand; j++) {
            const back = document.createElement("div");
            back.classList.add("card-back");
            handDiv.appendChild(back);
        }
        handBox.appendChild(handDiv);
        container.appendChild(handBox);
        container.appendChild(nameLabel);
        DOM.centerTable.appendChild(container);
    });

    if (you && Array.isArray(you.hand)) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("player-hand-wrapper");

        const label = document.createElement("div");
        if (you.name === gameState.currentPlayer) label.classList.add("current-turn");
        label.classList.add("player-label");
        label.textContent = `${you.name} (${you.score ?? 0})`;

        const handBox = document.createElement("div");
        handBox.classList.add("hand-box");
        const handDiv = document.createElement("div");
        handDiv.classList.add("player-hand");

        you.hand.forEach((card, idx) => {
            const cardEl = createPlayingCardElement(card);
            cardEl.dataset.index = idx;
            if (gameState.selectedOrder.includes(idx)) {
                cardEl.classList.add("selected");
                cardEl.setAttribute("data-order", gameState.selectedOrder.indexOf(idx) + 1);
            }
            handDiv.appendChild(cardEl);
        });

        handBox.appendChild(handDiv);
        wrapper.appendChild(label);
        wrapper.appendChild(handBox);
        DOM.playerArea.appendChild(wrapper);
    }
}

function renderLog(logData) {
    DOM.logEntry.innerHTML = "";
    logData.forEach(entry => {
        const div = document.createElement("div");
        div.classList.add("log-entry");

        const name = document.createElement("span");
        name.classList.add("name");
        name.style.color = entry.color;
        name.textContent = `${entry.player} (${entry.score})`;
        div.appendChild(name);

        entry.logItems?.forEach(item => {
            const container = document.createElement("div");
            container.classList.add("action-line");

            const label = document.createElement("div");
            label.textContent = item.type + ":";

            const wrapper = document.createElement("div");
            wrapper.classList.add("card-scale-container", "log-card-scale-container");

            const row = document.createElement("div");
            row.classList.add("card-row");

            item.cards.forEach(cardStr => {
                const cardEl = createPlayingCardElement(cardStr);
                row.appendChild(cardEl);
            });

            wrapper.appendChild(row);
            container.appendChild(label);
            container.appendChild(wrapper);
            div.appendChild(container);
        });

        DOM.logEntry.prepend(div);
    });
}

// === 6. POPUP BUILDERS ===
function renderRoundSummaryPopup(data) {
    if (!data.roundSummaryPopup || document.getElementById("round-popup")) {
        console.warn("⚠️ No roundSummaryPopup or popup already shown");
        return;
    }

    const popup = document.createElement("div");
    popup.id = "round-popup";
    popup.classList.add("round-popup");

    const content = document.createElement("div");
    content.classList.add("popup-content");
    content.innerHTML = data.roundSummaryPopup;

    const isGameOver = data.gameOver;
    const initialIsReady = Array.isArray(data.readyPlayers) && data.readyPlayers.includes(gameState.playerName);

    // === Ready Button ===
    const readyBtn = document.createElement("button");
    readyBtn.classList.add("popup-close");
    readyBtn.textContent = isGameOver
        ? (initialIsReady ? "Cancel New Game" : "Ready for New Game")
        : (initialIsReady ? "Cancel Ready" : "I'm Ready");

    readyBtn.onclick = async () => {
        const res = await fetch("/ready-next-round", {method: "POST"});
        const result = await res.json();

        if (!result.ready || !Array.isArray(result.ready)) return;

        const newReady = result.ready.includes(gameState.playerName);
        readyBtn.textContent = isGameOver
            ? (newReady ? "Cancel New Game" : "Ready for New Game")
            : (newReady ? "Cancel Ready" : "I'm Ready");

        if (result.all_ready) {
            document.getElementById("round-popup")?.remove();
            clearSessionLog();
            DOM.logEntry.innerHTML = "";
            await loadState();
        }
    };

    content.appendChild(readyBtn);

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "4vw";
    buttonContainer.style.marginTop = "1vw";

    buttonContainer.appendChild(readyBtn);

    const quitBtn = document.createElement("button");
    quitBtn.classList.add("popup-close", "end-game");
    quitBtn.textContent = "Quit";
    quitBtn.onclick = () => {
        quitGameAndRedirect();
    };
    buttonContainer.appendChild(quitBtn);

    content.appendChild(buttonContainer);

    popup.appendChild(content);
    document.body.appendChild(popup);
}


function renderGameOverNotice(data) {
    if (data.gameOver && !data.gameOverNotice) {
        // console.warn("Game over but no gameOverNotice present.");
        return
    }

    if (!data.gameOverNotice || document.getElementById("mini-popup")) return;

    const miniPopup = document.createElement("div");
    miniPopup.id = "mini-popup";
    miniPopup.classList.add("round-popup");

    const content = document.createElement("div");
    content.classList.add("popup-content", "mini-popup");
    content.innerHTML = data.gameOverNotice;

    miniPopup.appendChild(content);
    document.body.appendChild(miniPopup);

    const okBtn = content.querySelector("#game-over-ok");
    if (okBtn) {
        okBtn.addEventListener("click", () => {
            miniPopup.remove();
        });
    }
}

// === 7. STATE LOADER ===
async function loadState() {
    const res = await fetch("/state");
    const data = await res.json();

    if (data.error === "Room closed" || data.error === "Invalid session") {
        sessionStorage.clear();
        window.location.href = "/";
        return;
    }


    const state = gameState;
    const popup = document.getElementById("round-popup");
    state.roundEnded = data.roundEnded === true;
    const roundJustRestarted = state.previousRoundEnded && !state.roundEnded;
    state.previousRoundEnded = state.roundEnded;

    if (popup && !state.roundEnded) {
        popup.remove();
        state.lastPlayed = [];
    }

    state.readyPlayers = new Set(data.readyPlayers || []);
    state.pileTop = data.pileTop;

    if (state.roundEnded && !roundJustRestarted && data.roundSummaryPopup && !document.getElementById("round-popup")) {
        renderRoundSummaryPopup(data);
    }

    renderGameOverNotice(data);

    const current = data.players.find(p => Array.isArray(p.hand));
    state.playerName = current.name;
    state.currentPlayer = data.currentPlayer;
    state.allPlayers = data.players.map(p => p.name);
    state.hand = current.hand || [];

    if (roundJustRestarted) {
        state.lastPlayed = [];
        clearSessionLog();
        updatePileDisplay();
    }

    const action = data.lastAction;
    if (action && JSON.stringify(action) !== state.lastLoggedActionId) {
        state.lastLoggedActionId = JSON.stringify(action);
        sessionStorage.setItem("lastLoggedActionId", state.lastLoggedActionId);

        const logEntry = {
            player: action.player,
            score: data.players.find(p => p.name === action.player)?.score ?? 0,
            color: getPlayerColor(action.player),
            logItems: []
        };

        if (action.played?.length) {
            logEntry.logItems.push({type: "played", cards: action.played});
        }

        if (action.draw_source === "pile") {
            logEntry.logItems.push({type: "drew", cards: [action.drawn_card]});
        } else if (action.draw_source === "deck") {
            const visible = action.player === state.playerName ? action.drawn_card : "🂠";
            logEntry.logItems.push({type: "drew", cards: [visible]});
        }

        state.actionLog.push(logEntry);
        if (state.actionLog.length > 5) state.actionLog.shift();
        sessionStorage.setItem("actionLog", JSON.stringify(state.actionLog));
    }

    if (action && !roundJustRestarted) {
        state.lastPlayed = action.played || [];
    }

    renderLog(state.actionLog);
    updatePileDisplay();
    renderTable(data.players, data.scores);
    updateDeckDisplay();
    updateTurnIndicator();
    enforceTurnLock(current.hand_value, state.roundEnded);
}

// === 8. EVENT LISTENERS ===
function setupEventListeners() {
    DOM.playBtn.addEventListener("click", async () => {
        if (!gameState.drawSource) return alert("Choose draw source.");
        if (gameState.selectedOrder.length === 0) return alert("Select cards to play.");

        const selectedCards = gameState.selectedOrder.map(idx => gameState.hand[idx]);
        const res = await fetch("/play", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({cards: selectedCards, draw: gameState.drawSource})
        });

        const result = await res.json();
        if (!res.ok) {
            gameState.selectedOrder = [];
            gameState.drawSource = null;
            return alert(result.error || "Invalid move.");
        }

        gameState.selectedOrder = [];
        gameState.drawSource = null;
        await loadState();
    });

    DOM.endBtn.addEventListener("click", async () => {
        const res = await fetch("/end-round", {
            method: "POST",
            headers: {"Content-Type": "application/json"}
        });

        if (!res.ok) return alert("Could not end round.");

        gameState.selectedOrder = [];
        gameState.drawSource = null;
        clearSessionLog();

        await loadState();
    });

    DOM.endGameBtn?.addEventListener("click", async () => {
        const confirmEnd = confirm("Are you sure you want to end the game for everyone?");
        if (!confirmEnd) return;
        quitGameAndRedirect();
    });

    document.addEventListener("mousedown", (e) => {
        const card = e.target.closest(".joker-card, playing-card");
        if (card?.dataset.index !== undefined && e.button === 0) {
            const idx = parseInt(card.dataset.index);
            const i = gameState.selectedOrder.indexOf(idx);
            if (i !== -1) {
                gameState.selectedOrder.splice(i, 1);
            } else {
                gameState.selectedOrder.push(idx);
            }
            loadState()
            e.preventDefault();
        }
    });

    DOM.deckEl.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        gameState.drawSource = gameState.drawSource === "deck" ? null : "deck";
        updateDeckDisplay();
        updatePileDisplay();
        e.preventDefault();
    });

    DOM.pileEl.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        gameState.drawSource = gameState.drawSource === "pile" ? null : "pile";
        updateDeckDisplay();
        updatePileDisplay();
        e.preventDefault();
    });

    document.addEventListener("dragstart", e => e.preventDefault());
    document.addEventListener("selectstart", e => e.preventDefault());
}

// === 9. INITIALIZE ===
function startAutoRefresh() {
    gameState.autoRefreshTimer = setInterval(loadState, 500);
}

loadState();
setupEventListeners();
startAutoRefresh();
