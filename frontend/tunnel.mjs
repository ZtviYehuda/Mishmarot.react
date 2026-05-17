import { spawn } from 'child_process';

console.log("Starting cloudflared tunnel...");
const child = spawn('npx.cmd', ['-y', 'cloudflared', 'tunnel', '--url', 'http://localhost:5173'], { shell: true });

let found = false;
child.stderr.on('data', data => {
  const str = data.toString();
  // We remove spaces and ANSI color codes to find the URL easily because cloudflared pads it
  const clean = str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\s+/g, '');
  const match = clean.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  
  if (match && !found) {
    found = true;
    console.log('\n' + '='.repeat(60));
    console.log('✅ TUNNEL IS READY!');
    console.log('🔗 URL: ' + match[0]);
    console.log('='.repeat(60) + '\n');
  }
});

child.on('close', code => {
  console.log(`Tunnel closed with code ${code}`);
});
