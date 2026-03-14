import { socketService, GameStateData, RoundEndedData, ActionData } from './socket.js';

const PLAYER_COLORS = ['#8fd4ff', '#ffadad', '#ffe083', '#afffaf', '#d1aaff'];

export type LogEntry = {
  player: string;
  score: number;
  color: string;
  items: { type: string; cards: string[] }[];
};

class GameStore {
  // Game state
  hand: string[] = [];
  handValue: number | null = null;
  opponents: { name: string; cardCount: number; score: number }[] = [];
  pileTop = '';
  deckCount = 0;
  currentPlayer = '';
  scores: Record<string, number> = {};
  roundEnded = false;
  gameOver = false;
  winners: [string, number][] = [];
  readyPlayers: string[] = [];
  turnTimer = 0;  // seconds, 0 = disabled

  // UI state
  playerName = '';
  roomCode = '';
  allPlayers: string[] = [];
  selectedOrder: number[] = [];
  drawSource: string | null = null;
  actionLog: LogEntry[] = [];
  roundData: RoundEndedData | null = null;
  lastActionId = '';
  lastError = '';

  // Listeners
  private listeners: Set<() => void> = new Set();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  /** Reset ALL state for a new game session. */
  reset() {
    this.hand = [];
    this.handValue = null;
    this.opponents = [];
    this.pileTop = '';
    this.deckCount = 0;
    this.currentPlayer = '';
    this.scores = {};
    this.roundEnded = false;
    this.gameOver = false;
    this.winners = [];
    this.readyPlayers = [];
    this.turnTimer = 0;
    this.allPlayers = [];
    this.selectedOrder = [];
    this.drawSource = null;
    this.actionLog = [];
    this.roundData = null;
    this.lastActionId = '';
    this.lastError = '';
  }

  connect(roomCode: string, playerName: string) {
    this.reset();
    this.roomCode = roomCode;
    this.playerName = playerName;

    socketService.connect({
      onGameState: (data) => this.updateFromServer(data),
      onRoundEnded: (data) => this.handleRoundEnded(data),
      onError: (data) => console.error('Server error:', data.message),
    });

    socketService.joinRoom(roomCode);
  }

  disconnect() {
    socketService.leaveRoom(this.roomCode);
    socketService.disconnect();
  }

  updateFromServer(data: GameStateData) {
    const me = data.players.find((p) => Array.isArray(p.hand));
    if (!me) return;

    this.playerName = me.name;
    this.hand = me.hand as string[];
    this.handValue = me.hand_value;
    this.allPlayers = data.players.map((p) => p.name);

    this.opponents = data.players
      .filter((p) => p.name !== me.name)
      .map((p) => ({
        name: p.name,
        cardCount: p.hand as number,
        score: p.score,
      }));

    this.pileTop = data.pileTop;
    this.deckCount = data.deckCount;
    this.currentPlayer = data.currentPlayer;
    this.scores = data.scores;
    this.readyPlayers = data.readyPlayers;
    this.gameOver = data.gameOver;
    this.winners = data.winners;
    this.turnTimer = data.turnTimer ?? 0;

    // Clear round data and selection when round restarts
    if (!data.roundEnded && this.roundEnded) {
      this.roundData = null;
      this.actionLog = [];
      this.lastActionId = '';
      this.selectedOrder = [];
      this.drawSource = null;
    }
    this.roundEnded = data.roundEnded;

    // Recover round data on refresh (server includes it when round is ended)
    if (data.roundEnded && !this.roundData && data.roundData) {
      this.roundData = data.roundData;
    }

    // Clear selection when it's not our turn
    if (!this.isMyTurn && this.selectedOrder.length > 0) {
      this.selectedOrder = [];
      this.drawSource = null;
    }

    // Log new actions
    if (data.lastAction) {
      const actionId = JSON.stringify(data.lastAction);
      if (actionId !== this.lastActionId) {
        this.lastActionId = actionId;
        this.addLogEntry(data.lastAction, data);
      }
    }

    // Reset selection if cards changed (creates new array for Lit reactivity)
    this.selectedOrder = this.selectedOrder.filter((i) => i < this.hand.length);

    this.notify();
  }

