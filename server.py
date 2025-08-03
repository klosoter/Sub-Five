import uuid
import logging
import os
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from werkzeug.serving import WSGIRequestHandler
from game import Game, Card, sort_hand
from dotenv import load_dotenv

load_dotenv()

# class QuietHandler(WSGIRequestHandler):
#     def log_request(self, code='-', size='-'):
#         if isinstance(code, int) and code in (200, 304):
#             return  # suppress
#         super().log_request(code, size)

logging.getLogger('werkzeug').setLevel(logging.WARNING)

# === Flask Setup ===
app = Flask(__name__, static_url_path='/static', static_folder='static', template_folder='templates')
app.secret_key = os.getenv("SECRET_KEY", "fallback-key-for-dev")

CORS(app)
rooms = {}  # { room_code: {"players": [], "ready": {}, "game": Game instance} }


def build_game_over_notice(winners):
    if not winners:
        return ""

    if len(winners) == 1:
        name, score = winners[0]
        winner_text = f"<strong>{name}</strong> wins with {score} points!"
    else:
        lines = [f"<strong>{name}</strong> ({score} pts)" for name, score in winners]
        winner_text = "Tie! " + ", ".join(lines)

    return f"""
    <div class="mini-popup-content">
    <h2>🏆 Game Over</h2>
    <p>{winner_text}</p>
    <button class="popup-close" id="game-over-ok">OK</button>
    </div>
    """


def build_round_summary_popup(round_ender, hands, hand_values, scores, penalty_applied, lowest_players):
    def card_html(card_str):
        if card_str.startswith("JOKER"):
            suit = card_str[-1]
            return f'<div class="joker-card" data-joker="{suit}"><div class="joker-face">{card_str}</div></div>'
        rank = card_str[:-1]
        suit = card_str[-1]
        rank_map = {"A": "Ace", "K": "King", "Q": "Queen", "J": "Jack", "10": "10", "9": "9", "8": "8",
                    "7": "7", "6": "6", "5": "5", "4": "4", "3": "3", "2": "2"}
        suit_map = {"♠": "Spades", "♥": "Hearts", "♦": "Diamonds", "♣": "Clubs"}
        r = rank_map.get(rank, rank)
        s = suit_map.get(suit, suit)
        return f'<playing-card rank="{r}" suit="{s}"></playing-card>'

    rows = []
    
    for name, hand in hands.items():
        round_pts = hand_values[name]
        total_score = scores[name]
        cards_html = f'''
            <div class="card-scale-container">
                <div class="card-row">
                {''.join(card_html(c) for c in hand)}
                </div>
            </div>
        '''

        row_class = ""
        if round_pts == 0:
            row_class = "winner"
        if name == round_ender and penalty_applied:
            row_class = "loser"
        round_pts_display = f"{round_pts} (+15)" if row_class == "loser" else round_pts

        # if name == round_ender and not penalty_applied:
        #     row_class = "winner"

        row = f"""
        <tr class="{row_class}">
            <td>{name}</td>
            <td>{cards_html}</td>
            <td>{round_pts_display}</td>
            <td>{total_score}</td>
        </tr>
        """
        rows.append(row)

    return f"""
    <table class="round-summary-table">
        <tr><th>Name</th><th>Hand</th><th>Round Points</th><th>Total Score</th></tr>
        {''.join(rows)}
    </table>
    """


