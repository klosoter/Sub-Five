// === 1. GLOBAL STATE & CONSTANTS ===
const gameState = {
    hand: [],
    selectedOrder: [],
    drawSource: null,
    finishThreshold: 5,   // admin-configurable; kept in sync from /state
    hostName: null,
    isHost: false,
    turnElapsed: 0,       // seconds the current player has held the turn
    turnWarnAt: 30,       // show the warning countdown from here
    turnTimeout: 90,      // auto-removed at this point
    currentPlayer: "",
    pileTop: "🂠",
    allPlayers: [],
    autoRefreshTimer: null,
    playerName: "",
    roundEnded: false,
    readyPlayers: new Set(),
    previousRoundEnded: false,
    lastPlayed: [],
    moveInFlight: false,      // a /play or /end-round request is pending
    navigatingAway: false,    // a leave/end-game navigation has been triggered
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

// The "Play" glow: lit when it's your turn with a full move queued up. Cheap DOM
// toggle, safe to call on every local interaction.
function updateReadyPulse() {
    const isYourTurn = gameState.playerName === gameState.currentPlayer;
    DOM.playBtn.classList.toggle(
        "ready-pulse",
        isYourTurn && !gameState.roundEnded && gameState.selectedOrder.length > 0 && !!gameState.drawSource
    );
}

// Re-apply the selected highlight/order to the hand IN PLACE — no /state fetch. This
// keeps select/deselect instant even on slow connections. The 500ms poll stays the
// source of truth for hands/turns; card selection is pure client state layered on top.
function renderSelection() {
    document.querySelectorAll(".player-hand [data-index]").forEach(card => {
        const idx = parseInt(card.dataset.index, 10);
        const order = gameState.selectedOrder.indexOf(idx);
        if (order !== -1) {
            card.classList.add("selected");
            card.setAttribute("data-order", order + 1);
        } else {
            card.classList.remove("selected");
            card.removeAttribute("data-order");
        }
    });
    updateReadyPulse();
}

// Shared by both mouse and keyboard input — instant, local (no network round-trip).
function toggleCardSelection(idx) {
    const pos = gameState.selectedOrder.indexOf(idx);
    if (pos !== -1) gameState.selectedOrder.splice(pos, 1);
    else gameState.selectedOrder.push(idx);
    renderSelection();
}

function toggleDrawSource(source) {
    gameState.drawSource = gameState.drawSource === source ? null : source;
    updateDeckDisplay();
    updatePileDisplay();
    updateReadyPulse();
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

// === In-page popups (replace native alert()/confirm(), which block the page and
// look out of place). Self-contained (inline styles) so they don't depend on the
// board stylesheet. ===

// Transient notification, bottom-center. Non-blocking.
function showToast(message) {
    let t = document.getElementById("sf-toast");
    if (!t) {
        t = document.createElement("div");
        t.id = "sf-toast";
        t.style.cssText =
            "position:fixed;left:50%;bottom:8%;transform:translateX(-50%);z-index:10000;" +
            "background:#222;color:#fff;padding:0.8vw 1.6vw;border-radius:0.5vw;font-family:inherit;" +
            "font-size:1vw;max-width:70vw;text-align:center;box-shadow:0 4px 18px rgba(0,0,0,.45);" +
            "border:1px solid rgba(255,255,255,.15);opacity:0;transition:opacity .18s;pointer-events:none;";
        document.body.appendChild(t);
    }
    t.textContent = message;
    requestAnimationFrame(() => { t.style.opacity = "1"; });
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(() => { t.style.opacity = "0"; }, 2600);
}

// Promise-based confirm modal. Resolves true (confirm) / false (cancel/backdrop/Esc).
function showConfirm(message, { okText = "OK", cancelText = "Cancel", danger = false } = {}) {
    return new Promise((resolve) => {
        document.getElementById("sf-modal")?.remove();
        const overlay = document.createElement("div");
        overlay.id = "sf-modal";
        overlay.style.cssText =
            "position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;" +
            "background:rgba(0,0,0,.55);font-family:inherit;";
        const box = document.createElement("div");
        box.style.cssText =
            "background:#1b1b1b;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:0.6vw;" +
            "padding:1.6vw 1.8vw;max-width:34vw;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.5);";
        const msg = document.createElement("div");
        msg.textContent = message;
        msg.style.cssText = "font-size:1.05vw;margin-bottom:1.4vw;line-height:1.4;";
        const row = document.createElement("div");
        row.style.cssText = "display:flex;gap:1vw;justify-content:center;";
        const mkBtn = (label, bg) => {
            const b = document.createElement("button");
            b.textContent = label;
            b.style.cssText =
                "font:inherit;font-size:1vw;padding:0.55vw 1.4vw;border-radius:0.4vw;cursor:pointer;" +
                "border:0.1vw solid rgba(255,255,255,.2);color:#fff;background:" + bg + ";";
            return b;
        };
        const cancelBtn = mkBtn(cancelText, "#3a3a3a");
        const okBtn = mkBtn(okText, danger ? "rgb(150 22 22)" : "#2e7d32");
        const onKey = (e) => {
            if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); done(false); }
            else if (e.key === "Enter") { e.stopPropagation(); e.preventDefault(); done(true); }
        };
        const done = (val) => { overlay.remove(); document.removeEventListener("keydown", onKey, true); resolve(val); };
        cancelBtn.onclick = () => done(false);
        okBtn.onclick = () => done(true);
        overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) done(false); });
        document.addEventListener("keydown", onKey, true);  // capture: keep game shortcuts from firing
        row.appendChild(cancelBtn); row.appendChild(okBtn);
        box.appendChild(msg); box.appendChild(row); overlay.appendChild(box);
        document.body.appendChild(overlay);
        okBtn.focus();
    });
}

