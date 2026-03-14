import { io, Socket } from 'socket.io-client';

export type GameStateData = {
  players: PlayerData[];
  pileTop: string;
  deckCount: number;
  currentPlayer: string;
  lastAction: ActionData | null;
  scores: Record<string, number>;
  roundEnded: boolean;
  readyPlayers: string[];
  gameOver: boolean;
  winners: [string, number][];
  turnTimer?: number;
  roundData?: RoundEndedData;
};

export type PlayerData = {
  name: string;
  hand: string[] | number; // array for self, count for opponents
  hand_value: number | null;
  score: number;
};

export type ActionData = {
  player: string;
  played: string[];
  drawn_card: string | null;
  draw_source: string;
};

export type RoundEndedData = {
  ender: string;
  hands: Record<string, string[]>;
  hand_values: Record<string, number>;
  round_points: Record<string, number>;
  total_scores: Record<string, number>;
  penalty_applied: boolean;
  game_over: boolean;
  winners: [string, number][];
};

type SocketCallbacks = {
  onGameState?: (data: GameStateData) => void;
  onRoomUpdate?: (data: { players: string[]; ready: Record<string, boolean>; started: boolean }) => void;
  onRoundEnded?: (data: RoundEndedData) => void;
  onError?: (data: { message: string }) => void;
};

class SocketService {
  private socket: Socket | null = null;
  private callbacks: SocketCallbacks = {};

  connect(callbacks: SocketCallbacks) {
    this.callbacks = callbacks;
    this.socket = io({ withCredentials: true });

    this.socket.on('game_state', (data: GameStateData) => {
      this.callbacks.onGameState?.(data);
    });

    this.socket.on('room_update', (data) => {
      this.callbacks.onRoomUpdate?.(data);
    });

    this.socket.on('round_ended', (data: RoundEndedData) => {
      this.callbacks.onRoundEnded?.(data);
    });

    this.socket.on('error', (data: { message: string }) => {
      this.callbacks.onError?.(data);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinRoom(roomCode: string) {
    this.socket?.emit('join_room', { room_code: roomCode });
  }

  leaveRoom(roomCode: string) {
    this.socket?.emit('leave_room', { room_code: roomCode });
  }

  toggleReady(roomCode: string) {
    this.socket?.emit('toggle_ready', { room_code: roomCode });
  }

  playCards(roomCode: string, cards: string[], drawSource: string) {
    this.socket?.emit('play_cards', {
      room_code: roomCode,
      cards,
      draw_source: drawSource,
    });
  }

  endRound(roomCode: string) {
    this.socket?.emit('end_round', { room_code: roomCode });
  }

  readyNextRound(roomCode: string) {
    this.socket?.emit('ready_next_round', { room_code: roomCode });
  }
}

export const socketService = new SocketService();
