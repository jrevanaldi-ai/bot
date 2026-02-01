import { getStatsForMessage } from '../utils/uptimeMonitor.js';

const statsPlugin = {
    tag: 'info',

    cmd: ['stats', 'statistic', 'statistika'],

    aliases: ['st', 'information', 'info'],

    desc: 'Menampilkan statistik penggunaan bot',

    owner: false,

    run: async (sock, m, { args, fullText, prefix, command, db }) => {
        try {
            const statsText = getStatsForMessage();

            await sock.sendMessage(
                m.from,
                {
                    text: statsText,
                    contextInfo: {
                        externalAdReply: {
                            title: 'Astralune Bot Statistics',
                            body: 'Statistik Penggunaan Bot',
                            thumbnailUrl: 'https://telegra.ph/file/7f1e5bf1a54e4de1ef0da.jpg',
                            sourceUrl: 'https://github.com/username/astralune-bot',
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                },
                { quoted: m }
            );

            return null;
        } catch (error) {
            console.error('Stats command error:', error);

            const errorMsg = await sock.sendMessage(m.from, { text: 'Terjadi kesalahan saat mengambil statistik.' });
            setTimeout(async () => {
                await sock.sendMessage(m.from, { delete: errorMsg.key });
            }, 5000);

            return null;
        }
    }
};

export default statsPlugin;