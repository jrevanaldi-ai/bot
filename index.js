import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    proto,
    getContentType
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import Pino from 'pino';
import { connectDB } from './lib/database.js';
import { loadPlugins } from './lib/pluginLoader.js';
import { Handler } from './handlers/mainHandler.js';
import { initializeDirectories } from './lib/initDirs.js';
import { setupGlobalErrorHandler } from './utils/errorHandler.js';
import { scheduleAutoBackup } from './utils/backupManager.js';
import { monitorCrashAndRestart } from './utils/autoRestart.js';
import { startStatsMonitoring, getBriefStats } from './utils/uptimeMonitor.js';
import { scheduleAutoPluginUpdate } from './utils/pluginUpdater.js';
import { logConnection } from './utils/logger.js';

initializeDirectories();

setupGlobalErrorHandler();

const db = await connectDB();

const plugins = await loadPlugins('./plugins');

startStatsMonitoring(30);

scheduleAutoBackup(24);

scheduleAutoPluginUpdate(12);

monitorCrashAndRestart();

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./store');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`Using Baileys v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: Pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: 'silent' }).child({ level: 'silent' }))
        },
        browser: ['Chrome', 'Safari', '1.0.0'],
        getMessage: async (key) => {
        }
    });

    sock.ev.process(async (events) => {
        if (events['connection.update']) {
            const { connection, lastDisconnect, qr } = events['connection.update'];

            if (qr) {
                setTimeout(() => {
                    console.log('Silakan scan kode QR dalam 3 detik...');
                    require('qrcode-terminal').generate(qr, { small: true });
                }, 3000);
            }

            if (connection === 'close') {
                logConnection('disconnected', lastDisconnect?.error?.output?.statusCode);

                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    console.log('Koneksi terputus, mencoba menyambung kembali dalam 5 detik...');
                    logConnection('reconnecting');
                    setTimeout(() => {
                        console.log('Mencoba menyambung kembali...');
                        connectToWhatsApp();
                    }, 5000);
                } else {
                    logConnection('closed', lastDisconnect?.error?.output?.statusCode);
                    console.log('Koneksi ditutup, alasan:', lastDisconnect?.error?.output?.statusCode);
                }
            } else if (connection === 'open') {
                logConnection('connected');
                console.log('Koneksi berhasil dibuka!');

                console.log('\n' + '='.repeat(50));
                console.log('🤖 ASTRALUNE BOT BERHASIL DIAKTIFKAN!');
                console.log('💡 Tips: Gunakan .menu untuk melihat daftar perintah');
                console.log('📈 Statistik Awal:');
                const stats = getBriefStats();
                console.log(`   Uptime: ${stats.uptime}`);
                console.log(`   Total Pesan: ${stats.totalMessages}`);
                console.log(`   Pesan Hari Ini: ${stats.messagesToday}`);
                console.log(`   Perintah: ${stats.commandsExecuted}`);
                console.log('='.repeat(50) + '\n');
            }
        }

        if (events['creds.update']) {
            await saveCreds();
        }

        if (events['messages.upsert']) {
            const { messages } = events['messages.upsert'];
            const msg = messages[0];

            if (!msg.message) return;

            await Handler(sock, msg, db, plugins);
        }
    });
}

connectToWhatsApp();

export { db };