// Reliable navigation for leave/end-game: a native form POST so the browser waits
// for the server, follows its redirect, and completes the action even on very slow
// connections — no fetch that could hang, and the leave finishes server-side before
// "/" loads (so the dashboard can't resurrect the just-left game).
function postAndGo(action) {
    const f = document.createElement("form");
    f.method = "POST";
    f.action = action;
    document.body.appendChild(f);
    f.submit();
}

// Leaving is per-player: the server keeps the game going for everyone else and only
// closes the room when fewer than 2 players remain. Guarded against double-fire.
function quitGameAndRedirect() {
    if (gameState.navigatingAway) return;
    gameState.navigatingAway = true;
    clearSessionLog();
    postAndGo("/leave");
}

// Confirm text depends on player count: with only 2 players, one leaving drops the
// room below the 2-player minimum and closes it for the other, so we must not
// promise "the others can keep playing". Returns a Promise<boolean>.
function confirmLeave() {
    const others = Math.max(0, (gameState.allPlayers?.length || 0) - 1);
    const msg = others >= 2
        ? "Leave the game? The others can keep playing."
        : "Leave the game? This will end it for everyone.";
    return showConfirm(msg, { okText: "Leave", danger: true });
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

    // Play / Finish only actually work on your turn (the server enforces this too).
    const finishMax = gameState.finishThreshold ?? 5;
    // moveInFlight keeps the button disabled across the 500ms poll while a /play or
    // /end-round request is pending, so an impatient click on slow net can't double-fire.
    DOM.playBtn.disabled = gameState.moveInFlight || !isYourTurn || roundEnded;
    DOM.endBtn.disabled = gameState.moveInFlight || (roundEnded ? false : (!isYourTurn || (handValue !== null && handValue > finishMax)));
    DOM.endBtn.textContent = "Finish";

    // Selection stays interactive even when it is NOT your turn, so you can
    // pre-select the cards + draw source and be ready to play the instant your
    // turn starts. Only a round-end freeze disables it. Your hand can't change
    // during other players' turns, so the pre-selected indices stay valid.
    const canSelect = !roundEnded;
    DOM.deckEl.style.pointerEvents = canSelect ? "auto" : "none";
    DOM.pileEl.style.pointerEvents = canSelect ? "auto" : "none";

    document.querySelectorAll(".player-hand .card, .player-hand .joker-card, playing-card")
        .forEach(card => {
            card.style.pointerEvents = canSelect ? "auto" : "none";
        });

    // Highlight Play when it becomes your turn with a move already queued up.
    updateReadyPulse();
}

