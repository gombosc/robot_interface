const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const WebSocket = require("ws");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create Next.js HTTP server on port 3000.
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });
  server.listen(3000, (err) => {
    if (err) throw err;
    console.log(`> Next.js ready on http://localhost:3000`);
  });

  // Setup a separate WebSocket server on port 3001.
  const wsPort = 3001;
  const wss = new WebSocket.Server({ port: wsPort });
  console.log(`> Custom WebSocket server running on ws://localhost:${wsPort}`);

  // Robot state, where (0,0) is the center.
  let robotState = { x: 0, y: 0 };

  // Define boundaries in robot units (using scale 20).
  const maxX = 6;  // e.g., 6 units to the right (approx 120px)
  const minX = -6; // 6 units to the left
  const maxY = 6;  // 6 units downward
  const minY = -6; // 6 units upward

  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");
    ws.send(JSON.stringify({ type: "state", data: robotState }));

    ws.on("message", (message) => {
      const msg = JSON.parse(message);
      if (msg.type === "command") {
        let newX = robotState.x;
        let newY = robotState.y;
        // Adjust commands so that "forward" moves up (decreases y)
        switch (msg.data) {
          case "forward":
            newY = robotState.y - 1;
            break;
          case "backward":
            newY = robotState.y + 1;
            break;
          case "left":
            newX = robotState.x - 1;
            break;
          case "right":
            newX = robotState.x + 1;
            break;
          case "reset":
            newX = 0;
            newY = 0;
            break;
        }
        // Enforce boundaries:
        if (newX > maxX) newX = maxX;
        if (newX < minX) newX = minX;
        if (newY > maxY) newY = maxY;
        if (newY < minY) newY = minY;
        robotState.x = newX;
        robotState.y = newY;
        const newState = { x: robotState.x, y: robotState.y };
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "state", data: newState }));
          }
        });
      }
    });
  });
});
