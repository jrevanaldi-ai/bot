import fs from 'fs';
import path from 'path';
import { logError, logEvent } from './logger.js';

export const setupGlobalErrorHandler = () => {
    process.on('unhandledRejection', (reason, promise) => {
        logError({
            message: `Unhandled Rejection at: ${promise}\nReason: ${reason}`,
            stack: reason instanceof Error ? reason.stack : 'No stack available'
        }, 'UNHANDLED_REJECTION');

        console.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
        logError(error, 'UNCAUGHT_EXCEPTION');

        console.error('Uncaught Exception:', error);

        process.exit(1);
    });

    process.on('SIGINT', () => {
        logEvent('PROCESS_TERMINATION', { signal: 'SIGINT' });
        console.log('Received SIGINT, shutting down gracefully...');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        logEvent('PROCESS_TERMINATION', { signal: 'SIGTERM' });
        console.log('Received SIGTERM, shutting down gracefully...');
        process.exit(0);
    });

    process.on('exit', (code) => {
        logEvent('PROCESS_EXIT', { code });
        console.log(`Process exited with code: ${code}`);
    });
};

export const handlePluginError = async (error, sock, m, commandName) => {
    try {
        logError(error, `PLUGIN_ERROR: ${commandName}`);

        const errorMessage = await sock.sendMessage(
            m.from,
            {
                text: `❌ Terjadi kesalahan saat menjalankan perintah "${commandName}".\n\nError: ${error.message || 'Unknown error'}`
            },
            { quoted: m }
        );

        setTimeout(async () => {
            try {
                await sock.sendMessage(m.from, { delete: errorMessage.key });
            } catch (deleteError) {
                console.error('Error deleting error message:', deleteError);
            }
        }, 10000);
    } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
    }
};

export const withErrorHandling = async (pluginFunction, sock, m, args) => {
    try {
        return await pluginFunction(sock, m, args);
    } catch (error) {
        await handlePluginError(error, sock, m, args.command || 'unknown');
        return null;
    }
};

export const handleConnectionError = (error, lastDisconnect) => {
    logError(error, 'CONNECTION_ERROR');

    const statusCode = lastDisconnect?.error?.output?.statusCode;

    switch (statusCode) {
        case 401:
            logEvent('SESSION_EXPIRED', { statusCode });
            console.log('Session expired, please re-scan QR code');
            break;
        case 405:
            logEvent('MULTIDEVICE_MISMATCH', { statusCode });
            console.log('Multidevice mismatch, please re-scan QR code');
            break;
        case 428:
            logEvent('LOGIN_APPROVAL_NEEDED', { statusCode });
            console.log('Login approval needed, please check your phone');
            break;
        default:
            logEvent('CONNECTION_FAILED', { statusCode, error: error.message });
            console.log('Connection failed, attempting to reconnect...');
    }

    return statusCode;
};

export const handleMessageError = (error, msg) => {
    logError(error, 'MESSAGE_ERROR');

    logEvent('FAILED_MESSAGE', {
        key: msg.key,
        type: msg.type,
        error: error.message
    });
};

export const handleDatabaseError = (error, operation) => {
    logError(error, `DATABASE_ERROR_${operation.toUpperCase()}`);

    console.error(`Database ${operation} error:`, error);

    return false;
};

export const handleMediaError = (error, mediaType) => {
    logError(error, `MEDIA_ERROR_${mediaType.toUpperCase()}`);

    console.error(`Media ${mediaType} error:`, error);

    return null;
};

export const createErrorWrapper = (fn, context = 'GENERAL') => {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            logError(error, context);
            throw error;
        }
    };
};