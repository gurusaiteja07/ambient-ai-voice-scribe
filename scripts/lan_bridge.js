// LAN Network Bridge for Ambient AI Voice Scribe
// Forwards external network requests (from phones, tablets, or LAN devices)
// on Wi-Fi IP (e.g. 10.145.117.193) to the running services.

const net = require("net");

const TARGET_HOST = process.env.WSL_HOST || "172.28.42.153";

function bridgePort(port, name) {
  const server = net.createServer((clientSocket) => {
    const targetSocket = net.connect(port, TARGET_HOST);
    clientSocket.pipe(targetSocket).pipe(clientSocket);
    clientSocket.on("error", () => {});
    targetSocket.on("error", () => {});
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[LAN Bridge] Forwarding 0.0.0.0:${port} (${name}) -> ${TARGET_HOST}:${port}`);
  });

  server.on("error", (err) => {
    console.error(`[LAN Bridge] Port ${port} error:`, err.message);
  });
}

bridgePort(8000, "FastAPI Backend API");
bridgePort(5173, "React Clinic Frontend & Mobile PWA");
console.log("\n[LAN Bridge Active] Clinic Voice Scribe accessible across LAN:");
console.log("  Web Frontend:  http://10.145.117.193:5173/");
console.log("  Mobile PWA:    http://10.145.117.193:5173/mobile/");
console.log("  Backend API:   http://10.145.117.193:8000/docs");
