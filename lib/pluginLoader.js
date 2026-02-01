import fs from 'fs';
import path from 'path';

export const loadPlugins = async (folderPath) => {
    const plugins = [];

    const files = fs.readdirSync(folderPath);

    for (const file of files) {
        if (file.endsWith('.js')) {
            try {
                const pluginModule = await import(path.join('../', folderPath, file));
                const plugin = pluginModule.default || pluginModule;

                if (plugin && plugin.cmd && Array.isArray(plugin.cmd)) {
                    plugins.push(plugin);
                    console.log(`Plugin loaded: ${file}`);
                } else {
                    console.warn(`Invalid plugin format: ${file}`);
                }
            } catch (error) {
                console.error(`Error loading plugin ${file}:`, error);
            }
        }
    }

    return plugins;
};