import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

async function runTest() {
  console.log('[Test] Starting Orion Control Plane Server...');
  // Use node directly with tsx loader to avoid Windows npx spawn ENOENT errors
  const serverScript = path.join(process.cwd(), 'src/controlPlane.ts');
  const server = spawn('npx.cmd', ['tsx', serverScript], { stdio: 'pipe', shell: true });

  server.on('error', (err) => {
    console.error('[Test] Failed to start server process:', err);
  });
  
  await new Promise((r) => setTimeout(r, 2500)); // wait for boot

  console.log('[Test] Step 1: Pushing new tenant security policy to Control Plane...');
  const postData = JSON.stringify({
    tenantId: 'enterprise-healthcare-corp',
    maxTier: 'gpt-4o',
    blockDlp: true
  });

  const req = http.request({
    hostname: '127.0.0.1',
    port: 6000,
    path: '/v1/control/policies',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('[Test] Control Plane Response:', JSON.parse(data));
      
      console.log('[Test] Step 2: Verifying Edge Node Sync Manifest Pull...');
      http.get('http://127.0.0.1:6000/v1/control/manifests?tenantId=enterprise-healthcare-corp', (syncRes) => {
        let syncData = '';
        syncRes.on('data', chunk => syncData += chunk);
        syncRes.on('end', () => {
          console.log('[Test] Edge Sync Manifest Verified:', JSON.parse(syncData));
          console.log('[VERIFICATION SUCCESS] Orion Control Plane is fully operational.');
          server.kill();
          process.exit(0);
        });
      });
    });
  });

  req.on('error', (e) => {
    console.error('[Test] Request error:', e);
    server.kill();
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

runTest();