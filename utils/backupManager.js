import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logEvent, logError } from './logger.js';

const execAsync = promisify(exec);

export const createBackup = async (dbPath = './store/bot_data.db', backupDir = './backups') => {
    try {
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `backup-${timestamp}.db`;
        const backupPath = path.join(backupDir, backupFileName);

        fs.copyFileSync(dbPath, backupPath);

        logEvent('DATABASE_BACKUP_CREATED', {
            source: dbPath,
            destination: backupPath,
            timestamp
        });

        console.log(`✅ Backup database berhasil: ${backupPath}`);
        return backupPath;
    } catch (error) {
        logError(error, 'DATABASE_BACKUP_FAILED');
        console.error('❌ Gagal membuat backup database:', error.message);
        throw error;
    }
};

export const scheduleAutoBackup = (intervalHours = 24, dbPath = './store/bot_data.db', backupDir = './backups') => {
    const intervalMs = intervalHours * 60 * 60 * 1000;

    logEvent('AUTO_BACKUP_SCHEDULED', {
        intervalHours,
        intervalMs,
        dbPath,
        backupDir
    });

    createBackup(dbPath, backupDir).catch(console.error);

    const intervalId = setInterval(async () => {
        try {
            await createBackup(dbPath, backupDir);
        } catch (error) {
            console.error('Gagal menjalankan backup otomatis:', error);
        }
    }, intervalMs);

    console.log(`🔄 Backup otomatis dijadwalkan setiap ${intervalHours} jam`);

    return intervalId;
};

export const cleanupOldBackups = async (backupDir = './backups', daysToKeep = 7) => {
    try {
        if (!fs.existsSync(backupDir)) {
            return;
        }

        const files = fs.readdirSync(backupDir);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const deletedFiles = [];

        for (const file of files) {
            const filePath = path.join(backupDir, file);
            const stat = fs.statSync(filePath);

            if (stat.mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                deletedFiles.push(file);
            }
        }

        if (deletedFiles.length > 0) {
            logEvent('OLD_BACKUPS_CLEANED', {
                count: deletedFiles.length,
                files: deletedFiles,
                cutoffDate: cutoffDate.toISOString()
            });

            console.log(`🗑️  Dihapus ${deletedFiles.length} backup lama`);
        } else {
            console.log(`✅ Tidak ada backup lama untuk dihapus`);
        }
    } catch (error) {
        logError(error, 'BACKUP_CLEANUP_FAILED');
        console.error('❌ Gagal membersihkan backup lama:', error.message);
    }
};

export const restoreFromBackup = async (backupPath, dbPath = './store/bot_data.db') => {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`File backup tidak ditemukan: ${backupPath}`);
        }

        const currentBackupPath = await createBackup(dbPath, './backups/restore-backups');

        fs.copyFileSync(backupPath, dbPath);

        logEvent('DATABASE_RESTORED', {
            backupPath,
            dbPath,
            previousBackup: currentBackupPath
        });

        console.log(`✅ Database berhasil dipulihkan dari: ${backupPath}`);
        return true;
    } catch (error) {
        logError(error, 'DATABASE_RESTORE_FAILED');
        console.error('❌ Gagal memulihkan database:', error.message);
        throw error;
    }
};

export const listBackups = async (backupDir = './backups') => {
    try {
        if (!fs.existsSync(backupDir)) {
            return [];
        }

        const files = fs.readdirSync(backupDir);
        const backups = [];

        for (const file of files) {
            if (file.endsWith('.db')) {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);

                backups.push({
                    name: file,
                    path: filePath,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                });
            }
        }

        backups.sort((a, b) => b.createdAt - a.createdAt);

        logEvent('BACKUP_LIST_RETRIEVED', {
            count: backups.length,
            backupDir
        });

        return backups;
    } catch (error) {
        logError(error, 'BACKUP_LIST_FAILED');
        console.error('❌ Gagal mendapatkan daftar backup:', error.message);
        return [];
    }
};

export const createCompressedBackup = async (dbPath = './store/bot_data.db', backupDir = './backups') => {
    try {
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `backup-${timestamp}.db.gz`;
        const backupPath = path.join(backupDir, backupFileName);

        const command = `gzip -c ${dbPath} > ${backupPath}`;

        await execAsync(command);

        logEvent('COMPRESSED_DATABASE_BACKUP_CREATED', {
            source: dbPath,
            destination: backupPath,
            timestamp
        });

        console.log(`✅ Backup database terkompresi berhasil: ${backupPath}`);
        return backupPath;
    } catch (error) {
        logError(error, 'COMPRESSED_DATABASE_BACKUP_FAILED');
        console.error('❌ Gagal membuat backup database terkompresi:', error.message);

        return await createBackup(dbPath, backupDir);
    }
};

export const createNamedBackup = async (name, dbPath = './store/bot_data.db', backupDir = './backups') => {
    try {
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const backupFileName = `backup-${name}-${Date.now()}.db`;
        const backupPath = path.join(backupDir, backupFileName);

        fs.copyFileSync(dbPath, backupPath);

        logEvent('NAMED_DATABASE_BACKUP_CREATED', {
            name,
            source: dbPath,
            destination: backupPath
        });

        console.log(`✅ Backup database dengan nama '${name}' berhasil: ${backupPath}`);
        return backupPath;
    } catch (error) {
        logError(error, 'NAMED_DATABASE_BACKUP_FAILED');
        console.error('❌ Gagal membuat backup database dengan nama:', error.message);
        throw error;
    }
};