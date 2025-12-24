export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
  }

  async fetch(request) {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  handleSession(ws) {
    ws.accept();
    this.sessions.push(ws);

    ws.addEventListener("message", evt => {
      this.broadcast(evt.data);
    });

    ws.addEventListener("close", () => {
      this.sessions = this.sessions.filter(s => s !== ws);
    });
  }

  broadcast(message) {
    for (const ws of this.sessions) {
      try { ws.send(message); } catch {}
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const roomName = url.pathname.split("/")[2] || "default";

    const id = env.CHAT_ROOM.idFromName(roomName);
    const room = env.CHAT_ROOM.get(id);

    return room.fetch(request);
  }
};
