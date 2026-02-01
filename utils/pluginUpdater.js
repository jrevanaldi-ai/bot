import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logEvent, logError } from './logger.js';

const execAsync = promisify(exec);

export const checkPluginUpdates = async (pluginDir = './plugins') => {
    try {
        if (!fs.existsSync(pluginDir)) {
            logError(new Error(`Plugin directory does not exist: ${pluginDir}`), 'CHECK_PLUGIN_UPDATES_FAILED');
            return [];
        }

        const files = fs.readdirSync(pluginDir);
        const plugins = files.filter(file => file.endsWith('.js'));

        logEvent('PLUGIN_UPDATE_CHECK_COMPLETED', {
            pluginDir,
            pluginCount: plugins.length
        });

        return plugins;
    } catch (error) {
        logError(error, 'CHECK_PLUGIN_UPDATES_FAILED');
        return [];
    }
};

export const updatePluginFromSource = async (pluginName, sourceUrl) => {
    try {
        if (!pluginName.endsWith('.js')) {
            pluginName += '.js';
        }

        const pluginPath = path.join('./plugins', pluginName);

        const { stdout, stderr } = await execAsync(`curl -o ${pluginPath} ${sourceUrl}`);

        if (stderr) {
            throw new Error(stderr);
        }

        logEvent('PLUGIN_UPDATED_FROM_SOURCE', {
            pluginName,
            sourceUrl,
            pluginPath
        });

        console.log(`✅ Plugin ${pluginName} berhasil diperbarui dari sumber`);
        return true;
    } catch (error) {
        logError(error, `UPDATE_PLUGIN_FROM_SOURCE_FAILED: ${pluginName}`);
        console.error(`❌ Gagal memperbarui plugin ${pluginName} dari sumber:`, error.message);
        return false;
    }
};

export const reloadPlugin = async (pluginName) => {
    try {
        if (!pluginName.endsWith('.js')) {
            pluginName += '.js';
        }

        const pluginPath = `../plugins/${pluginName}`;

        const modulePath = path.resolve(process.cwd(), 'plugins', pluginName);
        if (require.cache[modulePath]) {
            delete require.cache[modulePath];
        }

        const pluginModule = await import(pluginPath);
        const plugin = pluginModule.default || pluginModule;

        logEvent('PLUGIN_RELOADED', {
            pluginName,
            modulePath
        });

        console.log(`🔄 Plugin ${pluginName} berhasil dimuat ulang`);
        return plugin;
    } catch (error) {
        logError(error, `RELOAD_PLUGIN_FAILED: ${pluginName}`);
        console.error(`❌ Gagal memuat ulang plugin ${pluginName}:`, error.message);
        return null;
    }
};

export const updateAllPlugins = async () => {
    try {
        const plugins = await checkPluginUpdates();
        const results = {
            updated: [],
            failed: [],
            unchanged: []
        };

        for (const plugin of plugins) {
            try {
                const reloaded = await reloadPlugin(plugin);

                if (reloaded) {
                    results.updated.push(plugin);
                } else {
                    results.failed.push(plugin);
                }
            } catch (error) {
                results.failed.push(plugin);
                logError(error, `UPDATE_SINGLE_PLUGIN_FAILED: ${plugin}`);
            }
        }

        logEvent('ALL_PLUGINS_UPDATED', {
            total: plugins.length,
            updated: results.updated.length,
            failed: results.failed.length,
            unchanged: results.unchanged.length
        });

        console.log(`🔄 ${results.updated.length}/${plugins.length} plugin berhasil diperbarui`);
        if (results.failed.length > 0) {
            console.log(`❌ ${results.failed.length} plugin gagal diperbarui:`, results.failed.join(', '));
        }

        return results;
    } catch (error) {
        logError(error, 'UPDATE_ALL_PLUGINS_FAILED');
        console.error('❌ Gagal memperbarui semua plugin:', error.message);
        return null;
    }
};

