import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.services.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/interview")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time interview interactions.
    Delegates connection lifecycle and sending logic to WebSocketConnectionManager.
    """
    # Accept client handshake and register connection
    await websocket_manager.connect(websocket)
    
    # Send connection success message as requested
    await websocket_manager.send_json(
        {"status": "connected", "message": "Connection success"}, 
        websocket
    )

    try:
        while True:
            # Listen for incoming text messages from client
            data = await websocket.receive_text()
            logger.debug(f"Received WebSocket data: {data}")
            
            # Phase 1 simple echo back to client
            await websocket_manager.send_json(
                {"status": "echo", "payload": data}, 
                websocket
            )
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected normally.")
    except Exception as e:
        logger.error(f"WebSocket connection encountered an error: {e}")
    finally:
        # Ensure dead/hanging sockets are cleanly evicted to free resources
        websocket_manager.disconnect(websocket)
