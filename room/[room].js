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
    this.handle(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  handle(ws) {
    ws.accept();
    this.sessions.push(ws);

    ws.addEventListener("message", evt => {
      this.broadcast(evt.data);
    });

    ws.addEventListener("close", () => {
      this.sessions = this.sessions.filter(s => s !== ws);
    });
  }

  broadcast(msg) {
    for (const ws of this.sessions) {
      try { ws.send(msg); } catch {}
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const roomName = url.pathname.split("/").pop() || "default";
    const id = env.CHAT_ROOM.idFromName(roomName);
    const stub = env.CHAT_ROOM.get(id);
    return stub.fetch(request);
  }
};
