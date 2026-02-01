import {
    jidNormalizedUser,
    areJidsSameUser,
    isLidUser,
    isPnUser,
    jidDecode,
    isHostedPnUser,
    isHostedLidUser
} from '@whiskeysockets/baileys';
import { logEvent, logError } from './logger.js';

export const isLID = (jid) => {
    return isLidUser(jid);
};

export const isPN = (jid) => {
    return isPnUser(jid);
};

export const isHostedLID = (jid) => {
    return isHostedLidUser(jid);
};

export const isHostedPN = (jid) => {
    return isHostedPnUser(jid);
};

export const normalizeJid = (jid) => {
    return jidNormalizedUser(jid);
};

export const areSameUser = (jid1, jid2) => {
    return areJidsSameUser(jid1, jid2);
};

export const getJidInfo = (jid) => {
    try {
        const decoded = jidDecode(jid);
        if (!decoded) return null;

        return {
            user: decoded.user,
            server: decoded.server,
            device: decoded.device,
            domainType: decoded.domainType,
            isLID: decoded.server === 'lid',
            isPN: decoded.server === 's.whatsapp.net',
            isHosted: decoded.server === 'hosted',
            isHostedLID: decoded.server === 'hosted.lid',
            raw: jid
        };
    } catch (error) {
        logError(error, `GET_JID_INFO_FAILED: ${jid}`);
        return null;
    }
};

export const getAccountType = (jid) => {
    const info = getJidInfo(jid);
    if (!info) return 'invalid';

    if (info.isLID) return 'lid';
    if (info.isPN) return 'pn';
    if (info.isHosted) return 'hosted';
    if (info.isHostedLID) return 'hosted-lid';

    return 'other';
};

export const createJid = (user, server, device = undefined) => {
    const { jidEncode } = require('@whiskeysockets/baileys');
    return jidEncode(user, server, device);
};

export const formatJidForCommunication = (jid) => {
    const info = getJidInfo(jid);
    if (!info) return jid;

    return normalizeJid(jid);
};

export const validateJid = (jid) => {
    if (!jid || typeof jid !== 'string') return false;

    const jidPattern = /^[^@]+@[^@]+\.[^@]+$/;
    if (!jidPattern.test(jid)) return false;

    try {
        const decoded = jidDecode(jid);
        return decoded !== undefined && decoded.user !== undefined && decoded.server !== undefined;
    } catch (error) {
        logError(error, `VALIDATE_JID_FAILED: ${jid}`);
        return false;
    }
};

export const getUserId = (jid) => {
    const info = getJidInfo(jid);
    return info ? info.user : jid.split('@')[0];
};

export const getServer = (jid) => {
    const info = getJidInfo(jid);
    return info ? info.server : jid.split('@')[1];
};

export const formatJidDisplay = (jid, options = {}) => {
    const { showDevice = false, hideServer = false } = options;
    const info = getJidInfo(jid);

    if (!info) return jid;

    let display = info.user;

    if (showDevice && info.device !== undefined) {
        display += `:${info.device}`;
    }

    if (!hideServer) {
        display += `@${info.server}`;
    }

    return display;
};

export const isOwnJid = (jid, sock) => {
    if (!sock || !sock.user) return false;
    return areJidsSameUser(jid, sock.user.id);
};

export const jidToFilename = (jid) => {
    return jid.replace(/[^a-zA-Z0-9-_]/g, '_');
};

logEvent('LID_FUNCTIONS_LOADED', {
    timestamp: new Date().toISOString(),
    functions: [
        'isLID', 'isPN', 'isHostedLID', 'isHostedPN', 'normalizeJid',
        'areSameUser', 'getJidInfo', 'getAccountType', 'createJid',
        'formatJidForCommunication', 'validateJid', 'getUserId',
        'getServer', 'formatJidDisplay', 'isOwnJid', 'jidToFilename'
    ]
});