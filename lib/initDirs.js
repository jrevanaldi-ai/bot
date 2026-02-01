import fs from 'fs';
import path from 'path';

export const initializeDirectories = () => {
    const dirs = [
        './store',
        './temp',
        './assets'
    ];

    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Direktori ${dir} telah dibuat`);
        }
    }
};

initializeDirectories();