export const checkPluginVersion = async (pluginName) => {
    try {
        if (!pluginName.endsWith('.js')) {
            pluginName += '.js';
        }

        const pluginPath = path.join('./plugins', pluginName);

        if (!fs.existsSync(pluginPath)) {
            throw new Error(`Plugin file does not exist: ${pluginPath}`);
        }

        const content = fs.readFileSync(pluginPath, 'utf8');

        const versionMatch = content.match(/version:\s*'([^']+)'/i) ||
                           content.match(/@version\s+([^\s]+)/i) ||
                           content.match(/VERSION\s+=\s+'([^']+)'/i);

        const version = versionMatch ? versionMatch[1] : 'unknown';

        const nameMatch = content.match(/name:\s*'([^']+)'/i) ||
                         content.match(/@name\s+([^\s]+)/i) ||
                         content.match(/export\s+default\s+{[\s\S]*?cmd:\s*\[([^\]]+)\]/i);

        const name = nameMatch ? nameMatch[1].replace(/['"]/g, '').trim().split(',')[0] : pluginName.replace('.js', '');

        const fileInfo = fs.statSync(pluginPath);

        return {
            name: name,
            version: version,
            fileName: pluginName,
            size: fileInfo.size,
            lastModified: fileInfo.mtime
        };
    } catch (error) {
        logError(error, `CHECK_PLUGIN_VERSION_FAILED: ${pluginName}`);
        return {
            name: pluginName.replace('.js', ''),
            version: 'unknown',
            fileName: pluginName,
            size: 0,
            lastModified: null,
            error: error.message
        };
    }
};

export const getPluginListWithVersions = async () => {
    try {
        const plugins = await checkPluginUpdates();
        const pluginDetails = [];

        for (const plugin of plugins) {
            const details = await checkPluginVersion(plugin);
            pluginDetails.push(details);
        }

        logEvent('PLUGIN_LIST_WITH_VERSIONS_RETRIEVED', {
            count: pluginDetails.length
        });

        return pluginDetails;
    } catch (error) {
        logError(error, 'GET_PLUGIN_LIST_WITH_VERSIONS_FAILED');
        return [];
    }
};

export const scheduleAutoPluginUpdate = (intervalHours = 24) => {
    const intervalMs = intervalHours * 60 * 60 * 1000;

    logEvent('AUTO_PLUGIN_UPDATE_SCHEDULED', {
        intervalHours,
        intervalMs
    });

    console.log(`🔄 Auto-update plugin dijadwalkan setiap ${intervalHours} jam`);

    updateAllPlugins().catch(console.error);

    const intervalId = setInterval(async () => {
        try {
            console.log('🔄 Memeriksa pembaruan plugin...');
            await updateAllPlugins();
        } catch (error) {
            console.error('Gagal menjalankan auto-update plugin:', error);
        }
    }, intervalMs);

    return intervalId;
};

export const addPluginFromUrl = async (pluginName, sourceUrl) => {
    try {
        if (!pluginName.endsWith('.js')) {
            pluginName += '.js';
        }

        const pluginPath = path.join('./plugins', pluginName);

        const dir = './plugins';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const { stdout, stderr } = await execAsync(`curl -o ${pluginPath} ${sourceUrl}`);

        if (stderr) {
            throw new Error(stderr);
        }

        if (!fs.existsSync(pluginPath)) {
            throw new Error(`Plugin file was not created: ${pluginPath}`);
        }

        logEvent('PLUGIN_ADDED_FROM_URL', {
            pluginName,
            sourceUrl,
            pluginPath
        });

        console.log(`✅ Plugin ${pluginName} berhasil ditambahkan dari URL`);

        const newPlugin = await reloadPlugin(pluginName);
        return newPlugin;
    } catch (error) {
        logError(error, `ADD_PLUGIN_FROM_URL_FAILED: ${pluginName}`);
        console.error(`❌ Gagal menambahkan plugin ${pluginName} dari URL:`, error.message);
        return null;
    }
};

export const removePlugin = async (pluginName) => {
    try {
        if (!pluginName.endsWith('.js')) {
            pluginName += '.js';
        }

        const pluginPath = path.join('./plugins', pluginName);

        if (!fs.existsSync(pluginPath)) {
            throw new Error(`Plugin file does not exist: ${pluginPath}`);
        }

        fs.unlinkSync(pluginPath);

        logEvent('PLUGIN_REMOVED', {
            pluginName,
            pluginPath
        });

        console.log(`🗑️  Plugin ${pluginName} berhasil dihapus`);
        return true;
    } catch (error) {
        logError(error, `REMOVE_PLUGIN_FAILED: ${pluginName}`);
        console.error(`❌ Gagal menghapus plugin ${pluginName}:`, error.message);
        return false;
    }
};