// === 5. RENDERING FUNCTIONS ===
function renderTable(players, scores = {}) {
    DOM.centerTable.querySelectorAll(".opponent-box").forEach(el => el.remove());
    DOM.playerArea.innerHTML = "";

    const youIndex = players.findIndex(p => p.name === gameState.playerName);
    const rotated = [...players.slice(youIndex + 1), ...players.slice(0, youIndex)];
    const you = players[youIndex];
    // Seats follow turn order around the table: the next player after you sits on
    // your left, then across the top, then on your right (a smooth arc, not a
    // left/right/top zig-zag).
    const seatMap = ["left", "top", "right"];

    rotated.forEach((player, idx) => {
        if (idx >= 3) return;
        const container = document.createElement("div");
        container.classList.add("opponent-box", seatMap[idx]);

        const nameLabel = document.createElement("div");
        nameLabel.classList.add("player-label");
        const score = scores[player.name] ?? 0;
        const crown = player.name === gameState.hostName ? " 👑" : "";
        nameLabel.textContent = `${player.name}${crown} (${score})`;
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
        const youCrown = you.name === gameState.hostName ? " 👑" : "";
        label.textContent = `${you.name}${youCrown} (${you.score ?? 0})`;

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
    // Derive the local player's name from the state payload — gameState.playerName
    // may not be set yet on the first poll that renders this popup.
    const localName = (data.players.find(p => Array.isArray(p.hand)) || {}).name || gameState.playerName;
    const initialIsReady = Array.isArray(data.readyPlayers) && data.readyPlayers.includes(localName);

    // === Ready Button ===
    const readyBtn = document.createElement("button");
    readyBtn.classList.add("popup-close");
    readyBtn.id = "round-ready-btn";
    const readyLabel = (ready) => isGameOver
        ? (ready ? "Cancel Rematch" : "🔄 Rematch")
        : (ready ? "Cancel Ready" : "I'm Ready");
    readyBtn.textContent = readyLabel(initialIsReady);

    readyBtn.onclick = async () => {
        // Disable while the toggle is in flight so an impatient click on slow net
        // can't double-fire /ready-next-round (which would flip readiness back off).
        if (readyBtn.dataset.busy) return;
        readyBtn.dataset.busy = "1";
        readyBtn.disabled = true;
        let res, result;
        try {
            res = await fetch("/ready-next-round", {method: "POST"});
            result = await res.json().catch(() => ({}));
        } catch (e) {
            delete readyBtn.dataset.busy;
            readyBtn.disabled = false;
            return showToast("Network error — please try again.");
        }
        if (!res.ok || !result.ready || !Array.isArray(result.ready)) {
            delete readyBtn.dataset.busy;
            readyBtn.disabled = false;
            return showToast(result.error || "Could not ready up — please try again.");
        }

        readyBtn.textContent = readyLabel(result.ready.includes(localName));

        if (result.all_ready) {
            document.getElementById("round-popup")?.remove();
            clearSessionLog();
            DOM.logEntry.innerHTML = "";
            await loadState();
        } else {
            delete readyBtn.dataset.busy;
            readyBtn.disabled = false;
        }
    };

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.flexWrap = "wrap";
    buttonContainer.style.gap = "3vw";
    buttonContainer.style.marginTop = "1vw";

    buttonContainer.appendChild(readyBtn);

    // At game over, offer a quick link to the leaderboard (new tab so the popup
    // and game state stay put).
    if (isGameOver) {
        const lbLink = document.createElement("a");
        lbLink.classList.add("popup-close");
        lbLink.href = "/leaderboard";
        lbLink.target = "_blank";
        lbLink.rel = "noopener";
        lbLink.textContent = "🏆 Leaderboard";
        buttonContainer.appendChild(lbLink);
    }

    const quitBtn = document.createElement("button");
    quitBtn.classList.add("popup-close", "end-game");
    quitBtn.textContent = "Leave";
    quitBtn.onclick = async () => {
        if (gameState.navigatingAway) return;
        if (await confirmLeave()) quitGameAndRedirect();
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
  try {
    let res, data;
    try {
        res = await fetch("/state");
        data = await res.json();
    } catch (e) {
        // Network blip or a non-JSON body (e.g. a 5xx HTML error page). Skip this
        // tick and let the next poll retry — never break the loop.
        return;
    }

    // Session/room genuinely gone -> back to the lobby cleanly.
    if (data && (data.error === "Room closed" || data.error === "Invalid session")) {
        sessionStorage.clear();
        window.location.href = "/";
        return;
    }

    // Any other error, non-2xx, or malformed payload (missing players): skip this
    // tick and retry. This is what a transient 400/"Game not started"/5xx returns.
    if (!res.ok || !data || !Array.isArray(data.players)) {
        return;
    }
    const current = data.players.find(p => Array.isArray(p.hand));
    if (!current) return;  // no self in the payload — bail defensively

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

    state.playerName = current.name;
    state.currentPlayer = data.currentPlayer;
    state.allPlayers = data.players.map(p => p.name);
    state.hand = current.hand || [];
    state.finishThreshold = data.finishThreshold ?? 5;
    state.hostName = data.hostName ?? null;
    state.isHost = data.isHost === true;
    state.turnElapsed = data.turnElapsed ?? 0;
    state.turnWarnAt = data.turnWarnAt ?? 30;
    state.turnTimeout = data.turnTimeout ?? 90;

    // Keep any pre-selection valid against the current hand size.
    state.selectedOrder = state.selectedOrder.filter(i => i < state.hand.length);

    if (roundJustRestarted) {
        state.lastPlayed = [];
        state.selectedOrder = [];   // fresh deal -> previous indices are meaningless
        state.drawSource = null;
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
    updateHostControls();
    updateTurnWarning();
  } catch (e) {
    // Any render error is logged and swallowed so the 500ms poll loop survives.
    console.error("loadState error (ignored, will retry):", e);
  }
}

// The host gets an extra "End Game" button (in index.html, hidden by default) beside
// Leave: it closes the room for everyone (POST /delete-room), whereas Leave only
// removes the host — the crown then passes to another player and the game continues.
function updateHostControls() {
    const endBtn = document.getElementById("host-end-game");
    if (!endBtn) return;
    if (!endBtn.dataset.wired) {
        endBtn.dataset.wired = "1";
        endBtn.addEventListener("click", async () => {
            if (gameState.navigatingAway) return;
            const ok = await showConfirm("End the game for EVERYONE? This closes the table for all players.",
                { okText: "End game", danger: true });
            if (!ok || gameState.navigatingAway) return;
            gameState.navigatingAway = true;
            clearSessionLog();
            postAndGo(`/delete-room/${sessionStorage.getItem("roomCode")}`);
        });
    }
    endBtn.style.display = gameState.isHost ? "" : "none";
}

// Warning countdown while the current player is idle: once the server reports the
// turn has been held past turnWarnAt, show a banner counting down to turnTimeout,
// at which point the server auto-removes them and the table unfreezes.
function updateTurnWarning() {
    let banner = document.getElementById("turn-warning");
    const active = !gameState.roundEnded && !document.getElementById("round-popup");
    const remaining = gameState.turnTimeout - gameState.turnElapsed;
    if (!active || gameState.turnElapsed < gameState.turnWarnAt || remaining <= 0) {
        if (banner) banner.remove();
        return;
    }
    if (!banner) {
        banner = document.createElement("div");
        banner.id = "turn-warning";
        banner.style.cssText =
            "position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:9999;" +
            "background:#7a1f1f;color:#fff;padding:8px 16px;border-radius:8px;font-weight:600;" +
            "box-shadow:0 4px 16px rgba(0,0,0,.4);font-family:inherit;text-align:center;";
        document.body.appendChild(banner);
    }
    const yourTurn = gameState.playerName === gameState.currentPlayer;
    banner.textContent = yourTurn
        ? `⏱ Play within ${remaining}s or you'll be removed from the game`
        : `⏱ Waiting for ${gameState.currentPlayer} — auto-removed in ${remaining}s`;
}

// === 8. EVENT LISTENERS ===
function setupEventListeners() {
    DOM.playBtn.addEventListener("click", async () => {
        if (gameState.moveInFlight) return;  // a move is already being submitted
        if (!gameState.drawSource) return showToast("Choose a draw source — click the deck or the pile.");
        if (gameState.selectedOrder.length === 0) return showToast("Select the card(s) you want to play.");

        const selectedCards = gameState.selectedOrder.map(idx => gameState.hand[idx]);
        gameState.moveInFlight = true;
        DOM.playBtn.disabled = true;
        let res, result;
        try {
            res = await fetch("/play", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({cards: selectedCards, draw: gameState.drawSource})
            });
            result = await res.json().catch(() => ({}));
        } catch (e) {
            gameState.moveInFlight = false;
            return showToast("Network error — please try again.");
        }

        gameState.selectedOrder = [];
        gameState.drawSource = null;
        gameState.moveInFlight = false;
        if (!res.ok) return showToast(result.error || "Invalid move.");
        await loadState();
    });

    DOM.endBtn.addEventListener("click", async () => {
        if (gameState.moveInFlight) return;
        gameState.moveInFlight = true;
        DOM.endBtn.disabled = true;
        let res, result;
        try {
            res = await fetch("/end-round", {method: "POST", headers: {"Content-Type": "application/json"}});
            result = await res.json().catch(() => ({}));   // 204 success has no body
        } catch (e) {
            gameState.moveInFlight = false;
            return showToast("Network error — please try again.");
        }
        gameState.moveInFlight = false;
        if (!res.ok) return showToast(result.error || "Could not end round.");

        gameState.selectedOrder = [];
        gameState.drawSource = null;
        clearSessionLog();
        await loadState();
    });

    DOM.endGameBtn?.addEventListener("click", async () => {
        if (gameState.navigatingAway) return;
        if (await confirmLeave()) quitGameAndRedirect();
    });

    document.addEventListener("mousedown", (e) => {
        const card = e.target.closest(".joker-card, playing-card");
        if (card?.dataset.index !== undefined && e.button === 0) {
            toggleCardSelection(parseInt(card.dataset.index, 10));
            e.preventDefault();
        }
    });

    DOM.deckEl.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        toggleDrawSource("deck");
        e.preventDefault();
    });

    DOM.pileEl.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        toggleDrawSource("pile");
        e.preventDefault();
    });

    // === Keyboard shortcuts ===
    // 1-9 / 0 toggle a card by position (0 = the 10th card) · Enter play · F finish
    // · D draw deck · P draw pile · Esc clear selection. On the round-end popup,
    // Enter or R presses Ready.
    document.addEventListener("keydown", (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const tag = (e.target.tagName || "").toUpperCase();
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (document.getElementById("sf-modal")) return;  // a confirm modal owns the keys

        if (document.getElementById("round-popup")) {
            if (e.key === "Enter" || e.key.toLowerCase() === "r") {
                document.getElementById("round-ready-btn")?.click();
                e.preventDefault();
            }
            return;
        }

        const isYourTurn = gameState.playerName === gameState.currentPlayer && !gameState.roundEnded;

        if (e.key >= "0" && e.key <= "9") {
            // 1-9 select positions 1-9; 0 selects the 10th card (max hand size).
            const idx = e.key === "0" ? 9 : parseInt(e.key, 10) - 1;
            if (idx < gameState.hand.length) toggleCardSelection(idx);
            e.preventDefault();
            return;
        }
        switch (e.key.toLowerCase()) {
            case "enter":  if (isYourTurn && !DOM.playBtn.disabled) DOM.playBtn.click(); e.preventDefault(); break;
            case "f":      if (!DOM.endBtn.disabled) DOM.endBtn.click(); e.preventDefault(); break;
            case "d":      if (isYourTurn) toggleDrawSource("deck"); e.preventDefault(); break;
            case "p":      if (isYourTurn) toggleDrawSource("pile"); e.preventDefault(); break;
            case "escape":
                gameState.selectedOrder = [];
                gameState.drawSource = null;
                renderSelection();       // local — no /state fetch
                updateDeckDisplay();
                updatePileDisplay();
                e.preventDefault();
                break;
        }
    });

    document.addEventListener("dragstart", e => e.preventDefault());
    document.addEventListener("selectstart", e => e.preventDefault());
}

// === 9. INITIALIZE ===
function startAutoRefresh() {
    gameState.autoRefreshTimer = setInterval(loadState, 500);
}

// Subtle "your queued move is ready" pulse on the Play button (self-contained,
// so the game's style.css is untouched).
const _readyPulseStyle = document.createElement("style");
_readyPulseStyle.textContent =
    "#play-selected.ready-pulse{animation:readyPulse 1s ease-in-out infinite}" +
    "@keyframes readyPulse{0%,100%{filter:brightness(1);transform:scale(1)}50%{filter:brightness(1.25);transform:scale(1.05)}}";
document.head.appendChild(_readyPulseStyle);

loadState();
setupEventListeners();
startAutoRefresh();
