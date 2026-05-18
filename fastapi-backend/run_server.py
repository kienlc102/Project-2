"""
Launcher script that pre-binds the socket with SO_REUSEADDR before uvicorn
tries to bind, avoiding Windows zombie-socket conflicts on port 8000.
"""
import socket
import asyncio
import uvicorn

HOST = "0.0.0.0"
PORT = 8000

# Pre-bind with SO_REUSEADDR so zombie sockets don't block us
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind((HOST, PORT))

config = uvicorn.Config(
    "app.main:app",
    host=HOST,
    port=PORT,
    log_level="info",
)
server = uvicorn.Server(config)

asyncio.run(server.serve(sockets=[sock]))
