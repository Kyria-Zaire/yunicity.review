/**
 * Reverse-proxy de façade pour le harnais E2E production-like (C3.1-R1I).
 *
 * ── Pourquoi ce composant existe ─────────────────────────────────────────────
 * Le proxy `/api/v1/*` intégré à l'application est volontairement DÉSACTIVÉ quand
 * `NODE_ENV === "production"` (`lib/dev/local-api-proxy.ts`) : c'est une garde de
 * sécurité, un déploiement réel ne doit jamais proxifier vers un backend loopback.
 * Or `next start` impose `NODE_ENV=production`. Mesuré : sous `next start`,
 * `GET /api/v1/health` renvoie 404 alors que les pages répondent en ~0,22 s.
 *
 * Passer les tests en direct sur `:8010` casserait le contrat same-origin que les
 * specs 15/18/19 vérifient explicitement, et relâcher la garde serait un changement
 * produit interdit. On place donc une façade unique devant les deux services :
 *
 *     navigateur → :3002 (cette façade) ─┬─ /api/v1/*  → 127.0.0.1:8010 (API QA)
 *                                        └─ le reste   → 127.0.0.1:3003 (next start)
 *
 * Le navigateur ne voit qu'une seule origine, exactement comme en production
 * derrière un reverse-proxy — c'est plus fidèle au déploiement réel que la route
 * proxy de développement qu'il remplace.
 *
 * Aucune dépendance : `node:http` uniquement. Aucun code produit n'est touché.
 */
import { createServer, request as httpRequest } from "node:http";
import { resolveProxyHost } from "./e2e-proxy-host.mjs";

const PORT = Number(process.env.E2E_PROXY_PORT ?? 3002);
const HOST = resolveProxyHost(process.env);
const WEB_TARGET = process.env.E2E_WEB_TARGET ?? "http://127.0.0.1:3003";
const API_TARGET = process.env.E2E_API_TARGET ?? "http://127.0.0.1:8010";

/** Marqueur lu par le harnais : interdit de confondre ce serveur avec `next dev`. */
const SERVER_INFO_PATH = "/__e2e/server-info";
const SERVER_MODE = "production-like";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function sanitize(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

function forward(clientReq, clientRes, targetUrl) {
  const target = new URL(targetUrl);
  const headers = sanitize(clientReq.headers);
  headers.host = target.host;

  const upstream = httpRequest(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      method: clientReq.method,
      path: clientReq.url,
      headers,
    },
    (upstreamRes) => {
      clientRes.writeHead(upstreamRes.statusCode ?? 502, sanitize(upstreamRes.headers));
      upstreamRes.pipe(clientRes);
    },
  );

  upstream.on("error", (error) => {
    process.stderr.write(`[e2e-proxy] upstream ${targetUrl}${clientReq.url} : ${error.message}\n`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { "content-type": "application/json" });
    }
    clientRes.end(JSON.stringify({ error: "bad_gateway", target: targetUrl }));
  });

  // Streaming : les uploads de médias (specs 16/17/18) passent par ici.
  clientReq.pipe(upstream);
}

const server = createServer((req, res) => {
  if (req.url === SERVER_INFO_PATH) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ mode: SERVER_MODE, webTarget: WEB_TARGET, apiTarget: API_TARGET }));
    return;
  }
  const target = req.url?.startsWith("/api/v1/") ? API_TARGET : WEB_TARGET;
  forward(req, res, target);
});

server.on("error", (error) => {
  process.stderr.write(`[e2e-proxy] écoute impossible sur ${HOST}:${PORT} : ${error.message}\n`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  process.stdout.write(
    `[e2e-proxy] ${HOST}:${PORT} → web ${WEB_TARGET} · api ${API_TARGET} (mode ${SERVER_MODE})\n`,
  );
});
