#!/usr/bin/env node
/**
 * Generate QR Codes for 57 Tags
 * Creates overlay QR codes (claim URLs) and base QR codes (public card URLs)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate 57 unique tag IDs
const tags = [];
for (let i = 0; i < 57; i++) {
    const tagId = `RL-${String(i + 1).padStart(3, '0')}`;
    const claimToken = crypto.randomBytes(32).toString('hex');
    const publicId = `AUS${String(i + 1).padStart(4, '0')}`;
    
    tags.push({
        tag_number: i + 1,
        tag_id: tagId,
        claim_token: claimToken,
        public_id: publicId,
        overlay_qr_url: `https://app.ranchlink.com/start?token=${claimToken}`,
        base_qr_url: `https://app.ranchlink.com/a?id=${publicId}`,
        status: 'printed'
    });
}

// Generate HTML file with QR codes
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RanchLink - 57 Tags QR Codes</title>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #F8F3E8;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #2C241F;
            margin-bottom: 30px;
        }
        .tags-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .tag-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        .tag-card h3 {
            color: #BF5700;
            margin-bottom: 10px;
        }
        .tag-id {
            font-family: monospace;
            font-weight: bold;
            color: #2C241F;
            margin: 10px 0;
        }
        .qr-container {
            margin: 15px 0;
        }
        .qr-label {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
        }
        .url {
            font-size: 10px;
            color: #999;
            word-break: break-all;
            margin-top: 5px;
        }
        .actions {
            text-align: center;
            margin: 30px 0;
        }
        button {
            background: #BF5700;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin: 0 10px;
        }
        button:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐄 RanchLink - 57 Tags QR Codes</h1>
        
        <div class="actions">
            <button onclick="window.print()">🖨️ Print All</button>
            <button onclick="exportCSV()">📊 Export CSV</button>
            <button onclick="exportJSON()">💾 Export JSON</button>
        </div>

        <div class="tags-grid" id="tagsGrid">
            ${tags.map((tag, index) => `
                <div class="tag-card">
                    <h3>Tag #${tag.tag_number}</h3>
                    <div class="tag-id">${tag.tag_id}</div>
                    <div class="tag-id" style="font-size: 12px;">Public ID: ${tag.public_id}</div>
                    
                    <div class="qr-container">
                        <div class="qr-label">Overlay QR (Claim)</div>
                        <div id="overlay-${index}"></div>
                    </div>
                    
                    <div class="qr-container">
                        <div class="qr-label">Base QR (Public Card)</div>
                        <div id="base-${index}"></div>
                    </div>
                    
                    <div class="url">${tag.overlay_qr_url}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        const tags = ${JSON.stringify(tags)};
        
        // Generate QR codes
        tags.forEach((tag, index) => {
            // Overlay QR
            QRCode.toCanvas(document.createElement('canvas'), tag.overlay_qr_url, {
                width: 200,
                margin: 2
            }, (err, canvas) => {
                if (!err) {
                    document.getElementById(\`overlay-\${index}\`).appendChild(canvas);
                }
            });
            
            // Base QR
            QRCode.toCanvas(document.createElement('canvas'), tag.base_qr_url, {
                width: 200,
                margin: 2
            }, (err, canvas) => {
                if (!err) {
                    document.getElementById(\`base-\${index}\`).appendChild(canvas);
                }
            });
        });
        
        function exportCSV() {
            const headers = ['Tag Number', 'Tag ID', 'Public ID', 'Claim Token', 'Overlay QR URL', 'Base QR URL', 'Status'];
            const rows = tags.map(t => [
                t.tag_number,
                t.tag_id,
                t.public_id,
                t.claim_token,
                t.overlay_qr_url,
                t.base_qr_url,
                t.status
            ]);
            
            const csv = [headers, ...rows].map(r => r.join(',')).join('\\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ranchlink-57-tags.csv';
            a.click();
        }
        
        function exportJSON() {
            const json = JSON.stringify(tags, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ranchlink-57-tags.json';
            a.click();
        }
    </script>
</body>
</html>`;

// Save files
const outputDir = path.join(__dirname, '..', 'nfc-tools');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, '57-tags-qr-codes.html'), html);
fs.writeFileSync(
    path.join(outputDir, '57-tags-data.json'),
    JSON.stringify(tags, null, 2)
);

// Generate CSV
const csvHeaders = ['Tag Number', 'Tag ID', 'Public ID', 'Claim Token', 'Overlay QR URL', 'Base QR URL', 'Status'];
const csvRows = tags.map(t => [
    t.tag_number,
    t.tag_id,
    t.public_id,
    t.claim_token,
    t.overlay_qr_url,
    t.base_qr_url,
    t.status
].join(','));
const csv = [csvHeaders.join(','), ...csvRows].join('\n');
fs.writeFileSync(path.join(outputDir, '57-tags-data.csv'), csv);

console.log('\n✅ Generated QR codes for 57 tags!\n');
console.log('📄 Files created:');
console.log(`   - ${path.join(outputDir, '57-tags-qr-codes.html')}`);
console.log(`   - ${path.join(outputDir, '57-tags-data.json')}`);
console.log(`   - ${path.join(outputDir, '57-tags-data.csv')}\n`);
console.log('🔖 Summary:');
console.log(`   - Total tags: 57`);
console.log(`   - Tag IDs: RL-001 to RL-057`);
console.log(`   - Public IDs: AUS0001 to AUS0057`);
console.log(`   - All tags have unique claim tokens\n`);
console.log('📱 Next steps:');
console.log('   1. Open 57-tags-qr-codes.html in your browser');
console.log('   2. Print QR codes for physical tags');
console.log('   3. Import CSV/JSON into database\n');