  handleRoundEnded(data: RoundEndedData) {
    this.roundData = data;
    this.notify();
  }

  private addLogEntry(action: ActionData, data: GameStateData) {
    const entry: LogEntry = {
      player: action.player,
      score: data.scores[action.player] ?? 0,
      color: this.getPlayerColor(action.player),
      items: [],
    };

    if (action.played?.length) {
      entry.items.push({ type: 'played', cards: action.played });
    }

    // Draw display: pile draws show the card, deck draws show card back
    // (server already hides drawn_card for other players' deck draws)
    if (action.draw_source === 'pile' && action.drawn_card) {
      entry.items.push({ type: 'drew from pile', cards: [action.drawn_card] });
    } else if (action.draw_source === 'deck') {
      // Own turn: server sends actual card; others: server sends null
      const card = action.drawn_card || '🂠';
      entry.items.push({ type: 'drew from deck', cards: [card] });
    }

    // Cap to 2 full rounds of entries (numPlayers * 2)
    const maxEntries = Math.max(this.allPlayers.length * 2, 6);
    this.actionLog = [...this.actionLog, entry];
    if (this.actionLog.length > maxEntries) {
      this.actionLog = this.actionLog.slice(this.actionLog.length - maxEntries);
    }
  }

  getPlayerColor(name: string): string {
    const idx = this.allPlayers.indexOf(name);
    return PLAYER_COLORS[idx % PLAYER_COLORS.length];
  }

  // === User actions (immutable state updates for Lit reactivity) ===
  toggleCardSelection(index: number) {
    const pos = this.selectedOrder.indexOf(index);
    if (pos !== -1) {
      // Remove — create new array (never splice in place)
      this.selectedOrder = [...this.selectedOrder.slice(0, pos), ...this.selectedOrder.slice(pos + 1)];
    } else {
      // Add — create new array (never push in place)
      this.selectedOrder = [...this.selectedOrder, index];
    }
    this.notify();
  }

  setDrawSource(source: string | null) {
    this.drawSource = this.drawSource === source ? null : source;
    this.notify();
  }

  /** Play cards via REST API with error handling. */
  async playCards(): Promise<string | null> {
    if (!this.drawSource || this.selectedOrder.length === 0) return null;
    const cards = this.selectedOrder.map((i) => this.hand[i]);

    try {
      const res = await fetch(`/api/lobby/rooms/${this.roomCode}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cards, draw_source: this.drawSource }),
      });

      const result = await res.json();

      // Always clear selection after attempt
      this.selectedOrder = [];
      this.drawSource = null;

      if (!res.ok) {
        this.lastError = result.error || 'Invalid move';
        this.notify();
        return this.lastError;
      }

      // Server returned updated game state
      this.updateFromServer(result);
      return null;

    } catch {
      this.selectedOrder = [];
      this.drawSource = null;
      this.lastError = 'Network error';
      this.notify();
      return this.lastError;
    }
  }

  /** End round via REST API. */
  async endRound(): Promise<string | null> {
    try {
      const res = await fetch(`/api/lobby/rooms/${this.roomCode}/end-round`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await res.json();

      if (!res.ok) {
        return result.error || 'Could not end round';
      }

      if (result.round_data) {
        this.handleRoundEnded(result.round_data);
      }
      if (result.state) {
        this.updateFromServer(result.state);
      }
      return null;

    } catch {
      return 'Network error';
    }
  }

  /** Ready for next round via REST API. */
  async readyNextRound(): Promise<void> {
    try {
      const res = await fetch(`/api/lobby/rooms/${this.roomCode}/ready`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await res.json();
      if (result.state) {
        this.updateFromServer(result.state);
      }
      if (result.round_data) {
        this.handleRoundEnded(result.round_data);
      }
    } catch {
      // ignore
    }
  }

  get isMyTurn(): boolean {
    return this.playerName === this.currentPlayer && !this.roundEnded;
  }

  get canEndRound(): boolean {
    return this.isMyTurn && this.handValue !== null && this.handValue <= 5;
  }
}

export const gameStore = new GameStore();
