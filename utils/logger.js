import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const ensureLogDir = () => {
    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs', { recursive: true });
    }
};

export const logToFile = (level, message, data = null) => {
    ensureLogDir();
    const timestamp = new Date();
    const formattedDate = format(timestamp, 'yyyy-MM-dd HH:mm:ss', { locale: id });
    const logEntry = `[${formattedDate}] [${level}] ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}\n`;

    fs.appendFileSync(`./logs/${format(timestamp, 'yyyy-MM-dd', { locale: id })}.log`, logEntry);
};

export const logColored = (level, message, data = null) => {
    const timestamp = format(new Date(), 'HH:mm:ss', { locale: id });
    const colors = {
        info: '\x1b[36m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        success: '\x1b[32m',
        reset: '\x1b[0m'
    };

    const color = colors[level] || colors.reset;
    const logMessage = `${color}[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}${colors.reset}`;

    console.log(logMessage);

    logToFile(level, message, data);
};

export const logIncomingMessage = (m, senderName) => {
    const timestamp = format(new Date(), 'HH:mm:ss', { locale: id });
    const sender = m.sender.split('@')[0];
    const from = m.from.endsWith('@g.us') ? 'GROUP' : 'PRIVATE';

    const messagePreview = m.text ? `"${m.text.substring(0, 30)}${m.text.length > 30 ? '...' : ''}"` : '[MEDIA/PESAN LAIN]';

    const logMessage = `
┌─ ${'\x1b[32m'}[NEW MESSAGE]${'\x1b[0m'}
├─ Sender: ${senderName || sender}
├─ ID: ${sender}
├─ From: ${from}
├─ Message: ${messagePreview}
└─ Time: ${timestamp}
    `.trim();

    console.log(logMessage);

    logToFile('info', `New message from ${senderName || sender} (${sender}) in ${from}: ${m.text || '[MEDIA/PESAN LAIN]'}`, {
        sender: m.sender,
        from: m.from,
        type: m.type,
        timestamp: new Date().toISOString()
    });
};

export const logCommandExecution = (command, sender, success = true) => {
    const timestamp = format(new Date(), 'HH:mm:ss', { locale: id });
    const senderId = sender.split('@')[0];

    const status = success ? `${'\x1b[32m'}SUCCESS${'\x1b[0m'}` : `${'\x1b[31m'}FAILED${'\x1b[0m'}`;

    const logMessage = `
┌─ ${'\x1b[33m'}[COMMAND EXECUTION]${'\x1b[0m'}
├─ Command: ${command}
├─ User: ${senderId}
├─ Status: ${status}
└─ Time: ${timestamp}
    `.trim();

    console.log(logMessage);

    logToFile(success ? 'info' : 'error', `Command ${command} executed by ${senderId} - ${success ? 'SUCCESS' : 'FAILED'}`, {
        command,
        sender,
        success,
        timestamp: new Date().toISOString()
    });
};

export const logError = (error, context = '') => {
    const timestamp = format(new Date(), 'HH:mm:ss', { locale: id });

    const logMessage = `
┌─ ${'\x1b[31m'}[ERROR]${'\x1b[0m'}
├─ Context: ${context}
├─ Message: ${error.message}
├─ Stack: ${error.stack ? error.stack.split('\n')[1]?.trim() : 'No stack trace'}
└─ Time: ${timestamp}
    `.trim();

    console.error(logMessage);

    logToFile('error', `Error in ${context}: ${error.message}`, {
        context,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
};

export const logConnection = (status, details = null) => {
    const timestamp = format(new Date(), 'HH:mm:ss', { locale: id });

    const statusColors = {
        connecting: '\x1b[33m',
        connected: '\x1b[32m',
        disconnected: '\x1b[31m',
        reconnecting: '\x1b[35m'
    };

    const color = statusColors[status] || '\x1b[0m';
    const statusText = status.toUpperCase();

    const logMessage = `
┌─ ${color}[CONNECTION]${'\x1b[0m'}
├─ Status: ${statusText}
├─ Details: ${details || 'No details'}
└─ Time: ${timestamp}
    `.trim();

    console.log(logMessage);

    logToFile('info', `Connection status: ${status}`, {
        status,
        details,
        timestamp: new Date().toISOString()
    });
};

export const logEvent = (eventName, data = null) => {
    const timestamp = format(new Date(), 'HH:mm:ss', { locale: id });

    const logMessage = `
┌─ ${'\x1b[36m'}[EVENT]${'\x1b[0m'}
├─ Event: ${eventName}
${data ? `├─ Data: ${JSON.stringify(data)}\n` : ''}
└─ Time: ${timestamp}
    `.trim();

    console.log(logMessage);

    logToFile('info', `Event: ${eventName}`, {
        eventName,
        data,
        timestamp: new Date().toISOString()
    });
};

export const cleanupOldLogs = (daysToKeep = 7) => {
    ensureLogDir();

    const files = fs.readdirSync('./logs');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    files.forEach(file => {
        const filePath = path.join('./logs', file);
        const stat = fs.statSync(filePath);
        if (stat.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            logColored('info', `Deleted old log file: ${file}`);
        }
    });
};