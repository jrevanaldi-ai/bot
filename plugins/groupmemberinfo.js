import { jidNormalizedUser, areJidsSameUser, isLidUser, isPnUser } from '@whiskeysockets/baileys';

const groupMemberInfoPlugin = {
    tag: 'group',

    cmd: ['memberinfo', 'infomember', 'cekmember'],

    aliases: ['mi', 'infomem', 'cm'],

    desc: 'Menampilkan informasi tentang anggota grup',

    owner: false,

    run: async (sock, m, { args, fullText, prefix, command, db }) => {
        try {
            if (!m.isGroup) {
                const errorMsg = await sock.sendMessage(
                    m.from,
                    { text: 'Perintah ini hanya bisa digunakan di dalam grup.' },
                    { quoted: m }
                );

                setTimeout(async () => {
                    await sock.sendMessage(m.from, { delete: errorMsg.key });
                }, 5000);

                return null;
            }

            const groupMetadata = await sock.groupMetadata(m.from);
            const participants = groupMetadata.participants;

            let targetMembers = participants;
            if (args.length > 0) {
                const mentionedJids = m.msg?.contextInfo?.mentionedJid || [];
                if (mentionedJids.length > 0) {
                    targetMembers = participants.filter(p =>
                        mentionedJids.some(mention => areJidsSameUser(p.id, mention))
                    );
                } else {
                    const searchNumber = args[0].replace(/[^0-9]/g, '');
                    targetMembers = participants.filter(p =>
                        p.id.startsWith(searchNumber)
                    );
                }
            }

            if (targetMembers.length === 0) {
                const errorMsg = await sock.sendMessage(
                    m.from,
                    { text: 'Anggota tidak ditemukan.' },
                    { quoted: m }
                );

                setTimeout(async () => {
                    await sock.sendMessage(m.from, { delete: errorMsg.key });
                }, 5000);

                return null;
            }

            let infoText = `*Informasi Anggota Grup*\n\n`;
            infoText += `*Grup:* ${groupMetadata.subject}\n`;
            infoText += `*Jumlah Anggota:* ${participants.length}\n\n`;

            for (const member of targetMembers) {
                const isAdmin = member.admin === 'admin' || member.admin === 'superadmin';
                const isSuperAdmin = member.admin === 'superadmin';

                const normalizedJid = jidNormalizedUser(member.id);
                const isLidAcc = isLidUser(member.id);
                const isPnAcc = isPnUser(member.id);

                infoText += `*Nama:* ${member.name || member.displayName || 'Tidak diketahui'}\n`;
                infoText += `*JID:* ${normalizedJid}\n`;
                infoText += `*Tipe Akun:* ${isLidAcc ? 'LID' : isPnAcc ? 'PN' : 'Lainnya'}\n`;
                infoText += `*Admin:* ${isAdmin ? (isSuperAdmin ? 'Super Admin' : 'Admin') : 'Bukan Admin'}\n`;
                infoText += `*Nomor:* ${member.id.split('@')[0]}\n\n`;
            }

            await sock.sendMessage(
                m.from,
                {
                    text: infoText,
                    contextInfo: {
                        externalAdReply: {
                            title: 'Astralune Bot - Group Member Info',
                            body: 'Informasi tentang anggota grup',
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
            console.error('Group member info command error:', error);

            const errorMsg = await sock.sendMessage(m.from, { text: 'Terjadi kesalahan saat mengambil informasi anggota grup.' });
            setTimeout(async () => {
                await sock.sendMessage(m.from, { delete: errorMsg.key });
            }, 5000);

            return null;
        }
    }
};

export default groupMemberInfoPlugin;