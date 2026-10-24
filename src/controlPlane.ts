import Fastify from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';

const fastify = Fastify({ logger: true });
const PORT = process.env.PORT || 6000;
const SECRET_SIGNING_KEY = crypto.randomBytes(32).toString('hex');

interface PolicyManifest {
  tenantId: string;
  version: number;
  maxTier: string;
  blockDlp: boolean;
  signature: string;
  updatedAt: string;
}

const policyStore = new Map<string, PolicyManifest>();
const connectedEdgeNodes = new Set<WebSocket>();

function signManifest(tenantId: string, version: number, maxTier: string, blockDlp: boolean): string {
  const payload = `${tenantId}:${version}:${maxTier}:${blockDlp}`;
  return crypto.createHmac('sha256', SECRET_SIGNING_KEY).update(payload).digest('hex');
}

fastify.put<{ Body: { tenantId: string; maxTier: string; blockDlp: boolean } }>('/v1/control/policies', async (request, reply) => {
  const { tenantId, maxTier, blockDlp } = request.body;
  const existing = policyStore.get(tenantId);
  const nextVersion = existing ? existing.version + 1 : 1;
  const signature = signManifest(tenantId, nextVersion, maxTier, blockDlp);

  const manifest: PolicyManifest = {
    tenantId,
    version: nextVersion,
    maxTier,
    blockDlp,
    signature,
    updatedAt: new Date().toISOString()
  };

  policyStore.set(tenantId, manifest);

  const eventPayload = JSON.stringify({ type: 'POLICY_UPDATE', manifest });
  for (const client of connectedEdgeNodes) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(eventPayload);
    }
  }

  return reply.code(200).send({ status: 'COMMITTED', clusterSyncBroadcasted: true, manifest });
});

fastify.get<{ Querystring: { tenantId?: string } }>('/v1/control/manifests', async (request, reply) => {
  const { tenantId } = request.query;
  if (tenantId) {
    const manifest = policyStore.get(tenantId);
    if (!manifest) return reply.code(404).send({ error: 'Tenant policy manifest not found' });
    return reply.send({ manifest });
  }
  return reply.send({ clusterEpoch: Date.now(), manifests: Array.from(policyStore.values()) });
});

const start = async () => {
  try {
    await fastify.listen({ port: Number(PORT), host: '0.0.0.0' });
    const wss = new WebSocketServer({ server: fastify.server });
    wss.on('connection', (ws) => {
      connectedEdgeNodes.add(ws);
      ws.send(JSON.stringify({ type: 'HANDSHAKE_ACK', serverTime: new Date().toISOString() }));
      ws.on('close', () => { connectedEdgeNodes.delete(ws); });
    });
    console.log(`[Orion Control Plane] Active on http://127.0.0.1:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();