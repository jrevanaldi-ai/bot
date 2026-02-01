import { 
    isLID, 
    isPN, 
    getAccountType, 
    getJidInfo,
    formatJidDisplay
} from '../utils/lidFunctions.js';

const lidDemoPlugin = {
    tag: 'tools',
    
    cmd: ['lidtest', 'liddemo', 'cekakun'],
    
    aliases: ['lt', 'ld', 'ca'],
    
    desc: 'Demo penggunaan fungsi-fungsi LID',
    
    owner: false,
    
    run: async (sock, m, { args, fullText, prefix, command, db }) => {
        try {
            const isLidAccount = isLID(m.sender);
            const isPnAccount = isPN(m.sender);
            const accountType = getAccountType(m.sender);
            const jidInfo = getJidInfo(m.sender);
            
            let groupInfo = '';
            if (m.isGroup) {
                const sampleMembers = m.groupMembersLidInfo.slice(0, 3);
                groupInfo = `\n\n*Contoh Anggota Grup:*\n`;
                
                for (const member of sampleMembers) {
                    groupInfo += `- ${member.name || member.id}: ${member.accountType}\n`;
                }
                
                if (m.groupMembersLidInfo.length > 3) {
                    groupInfo += `... dan ${m.groupMembersLidInfo.length - 3} lainnya\n`;
                }
            }
            
            let result = `*Demo Fungsi LID*\n\n`;
            result += `*JID Pengirim:* ${formatJidDisplay(m.sender, { showDevice: true })}\n`;
            result += `*Tipe Akun:* ${accountType}\n`;
            result += `*Apakah LID:* ${isLidAccount ? '✅ Ya' : '❌ Tidak'}\n`;
            result += `*Apakah PN:* ${isPnAccount ? '✅ Ya' : '❌ Tidak'}\n`;
            
            if (jidInfo) {
                result += `\n*Detail JID:*\n`;
                result += `- User: ${jidInfo.user}\n`;
                result += `- Server: ${jidInfo.server}\n`;
                result += `- Device: ${jidInfo.device !== undefined ? jidInfo.device : 'N/A'}\n`;
                result += `- Domain Type: ${jidInfo.domainType}\n`;
            }
            
            result += groupInfo;
            result += `\n*Catatan:* Fungsi-fungsi LID memungkinkan bot untuk menangani berbagai jenis akun dengan benar.`;
            
            await sock.sendMessage(
                m.from,
                {
                    text: result,
                    contextInfo: {
                        externalAdReply: {
                            title: 'Astralune Bot - LID Demo',
                            body: 'Demo penggunaan fungsi-fungsi LID',
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
            console.error('LID demo command error:', error);
            
            const errorMsg = await sock.sendMessage(m.from, { text: 'Terjadi kesalahan saat menjalankan demo LID.' });
            setTimeout(async () => {
                await sock.sendMessage(m.from, { delete: errorMsg.key });
            }, 5000);
            
            return null;
        }
    }
};

export default lidDemoPlugin;