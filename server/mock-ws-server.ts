import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import type { CricketBallEvent } from '../src/types/cricket-ball-event';

const PORT = Number(process.env.WS_PORT) || 8081;

let ballCounter = 1;
const clients = new Set<WebSocket>();

function createSixEvent(ball: number): CricketBallEvent {
  return {
    match_id: 'eng_vs_nz_001',
    status: 'live',
    over: 97,
    ball,
    bowler: { name: 'B Stokes', hand: 'right', type: 'medium_fast', speed: 134 },
    striker: { name: 'T Blundell', hand: 'right' },
    non_striker: { name: "W O'Rourke" },
    keeper: { name: 'J Smith' },
    delivery: { line: 'outside_off', length: 'good_length', bounce: 'normal', speed: 134 },
    result: { runs: 6, type: 'six', is_wicket: false, commentary: 'Huge hit over long-on!' },
  };
}

function broadcast(data: unknown) {
  const msg = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function sendNextEvent() {
  const event = createSixEvent(ballCounter);
  ballCounter += 1;
  if (ballCounter > 6) ballCounter = 1;
  broadcast(event);
  console.log(`[mock-ws] Sent ball ${event.over}.${event.ball} - SIX`);
}

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/trigger') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const event = body ? JSON.parse(body) : createSixEvent(ballCounter++);
        broadcast(event);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Cricket Mock WebSocket Server (SIX only)');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('[mock-ws] Client connected');
  ws.send(JSON.stringify({ type: 'welcome', message: 'Cricket 3D Mock WS — SIX only' }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[mock-ws] Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`[mock-ws] HTTP + WebSocket server on port ${PORT}`);
  console.log(`[mock-ws] WebSocket URL: ws://localhost:${PORT}`);
  console.log(`[mock-ws] All deliveries sent as SIX`);

  setInterval(sendNextEvent, 12000);
  setTimeout(sendNextEvent, 2000);
});
