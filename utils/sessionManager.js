import fs from 'fs';
import path from 'path';
import { logEvent, logError } from './logger.js';

const SESSION_DIR = './store/session';

const ensureSessionDir = () => {
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }
};

export const saveSession = async (sessionId, sessionData) => {
    try {
        ensureSessionDir();

        const sessionPath = path.join(SESSION_DIR, `${sessionId}.json`);
        const sessionObj = {
            id: sessionId,
            data: sessionData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(sessionPath, JSON.stringify(sessionObj, null, 2));

        logEvent('SESSION_SAVED', {
            sessionId,
            sessionPath
        });

        console.log(`🔒 Session ${sessionId} berhasil disimpan`);
        return true;
    } catch (error) {
        logError(error, `SAVE_SESSION_FAILED: ${sessionId}`);
        console.error(`❌ Gagal menyimpan session ${sessionId}:`, error.message);
        return false;
    }
};

export const loadSession = async (sessionId) => {
    try {
        const sessionPath = path.join(SESSION_DIR, `${sessionId}.json`);

        if (!fs.existsSync(sessionPath)) {
            logEvent('SESSION_NOT_FOUND', { sessionId });
            return null;
        }

        const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));

        logEvent('SESSION_LOADED', {
            sessionId,
            lastUpdated: sessionData.updatedAt
        });

        return sessionData;
    } catch (error) {
        logError(error, `LOAD_SESSION_FAILED: ${sessionId}`);
        console.error(`❌ Gagal memuat session ${sessionId}:`, error.message);
        return null;
    }
};

export const deleteSession = async (sessionId) => {
    try {
        const sessionPath = path.join(SESSION_DIR, `${sessionId}.json`);

        if (!fs.existsSync(sessionPath)) {
            logEvent('DELETE_NONEXISTENT_SESSION', { sessionId });
            return false;
        }

        fs.unlinkSync(sessionPath);

        logEvent('SESSION_DELETED', { sessionId });

        console.log(`🔓 Session ${sessionId} berhasil dihapus`);
        return true;
    } catch (error) {
        logError(error, `DELETE_SESSION_FAILED: ${sessionId}`);
        console.error(`❌ Gagal menghapus session ${sessionId}:`, error.message);
        return false;
    }
};

export const getAllSessions = async () => {
    try {
        if (!fs.existsSync(SESSION_DIR)) {
            return [];
        }

        const files = fs.readdirSync(SESSION_DIR);
        const sessions = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const sessionId = file.replace('.json', '');
                const sessionPath = path.join(SESSION_DIR, file);
                const stats = fs.statSync(sessionPath);

                sessions.push({
                    id: sessionId,
                    path: sessionPath,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    updatedAt: stats.mtime
                });
            }
        }

        logEvent('ALL_SESSIONS_RETRIEVED', { count: sessions.length });

        return sessions;
    } catch (error) {
        logError(error, 'GET_ALL_SESSIONS_FAILED');
        console.error('❌ Gagal mendapatkan daftar session:', error.message);
        return [];
    }
};

export const cleanupExpiredSessions = async (maxAgeHours = 24) => {
    try {
        const sessions = await getAllSessions();
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);

        const expiredSessions = sessions.filter(session => session.updatedAt < cutoffTime);
        const deletedSessions = [];

        for (const session of expiredSessions) {
            if (await deleteSession(session.id)) {
                deletedSessions.push(session.id);
            }
        }

        logEvent('EXPIRED_SESSIONS_CLEANED', {
            maxAgeHours,
            totalSessions: sessions.length,
            expiredCount: expiredSessions.length,
            deletedCount: deletedSessions.length,
            deletedSessions
        });

        console.log(`🧹 Dihapus ${deletedSessions.length} session yang kadaluarsa`);
        return deletedSessions;
    } catch (error) {
        logError(error, 'CLEANUP_EXPIRED_SESSIONS_FAILED');
        console.error('❌ Gagal membersihkan session kadaluarsa:', error.message);
        return [];
    }
};

export const updateSessionData = async (sessionId, newData) => {
    try {
        const existingSession = await loadSession(sessionId);

        if (!existingSession) {
            logEvent('UPDATE_NONEXISTENT_SESSION', { sessionId });
            return false;
        }

        const updatedSession = {
            ...existingSession,
            data: { ...existingSession.data, ...newData },
            updatedAt: new Date().toISOString()
        };

        const sessionPath = path.join(SESSION_DIR, `${sessionId}.json`);
        fs.writeFileSync(sessionPath, JSON.stringify(updatedSession, null, 2));

        logEvent('SESSION_DATA_UPDATED', {
            sessionId,
            updatedFields: Object.keys(newData)
        });

        console.log(`🔄 Data session ${sessionId} berhasil diperbarui`);
        return true;
    } catch (error) {
        logError(error, `UPDATE_SESSION_DATA_FAILED: ${sessionId}`);
        console.error(`❌ Gagal memperbarui data session ${sessionId}:`, error.message);
        return false;
    }
};

export const getSessionData = async (sessionId, key = null) => {
    try {
        const session = await loadSession(sessionId);

        if (!session) {
            return null;
        }

        if (key) {
            return session.data[key] || null;
        }

        return session.data;
    } catch (error) {
        logError(error, `GET_SESSION_DATA_FAILED: ${sessionId}`);
        console.error(`❌ Gagal mendapatkan data session ${sessionId}:`, error.message);
        return null;
    }
};

export const createSession = async (sessionId, initialData = {}) => {
    try {
        const existingSession = await loadSession(sessionId);

        if (existingSession) {
            logEvent('CREATE_EXISTING_SESSION', { sessionId });
            return false;
        }

        const sessionData = {
            ...initialData,
            createdAt: new Date().toISOString(),
            active: true
        };

        return await saveSession(sessionId, sessionData);
    } catch (error) {
        logError(error, `CREATE_SESSION_FAILED: ${sessionId}`);
        console.error(`❌ Gagal membuat session ${sessionId}:`, error.message);
        return false;
    }
};

export class SessionManager {
    constructor(maxAgeHours = 24) {
        this.maxAgeHours = maxAgeHours;
        ensureSessionDir();
    }

    async getUserSession(userJid) {
        const sessionId = this.getSessionIdFromJid(userJid);
        return await loadSession(sessionId);
    }

    async setUserSession(userJid, data) {
        const sessionId = this.getSessionIdFromJid(userJid);
        return await saveSession(sessionId, data);
    }

    async getUserSessionData(userJid, key = null) {
        const sessionId = this.getSessionIdFromJid(userJid);
        return await getSessionData(sessionId, key);
    }

    async updateUserSessionData(userJid, data) {
        const sessionId = this.getSessionIdFromJid(userJid);
        return await updateSessionData(sessionId, data);
    }

    async deleteUserSession(userJid) {
        const sessionId = this.getSessionIdFromJid(userJid);
        return await deleteSession(sessionId);
    }

    getSessionIdFromJid(jid) {
        return jid.replace(/[^a-zA-Z0-9]/g, '_');
    }

    async cleanupInactiveUserSessions() {
        return await cleanupExpiredSessions(this.maxAgeHours);
    }

    async isUserSessionActive(userJid) {
        const session = await this.getUserSession(userJid);
        if (!session) return false;

        const updatedAt = new Date(session.updatedAt);
        const now = new Date();
        const maxAgeMs = this.maxAgeHours * 60 * 60 * 1000;

        return (now - updatedAt) < maxAgeMs;
    }
}

export const getSessionManager = (maxAgeHours = 24) => {
    return new SessionManager(maxAgeHours);
};