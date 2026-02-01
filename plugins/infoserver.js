import os from 'os';
import { formatSize } from '../utils/helpers.js';
import { sendLoadingMessage } from '../utils/messageUtils.js';

const infoServerPlugin = {
    tag: 'info',

    cmd: ['infoserver', 'serverinfo', 'sysinfo'],

    aliases: ['info', 'si', 'sys'],

    desc: 'Menampilkan informasi tentang server tempat bot berjalan',

    owner: false,

    run: async (sock, m, { args, fullText, prefix, command, db }) => {
        try {
            const editInfo = await sendLoadingMessage(sock, m.from, 'Mengumpulkan informasi server...');

            const uptime = process.uptime();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            const cpuInfo = os.cpus()[0];
            const platform = os.platform();
            const arch = os.arch();
            const hostname = os.hostname();

            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            let infoText = '*Informasi Server*\n\n';
            infoText += `*Hostname:* ${hostname}\n`;
            infoText += `*Platform:* ${platform}\n`;
            infoText += `*Architecture:* ${arch}\n`;
            infoText += `*CPU:* ${cpuInfo.model}\n`;
            infoText += `*Core Count:* ${os.cpus().length}\n`;
            infoText += `*Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s\n\n`;

            infoText += '*Memory Usage*\n';
            infoText += `*Total:* ${formatSize(totalMemory)}\n`;
            infoText += `*Used:* ${formatSize(usedMemory)}\n`;
            infoText += `*Free:* ${formatSize(freeMemory)}\n`;
            infoText += `*Usage:* ${Math.round((usedMemory / totalMemory) * 100)}%\n\n`;

            infoText += `*Bot Uptime:* ${Math.floor(process.uptime())} seconds\n`;
            infoText += `*Node.js Version:* ${process.version}\n`;
            infoText += `*Baileys Version:* ${(await import('@whiskeysockets/baileys')).VERSION.join('.')}`;

            await editInfo(infoText);

            return null;
        } catch (error) {
            console.error('Infoserver command error:', error);

            const errorMsg = await sock.sendMessage(m.from, { text: 'Terjadi kesalahan saat mengambil informasi server.' });
            setTimeout(async () => {
                await sock.sendMessage(m.from, { delete: errorMsg.key });
            }, 5000);

            return null;
        }
    }
};

export default infoServerPlugin;