# === Cache-Control for Static Files ===
@app.after_request
def add_no_cache_headers(response):
    if response.content_type in ("text/css", "application/javascript"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.before_request
def reset_invalid_debug_session():
    if app.debug:
        code = session.get("room")
        name = session.get("player_name")
        if code == "debug" and (not code in rooms or name not in rooms[code]["players"]):
            session.clear()


# === Room and Session Lifecycle ===
@app.route("/")
def home():
    room_list = [
        {"code": code, "players": data["players"],
         "started": data["game"] is not None}
        for code, data in rooms.items()
    ]
    return render_template("home.html", room_list=room_list)


@app.route("/debug")
def debug_game():
    name = "Alice" if hash(request.remote_addr + request.user_agent.string) % 2 == 0 else "Bob"
    session["room"] = "debug"
    session["player_name"] = name

    if "debug" not in rooms:
        from game import Game
        rooms["debug"] = {
            "players": ["Alice", "Bob"],
            "game": Game(["Alice", "Bob"]),
            "ready": set()
        }

    return redirect("/game")



@app.route("/create")
def create_room():
    session.clear()
    room_code = str(uuid.uuid4())[:6]
    rooms[room_code] = {"players": [], "ready": {}, "game": None}
    return redirect(url_for("join_room", code=room_code))


@app.route("/join/<code>")
def join_room(code):
    if code not in rooms:
        return redirect(url_for("game"))

    # Only clear identity if it doesn't match the room
    if session.get("room") != code:
        session.clear()
        session["room"] = code

    return render_template("join.html", room_code=code, player_name=session.get("player_name"))


@app.route("/join-room", methods=["POST"])
def post_join_room():
    code = request.form.get("room")
    name = request.form.get("name")

    if code not in rooms or not name:
        return redirect("/")

    session["room"] = code
    session["player_name"] = name

    if name not in rooms[code]["players"]:
        rooms[code]["players"].append(name)
        rooms[code]["ready"][name] = False

    return redirect(url_for("join_room", code=code))


@app.route("/room-state/<code>")
def room_state(code):
    room = rooms.get(code)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    return jsonify({
        "players": room["players"],
        "ready": room.get("ready", {}),
        "started": room["game"] is not None
    })


@app.route("/room-list")
def room_list_json():
    room_list = []
    for code, room in rooms.items():
        try:
            room_list.append({
                "code": code,
                "players": room.get("players", []),
                "started": room.get("started", False)
            })
        except Exception as e:
            print(f"Error in room {code}: {e}")
            continue  # skip malformed room

    return jsonify(room_list)


@app.route("/delete-room/<code>", methods=["POST"])
def delete_room(code):
    if code in rooms:
        del rooms[code]
    return redirect("/")


@app.route("/leave", methods=["POST"])
def leave():
    session.clear()
    return jsonify({"redirect": "/"})


@app.route("/end-room", methods=["POST"])
def end_room():
    code = session.get("room")
    player_name = session.get("player_name")

    if not code or not player_name:
        return jsonify({"error": "Not in a room"}), 400

    room = rooms.get(code)
    if not room:
        return jsonify({"error": "Room not found"}), 400

    room["terminated"] = True  
    del rooms[code]  
    session.clear() 

    return jsonify({"status": "Room closed", "redirect": "/"})


#  === Game Lifecycle ===
@app.route("/toggle-ready/<code>", methods=["POST"])
def toggle_ready(code):
    player = session.get("player_name")
    room = rooms.get(code)
    if not room or player not in room["players"]:
        return jsonify({"error": "Invalid room or player"}), 400

    room["ready"][player] = not room["ready"].get(player, False)

    if len(room["players"]) >= 2 and all(room["ready"].values()):
        room["game"] = Game(room["players"])
        return jsonify({"status": "started"})

    return jsonify({"status": "toggled", "ready": room["ready"][player]})


@app.route("/game")
def game():
    if "player_name" not in session or "room" not in session:
        return redirect("/")
    return render_template("index.html", room_code=session["room"])


@app.route("/state")
def state():
    code = session.get("room")
    player_name = session.get("player_name")
    room = rooms.get(code)
    
    if not room:
        session.clear()
        return jsonify({"error": "Room closed"}), 400
    
    if not code or not player_name or not room:
        return jsonify({"error": "Invalid session"}), 400

    if player_name not in room["players"]:
        return jsonify({"error": "Invalid session"}), 400

    game = room.get("game")
    if not game:
        return jsonify({"error": "Game not started"}), 400
    
    if getattr(game, "game_over", False):
        winners = getattr(game, "winners", [])
        gameOverNotice = build_game_over_notice(winners)
        gameOver = True
    else:
        gameOverNotice = None
        gameOver = False

        
    all_ready = set(p.name for p in game.players) == game.ready_players
    if all_ready:
        game.start_next_round()
        # game.round_ended = False
        all_ready = set()
        all_ready = False
        game.ready_players = []


    action = getattr(game, "last_action", None)
    if action:
        draw_source = action["draw_source"]
        drew_card = (
            str(action["drawn_card"])
            if draw_source == "pile" or action["player"] == player_name
            else None
        )
        last_action = {
            "player": action["player"],
            "played": action["played"],
            "drawn_card": drew_card,
            "draw_source": draw_source
        }
        
    
    else:
        last_action = None
    
    return jsonify({
        "players": [
            {
                "name": p.name,
                "hand": [str(c) for c in sort_hand(p.hand)] if p.name == player_name else len(p.hand),
                "hand_value": p.hand_value() if p.name == player_name else None,
                "score": game.scores.get(p.name, 0)
            }
            for p in game.players
        ],
        "pileTop": str(game.play_pile[-1]) if game.play_pile else "",
        "deckCount": len(game.deck.cards),
        "currentPlayer": game.current_player().name,
        "lastAction": last_action,
        "scores": game.scores,
        "roundEnded": game.round_ended,
        "readyPlayers": list(game.ready_players),
        "roundSummaryPopup": getattr(game, "round_summary_html", ""),
        "gameOver": gameOver,
        "gameOverNotice": gameOverNotice
    })


@app.route("/play", methods=["POST"])
def handle_play_cards():
    code = session.get("room")
    player_name = session.get("player_name")
    room = rooms.get(code)
    if not room or not room["game"]:
        return redirect("/")
        # return jsonify({"error": "Game not started"}), 400

    game = room["game"]
    data = request.json
    cards_raw = data.get("cards", [])
    draw = data.get("draw")

    cards = []
    for s in cards_raw:
        if s.startswith("JOKER") and len(s) == 7:
            cards.append(Card("JOKER", s[-1]))
        else:
            cards.append(Card(s[:-1], s[-1]))

    try:
        player = next(p for p in game.players if p.name == player_name)
        played, drawn = game.play_cards(player, cards, draw)
        game.next_turn()
        game.last_action = {
            "player": player.name,
            "played": [str(c) for c in played],
            "drawn_card": drawn,
            "draw_source": draw
        }
        return jsonify({"status": "OK"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/end-round", methods=["POST"])
def end_round():
    code = session.get("room")
    player = session.get("player_name")
    room = rooms.get(code)
    
    if not room or not room["game"]:
        print("error")
        return redirect("/")
        # return jsonify({"error": "Game not started"}), 400

    try:
        game = room["game"]
        hands, hand_values, scores, penalty_applied, lowest_players = game.end_game(
            player)
        game.round_ended = True
        game.ready_players = set()
        
        winners = game.determine_winners()
        
        if winners:
            game.game_over = True
            game.winners = winners
            gameOverNotice = build_game_over_notice(winners)
        else:
            gameOverNotice = None
        
        
        
        game.round_summary_html = build_round_summary_popup(
            round_ender=player,
            hands = {p.name: [str(c) for c in sort_hand(p.hand)] for p in game.players},
            hand_values=hand_values,
            scores=scores,
            penalty_applied=penalty_applied,
            lowest_players=lowest_players
        )
        
        # game.start_next_round()
        
        return jsonify({
            "hands": hands,
            "hand_values": hand_values,
            "scores": scores,
            "penalty_applied": penalty_applied,
            "lowest_player": lowest_players,
            "round_ender": player,
            "roundSummaryPopup": game.round_summary_html,
            "gameOverNotice": gameOverNotice,
            "gameOver": bool(winners),
            "readyPlayers": list(room["ready"]),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/ready-next-round", methods=["POST"])
def ready_next_round():
    try:
        code = session.get("room")
        player = session.get("player_name")
        if not code or not player:
            return jsonify({"error": "Missing session"}), 400

        room = rooms.get(code)
        if not room or "game" not in room:
            return jsonify({"error": "Room/game not found"}), 400

        game = room["game"]
        if not game.round_ended:
            return jsonify({"error": "Round not ended"}), 400

        # Toggle ready status
        if player in game.ready_players:
            game.ready_players.remove(player)
        else:
            game.ready_players.add(player)

        all_ready = set(p.name for p in game.players) == game.ready_players
        
        if all_ready and game.round_ended:
            if game.game_over:
                game.reset_scores()
            game.reset_for_next_round()
            game.round_ended = False
            game.last_action = None


        return jsonify({
            "ready": list(game.ready_players),
            "all_ready": all_ready,
            "pileTop": str(game.play_pile),
            "scores": game.scores,
            "gameOver": game.game_over,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


#  === Game Lifecycle
if __name__ == "__main__":
    # app.run(debug=False, request_handler=QuietHandler)
    app.run(debug=False)
