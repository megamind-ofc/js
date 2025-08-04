const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { cmd } = require('../command');

// Configuration
const CDN_CONFIG = {
  BASE_URL: 'https://cdn-mrfrank.onrender.com',
  API_KEY: 'subzero', // Change this to your preferred key
  DEFAULT_PATH: 'media/'
};

// Helper functions
function getExtension(mimeType) {
  const extMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/': '.mp4',
    'audio/': '.mp3',
    'application/pdf': '.pdf'
  };
  for (const [prefix, ext] of Object.entries(extMap)) {
    if (mimeType.includes(prefix)) return ext;
  }
  return '.bin';
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

function cleanTempFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Temp file cleanup failed:', err);
    }
  }
}

function formatResponse(title, name, size, path, url) {
  return `*${title}*\n\n` +
         `📄 *Name:* ${name}\n` +
         `📦 *Size:* ${formatBytes(size)}\n` +
         `📂 *Path:* ${path}\n` +
         `🔗 *URL:* ${url}\n\n` +
         `> © Mr Frank OFC - CDN`;
}

// Command handler
cmd({
    pattern: 'cdn',
    alias: ['ghupload', 'cdnup'],
    react: '🔒',
    desc: 'Secure upload to GitHub CDN',
    category: 'utility',
    use: '.gitcdn [reply to media]',
    filename: __filename
}, async (client, message, args, { reply }) => {
    let tempFilePath;
    try {
        const quotedMsg = message.quoted || message;
        const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
        
        if (!mimeType) throw "Reply to media to upload";

        const mediaBuffer = await quotedMsg.download();
        tempFilePath = path.join(os.tmpdir(), `cdn_secure_${Date.now()}`);
        fs.writeFileSync(tempFilePath, mediaBuffer);

        const extension = getExtension(mimeType);
        const fileName = `file_${Date.now()}${extension}`;

        const form = new FormData();
        form.append('file', fs.createReadStream(tempFilePath), fileName);
        form.append('path', CDN_CONFIG.DEFAULT_PATH);

        const response = await axios.post(
            `${CDN_CONFIG.BASE_URL}/upload`, 
            form, 
            {
                headers: {
                    ...form.getHeaders(),
                    'X-API-Key': CDN_CONFIG.API_KEY
                }
            }
        );

        if (!response.data?.success) throw "Upload failed";
        
        await reply(formatResponse(
            'SECURE CDN Upload ✅',
            fileName,
            mediaBuffer.length,
            CDN_CONFIG.DEFAULT_PATH,
            response.data.cdnUrl
        ));

    } catch (error) {
        console.error('Secure CDN Error:', error);
        await reply(`❌ Error: ${error.message || error}`);
    } finally {
        cleanTempFile(tempFilePath);
    }
});

/*
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { cmd } = require('../command');

// Configuration
const CDN_CONFIG = {
  BASE_URL: 'https://cdn-mrfrank.onrender.com',
  API_KEY: 'subzero', // Change this to your preferred key
  DEFAULT_PATH: 'media/'
};

// Helper functions
function getExtension(mimeType) {
  const extMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/': '.mp4',
    'audio/': '.mp3',
    'application/pdf': '.pdf'
  };
  for (const [prefix, ext] of Object.entries(extMap)) {
    if (mimeType.includes(prefix)) return ext;
  }
  return '.bin';
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

function cleanTempFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Temp file cleanup failed:', err);
    }
  }
}

function formatResponse(title, name, size, path, url) {
  return `*${title}*\n\n` +
         `📄 *Name:* ${name}\n` +
         `📦 *Size:* ${formatBytes(size)}\n` +
         `📂 *Path:* ${path}\n` +
         `🔗 *URL:* ${url}\n\n` +
         `> © Mr Frank OFC - CDN`;
}

// Command handler
cmd({
    pattern: 'gitcdn',
    alias: ['ghupload', 'cdnup'],
    react: '🔒',
    desc: 'Secure upload to GitHub CDN',
    category: 'utility',
    use: '.gitcdn [filename] (when replying to media)',
    filename: __filename
}, async (client, message, { args, reply, quoted }) => {
    let tempFilePath;
    try {
        const mimeType = (quoted?.msg || message.msg).mimetype || '';
        
        if (!mimeType) throw "Reply to media to upload";

        const mediaBuffer = await (quoted || message).download();
        tempFilePath = path.join(os.tmpdir(), `cdn_secure_${Date.now()}`);
        fs.writeFileSync(tempFilePath, mediaBuffer);

        const extension = getExtension(mimeType);
        // Improved filename handling
        const customName = typeof args === 'string' ? args.trim().replace(/\s+/g, '_') : `file_${Date.now()}`;
        const fileName = customName.endsWith(extension) ? customName : `${customName}${extension}`;

        const form = new FormData();
        form.append('file', fs.createReadStream(tempFilePath), fileName);
        form.append('path', CDN_CONFIG.DEFAULT_PATH);

        const response = await axios.post(
            `${CDN_CONFIG.BASE_URL}/upload`, 
            form, 
            {
                headers: {
                    ...form.getHeaders(),
                    'X-API-Key': CDN_CONFIG.API_KEY
                }
            }
        );

        if (!response.data?.success) throw "Upload failed";
        
        await reply(formatResponse(
            'SECURE CDN Upload ✅',
            fileName,
            mediaBuffer.length,
            CDN_CONFIG.DEFAULT_PATH,
            response.data.cdnUrl
        ));

    } catch (error) {
        console.error('Secure CDN Error:', error);
        await reply(`❌ Error: ${error.message || error}`);
    } finally {
        cleanTempFile(tempFilePath);
    }
});
*/
