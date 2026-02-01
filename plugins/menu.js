import { readdirSync } from 'fs';
import { join } from 'path';
import { sendLoadingMessage } from '../utils/messageUtils.js';

const menuPlugin = {
    tag: 'main',

    cmd: ['menu', 'help'],

    aliases: ['m', 'h'],

    desc: 'Menampilkan daftar menu perintah yang tersedia',

    owner: false,

    run: async (sock, m, { args, fullText, prefix, command, db }) => {
        try {
            const pluginDir = './plugins';
            const files = readdirSync(join(process.cwd(), 'plugins'));

            const menuGroups = {};

            const plugins = [];
            for (const file of files) {
                if (file.endsWith('.js')) {
                    try {
                        const pluginModule = await import(`../plugins/${file}`);
                        const plugin = pluginModule.default || pluginModule;

                        if (plugin && plugin.tag && plugin.cmd) {
                            plugins.push(plugin);

                            if (!menuGroups[plugin.tag]) {
                                menuGroups[plugin.tag] = [];
                            }

                            menuGroups[plugin.tag].push({
                                cmd: plugin.cmd[0],
                                aliases: plugin.aliases || [],
                                desc: plugin.desc || 'No description'
                            });
                        }
                    } catch (e) {
                        console.error(`Error loading plugin ${file}:`, e);
                    }
                }
            }

            let menuText = '*Astralune Bot Menu*\n\n';

            menuText += `*User:* ${m.sender.split('@')[0]}\n`;
            menuText += `*Prefix:* ${prefix || 'none'}\n\n`;

            for (const [tag, cmds] of Object.entries(menuGroups)) {
                menuText += `*${tag.toUpperCase()}*\n`;

                for (const cmd of cmds) {
                    let cmdText = `\n• *${prefix}${cmd.cmd}*`;

                    if (cmd.aliases.length > 0) {
                        cmdText += ` (aliases: ${cmd.aliases.map(a => prefix + a).join(', ')})`;
                    }

                    if (cmd.desc) {
                        cmdText += `\n  _${cmd.desc}_`;
                    }

                    menuText += cmdText + '\n';
                }

                menuText += '\n';
            }

            menuText += `Powered by *Astralune Bot*\n`;
            menuText += `Total Commands: ${plugins.length}`;

            await sock.sendMessage(
                m.from,
                {
                    text: menuText,
                    contextInfo: {
                        externalAdReply: {
                            title: 'Astralune Bot',
                            body: 'WhatsApp Bot Multi Device',
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
            console.error('Menu command error:', error);

            const errorMsg = await sock.sendMessage(m.from, { text: 'Terjadi kesalahan saat menampilkan menu.' });
            setTimeout(async () => {
                await sock.sendMessage(m.from, { delete: errorMsg.key });
            }, 5000);

            return null;
        }
    }
};

export default menuPlugin;