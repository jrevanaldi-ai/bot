import { sendLoadingMessage } from '../utils/messageUtils.js';

const pingPlugin = {
    tag: 'tools',

    cmd: ['ping', 'speed'],

    aliases: ['p', 'sp'],

    desc: 'Mengecek kecepatan respon bot',

    owner: false,

    run: async (sock, m, { args, fullText, prefix, command, db }) => {
        try {
            const editPing = await sendLoadingMessage(sock, m.from, 'Menghitung kecepatan...');

            const timestamp = Date.now();
            const speed = timestamp - (m.message.messageTimestamp * 1000);

            await editPing(`Pong! 🏓\nKecepatan: ${speed}ms`);

            return null;
        } catch (error) {
            console.error('Ping command error:', error);

            const errorMsg = await sock.sendMessage(m.from, { text: 'Terjadi kesalahan saat mengecek ping.' });
            setTimeout(async () => {
                await sock.sendMessage(m.from, { delete: errorMsg.key });
            }, 5000);

            return null;
        }
    }
};

export default pingPlugin;