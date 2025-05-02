from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn
import json
from typing import Dict, List, Optional
from models import PlayerState, GameState, PlayerAction, GameSession, manager

# Create FastAPI app
app = FastAPI(title="Raptor: Call of the Shadows Clone")

# Mount static files directory
app.mount("/static", StaticFiles(directory="src/static"), name="static")

# Set up Jinja2 templates
templates = Jinja2Templates(directory="src/templates")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """
    Render the main game page
    """
    return templates.TemplateResponse("index.html", {"request": request})

# Session management endpoints
@app.post("/api/sessions")
async def create_session(name: str, username: str):
    """Create a new game session and return its details"""
    # Create a player ID first
    player_id = manager.create_player(username)

    # Then create a session with this player as host
    session_id = manager.create_session(name, player_id, username)

    return {
        "player_id": player_id,
        "session_id": session_id
    }

@app.get("/api/sessions")
async def list_sessions():
    """Get all active game sessions"""
    sessions = manager.get_all_sessions()

    # Convert to serializable format
    session_list = []
    for session in sessions:
        if not session.is_started:  # Only show sessions that haven't started
            session_dict = session.dict()
            session_dict["player_count"] = len(session.players)
            session_list.append(session_dict)

    return session_list

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get details about a specific game session"""
    session = manager.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session

@app.post("/api/sessions/{session_id}/join")
async def join_session(session_id: str, username: str):
    """Join an existing game session"""
    # Create a player ID first
    player_id = manager.create_player(username)

    # Try to join the session
    success = manager.join_session(session_id, player_id, username)

    if not success:
        raise HTTPException(status_code=400, detail="Could not join session")

    return {
        "player_id": player_id,
        "session_id": session_id
    }

@app.post("/api/sessions/{session_id}/ready")
async def set_player_ready(session_id: str, player_id: str, is_ready: bool):
    """Set a player's ready status in a session"""
    success = manager.set_player_ready(player_id, is_ready)

    if not success:
        raise HTTPException(status_code=400, detail="Could not set ready status")

    return {"success": True}

@app.post("/api/sessions/{session_id}/start")
async def start_session(session_id: str, player_id: str):
    """Start a game session (host only)"""
    session = manager.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.host_id != player_id:
        raise HTTPException(status_code=403, detail="Only the host can start the session")

    success = manager.start_session(session_id)

    if not success:
        raise HTTPException(status_code=400, detail="Not all players are ready")

    return {"success": True}

@app.get("/api/sessions/{session_id}/game-state")
async def get_session_game_state(session_id: str):
    """Get the current game state for a specific session"""
    # Verify session exists
    session = manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get game state for this session
    return manager.get_game_state(session_id)

# Multiplayer endpoints
@app.post("/api/players")
async def create_player(username: str):
    """Create a new player and return their ID"""
    player_id = manager.create_player(username)
    return {"player_id": player_id}

@app.get("/api/game-state")
async def get_game_state():
    """Get the current game state"""
    return manager.get_game_state()

@app.websocket("/ws/sessions/{session_id}/{player_id}")
async def session_websocket(websocket: WebSocket, session_id: str, player_id: str):
    """WebSocket endpoint for real-time session updates in the waiting room"""
    await websocket.accept()
    manager.add_session_connection(player_id, session_id, websocket)

    try:
        # Send initial session state
        session = manager.get_session(session_id)
        if session:
            await websocket.send_text(session.json())

        while True:
            # Receive actions from clients
            data = await websocket.receive_text()
            action = json.loads(data)

            # Process different actions
            if action["type"] == "ready":
                manager.set_player_ready(player_id, action["is_ready"])
            elif action["type"] == "start" and session.host_id == player_id:
                manager.start_session(session_id)

            # Get updated session state
            session = manager.get_session(session_id)
            if session:
                # Broadcast to all session connections
                if session_id in manager.session_connections:
                    session_json = session.json()
                    for conn in manager.session_connections[session_id]:
                        await conn.send_text(session_json)

                # If session is started, notify clients to redirect to game
                if session.is_started:
                    for conn in manager.session_connections[session_id]:
                        await conn.send_text(json.dumps({"type": "start_game"}))

    except WebSocketDisconnect:
        manager.remove_session_connection(player_id, session_id, websocket)

        # Notify remaining clients about the updated session
        session = manager.get_session(session_id)
        if session and session_id in manager.session_connections:
            session_json = session.json()
            for conn in manager.session_connections[session_id]:
                await conn.send_text(session_json)

@app.websocket("/ws/game/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    """WebSocket endpoint for real-time game state updates"""
    await websocket.accept()
    manager.add_connection(player_id, websocket)

    try:
        while True:
            # Receive player actions from the client
            data = await websocket.receive_text()
            action = json.loads(data)

            # Process player action
            if action["action_type"] == "move":
                manager.update_player(
                    player_id=player_id,
                    x=action.get("x"),
                    y=action.get("y")
                )
            elif action["action_type"] == "update":
                manager.update_player(
                    player_id=player_id,
                    x=action.get("x"),
                    y=action.get("y"),
                    health=action.get("health"),
                    score=action.get("score"),
                    weapon_level=action.get("weapon_level"),
                    has_shield=action.get("has_shield")
                )

            # Broadcast the updated game state to all connected clients
            game_state = manager.get_game_state()
            game_state_json = game_state.json()

            # Send to all active connections
            for pid, connections in manager.active_connections.items():
                for connection in connections:
                    await connection.send_text(game_state_json)

    except WebSocketDisconnect:
        manager.remove_connection(player_id, websocket)
        # Notify remaining clients about the disconnection
        game_state = manager.get_game_state()
        game_state_json = game_state.json()

        for pid, connections in manager.active_connections.items():
            for connection in connections:
                await connection.send_text(game_state_json)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

