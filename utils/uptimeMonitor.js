import fs from 'fs';
import { format, differenceInMilliseconds, differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { logEvent, logError } from './logger.js';

const startTime = new Date();

const statsFile = './store/stats.json';

export const getUptime = () => {
    const currentTime = new Date();
    const diff = differenceInMilliseconds(currentTime, startTime);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        totalMs: diff,
        days,
        hours,
        minutes,
        seconds,
        formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        startTime: startTime.toISOString(),
        currentTime: currentTime.toISOString()
    };
};

export const getMessageStats = () => {
    try {
        if (!fs.existsSync(statsFile)) {
            return {
                totalMessages: 0,
                messagesToday: 0,
                commandsExecuted: 0,
                lastReset: new Date().toISOString()
            };
        }

        const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        return stats;
    } catch (error) {
        logError(error, 'GET_MESSAGE_STATS_FAILED');
        return {
            totalMessages: 0,
            messagesToday: 0,
            commandsExecuted: 0,
            lastReset: new Date().toISOString()
        };
    }
};

export const updateMessageStats = (type = 'message') => {
    try {
        let stats = getMessageStats();
        const today = format(new Date(), 'yyyy-MM-dd');
        const lastResetDay = format(new Date(stats.lastReset), 'yyyy-MM-dd');

        if (today !== lastResetDay) {
            stats.messagesToday = 0;
            stats.lastReset = new Date().toISOString();
        }

        if (type === 'message') {
            stats.totalMessages += 1;
            stats.messagesToday += 1;
        } else if (type === 'command') {
            stats.commandsExecuted += 1;
        }

        const dir = './store';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

        return stats;
    } catch (error) {
        logError(error, 'UPDATE_MESSAGE_STATS_FAILED');
    }
};

export const getFullStats = () => {
    const uptime = getUptime();
    const messageStats = getMessageStats();

    const systemStats = {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage ? process.cpuUsage() : null,
        uptime: process.uptime(),
        totalHeapSize: process.memoryUsage().heapTotal,
        usedHeapSize: process.memoryUsage().heapUsed,
        externalMemory: process.memoryUsage().external || 0
    };

    return {
        uptime,
        messageStats,
        systemStats,
        botInfo: {
            pid: process.pid,
            version: process.version,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd()
        }
    };
};

export const printStats = () => {
    const stats = getFullStats();

    const uptimeStr = `⏱️  Uptime: ${stats.uptime.formatted}`;
    const msgStr = `💬 Pesan: ${stats.messageStats.totalMessages} total, ${stats.messageStats.messagesToday} hari ini`;
    const cmdStr = `⚙️  Perintah: ${stats.messageStats.commandsExecuted} dijalankan`;
    const memStr = `💾 Memori: ${(stats.systemStats.usedHeapSize / 1024 / 1024).toFixed(2)} MB / ${(stats.systemStats.totalHeapSize / 1024 / 1024).toFixed(2)} MB`;

    const statsString = `
┌─ ${'\x1b[34m'}[BOT STATISTICS]${'\x1b[0m'}
├─ ${uptimeStr}
├─ ${msgStr}
├─ ${cmdStr}
├─ ${memStr}
└─ Started at: ${format(new Date(stats.uptime.startTime), 'dd/MM/yyyy HH:mm:ss', { locale: id })}
    `.trim();

    console.log(statsString);

    logEvent('STATS_PRINTED', {
        uptime: stats.uptime.formatted,
        totalMessages: stats.messageStats.totalMessages,
        messagesToday: stats.messageStats.messagesToday,
        commandsExecuted: stats.messageStats.commandsExecuted,
        memoryUsed: (stats.systemStats.usedHeapSize / 1024 / 1024).toFixed(2) + 'MB'
    });
};

export const getBriefStats = () => {
    const uptime = getUptime();
    const messageStats = getMessageStats();

    return {
        uptime: uptime.formatted,
        totalMessages: messageStats.totalMessages,
        messagesToday: messageStats.messagesToday,
        commandsExecuted: messageStats.commandsExecuted,
        memoryUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + 'MB'
    };
};

export const resetDailyStats = () => {
    try {
        let stats = getMessageStats();
        stats.messagesToday = 0;
        stats.lastReset = new Date().toISOString();

        const dir = './store';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

        logEvent('DAILY_STATS_RESET', {
            previousMessagesToday: stats.messagesToday,
            resetTime: new Date().toISOString()
        });

        console.log('📅 Statistik harian telah direset');
    } catch (error) {
        logError(error, 'RESET_DAILY_STATS_FAILED');
    }
};

export const startStatsMonitoring = (intervalMinutes = 30) => {
    const interval = intervalMinutes * 60 * 1000;

    logEvent('STATS_MONITORING_STARTED', { intervalMinutes });

    console.log(`📊 Monitoring statistik diaktifkan setiap ${intervalMinutes} menit`);

    printStats();

    const intervalId = setInterval(() => {
        printStats();

        const now = new Date();
        const lastReset = new Date(getMessageStats().lastReset);

        if (now.getDate() !== lastReset.getDate()) {
            resetDailyStats();
        }
    }, interval);

    return intervalId;
};

export const getStatsForMessage = () => {
    const stats = getFullStats();

    const statsText = `*📊 Statistik Bot*\n\n` +
        `*Uptime:* ${stats.uptime.formatted}\n` +
        `*Total Pesan:* ${stats.messageStats.totalMessages}\n` +
        `*Pesan Hari Ini:* ${stats.messageStats.messagesToday}\n` +
        `*Perintah Dieksekusi:* ${stats.messageStats.commandsExecuted}\n` +
        `*Memori Digunakan:* ${(stats.systemStats.usedHeapSize / 1024 / 1024).toFixed(2)} MB\n` +
        `*Total Memori:* ${(stats.systemStats.totalHeapSize / 1024 / 1024).toFixed(2)} MB\n` +
        `*Start Time:* ${format(new Date(stats.uptime.startTime), 'dd/MM/yyyy HH:mm:ss', { locale: id })}`;

    return statsText;
};