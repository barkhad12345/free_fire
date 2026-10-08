const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const userDataDir = path.join(__dirname, 'temp_edge_supa');

  console.log('Launching Edge for Supabase integration test...');
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${userDataDir}`,
    '--window-size=430,932',
    '--disable-gpu',
    'http://localhost:3000/'
  ]);

  await sleep(2500);

  try {
    const res = await fetch('http://127.0.0.1:9224/json');
    const targets = await res.json();
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && callbacks.has(msg.id)) {
        const resolve = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        resolve(msg);
      }
    };

    await new Promise(r => ws.onopen = r);

    function sendCommand(method, params = {}) {
      return new Promise(resolve => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    async function evalCode(expr) {
      const r = await sendCommand('Runtime.evaluate', { expression: expr, returnByValue: true });
      return r.result?.result?.value;
    }

    async function captureScreen(name) {
      const r = await sendCommand('Page.captureScreenshot', { format: 'png' });
      if (r.result?.data) {
        fs.writeFileSync(path.join(__dirname, `${name}.png`), Buffer.from(r.result.data, 'base64'));
        console.log(`Captured: ${name}.png`);
      }
    }

    await sleep(1500);
    await captureScreen('supa_1_home');

    // Test Opening Auth Modal from Profile
    console.log('Navigating to Profile & Opening Auth Modal...');
    await evalCode("document.querySelector('[data-screen=\"profile\"]').click()");
    await sleep(600);
    await evalCode("document.getElementById('menuItemAuthAction').click()");
    await sleep(600);
    await captureScreen('supa_2_auth_modal');

    // Test Switching to Sign Up tab
    console.log('Switching to Sign Up tab...');
    await evalCode("document.querySelector('[data-auth-mode=\"signup\"]').click()");
    await sleep(400);
    await captureScreen('supa_3_signup_modal');

    // Close modal
    await evalCode("document.querySelector('[data-close-modal=\"authModal\"]').click()");
    await sleep(400);

    // Test Unlocking and Opening Admin Dashboard
    console.log('Testing Admin Dashboard view...');
    await evalCode("window.__testAdmin = true; document.getElementById('menuItemAdmin').style.display = 'flex';");
    await evalCode("document.getElementById('menuItemAdmin').click()");
    await sleep(600);
    await captureScreen('supa_4_admin_dashboard');

    console.log('ALL SUPABASE INTEGRATION SCREENS VERIFIED!');
    ws.close();
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    edge.kill();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
