import logging
from typing import Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class WebSocketConnectionManager:
    """
    WebSocket Connection Manager.
    Manages active connections, performs clean handshakes, evicts dead sockets on disconnect,
    and facilitates message sending and broadcasting.
    """
    def __init__(self) -> None:
        # Using a set to ensure unique sockets and O(1) complexity for connection tracking and eviction
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        """
        Accept a new WebSocket connection and track it in memory.
        """
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """
        Clean up and remove a closed WebSocket connection from tracking.
        Ensures dead sockets are evicted to prevent resource leaks and avoid hitting connection limits.
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected and evicted. Total active connections: {len(self.active_connections)}")
        else:
            logger.debug("Attempted to disconnect an untracked WebSocket.")

    async def send_json(self, message: dict, websocket: WebSocket) -> None:
        """
        Send a JSON message to a specific WebSocket client.
        Safe wrapper that handles potential dropouts and automatically evicts dead sockets.
        """
        if websocket in self.active_connections:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to client: {e}. Evicting socket.")
                self.disconnect(websocket)
        else:
            logger.warning("Attempted to send message to an untracked or closed WebSocket.")

    async def broadcast_json(self, message: dict) -> None:
        """
        Broadcast a JSON message to all active WebSocket clients.
        Automatically cleans up any failed socket deliveries.
        """
        # Create a copy of the active_connections set to iterate safely while allowing self-modification
        failed_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}. Scheduling eviction.")
                failed_connections.append(connection)
        
        # Evict any connections that failed during broadcast
        for connection in failed_connections:
            self.disconnect(connection)

# Global WebSocket Connection Manager Instance
websocket_manager = WebSocketConnectionManager()
