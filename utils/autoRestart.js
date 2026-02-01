import { spawn } from 'child_process';
import { logEvent, logError } from './logger.js';

let restartCount = 0;
const maxRestarts = 5;
let lastRestartTime = null;

export const handleAutoRestart = (delay = 5000) => {
    const isAutoRestart = process.env.ASTRALUNE_AUTO_RESTART === 'true';

    logEvent('RESTART_HANDLER_INIT', {
        isAutoRestart,
        restartCount,
        maxRestarts,
        delay
    });

    restartCount++;

    if (restartCount > maxRestarts) {
        const timeDiff = lastRestartTime ? Date.now() - lastRestartTime.getTime() : Infinity;

        if (timeDiff < 5 * 60 * 1000) {
            logError(new Error(`Bot restarted ${maxRestarts} times in less than 5 minutes. Stopping.`), 'TOO_MANY_RESTARTS');
            console.error(`❌ Bot telah restart ${maxRestarts} kali dalam waktu kurang dari 5 menit. Menghentikan bot.`);
            process.exit(1);
        } else {
            restartCount = 1;
        }
    }

    lastRestartTime = new Date();

    logEvent('AUTO_RESTART_TRIGGERED', {
        restartCount,
        delay,
        lastRestartTime: lastRestartTime.toISOString()
    });

    console.log(`🔄 Restart otomatis dalam ${delay / 1000} detik...`);

    setTimeout(() => {
        try {
            process.env.ASTRALUNE_AUTO_RESTART = 'true';

            const child = spawn(process.argv[0], process.argv.slice(1), {
                stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
                env: { ...process.env, ASTRALUNE_AUTO_RESTART: 'true' }
            });

            child.stdout.on('data', (data) => {
                console.log(`[CHILD] ${data.toString()}`);
            });

            child.stderr.on('data', (data) => {
                console.error(`[CHILD ERROR] ${data.toString()}`);
            });

            child.on('message', (message) => {
                console.log(`[CHILD MESSAGE] ${JSON.stringify(message)}`);
            });

            child.on('close', (code) => {
                logEvent('CHILD_PROCESS_CLOSED', { code });
                console.log(`Child process exited with code ${code}`);

                if (code !== 0) {
                    console.log('Child process exited unexpectedly, restarting...');
                    handleAutoRestart(delay);
                }
            });

            process.exit(0);
        } catch (error) {
            logError(error, 'AUTO_RESTART_FAILED');
            console.error('❌ Gagal melakukan restart otomatis:', error.message);
            process.exit(1);
        }
    }, delay);
};

export const monitorCrashAndRestart = () => {
    logEvent('CRASH_MONITOR_STARTED', {
        pid: process.pid,
        uptime: process.uptime()
    });

    console.log('🛡️  Monitoring crash dan restart otomatis diaktifkan');

    process.on('uncaughtExceptionMonitor', (error) => {
        logError(error, 'UNCAUGHT_EXCEPTION_MONITORED');
        console.error('❌ Uncaught exception (monitored):', error);

        handleAutoRestart();
    });

    process.on('unhandledRejection', (reason, promise) => {
        logError({
            message: `Unhandled Rejection at: ${promise}\nReason: ${reason}`,
            stack: reason instanceof Error ? reason.stack : 'No stack available'
        }, 'UNHANDLED_REJECTION_MONITORED');

        console.error('❌ Unhandled rejection (monitored):', reason);

        handleAutoRestart();
    });

    process.on('SIGUSR1', () => {
        logEvent('MANUAL_RESTART_REQUESTED', { signal: 'SIGUSR1' });
        console.log('🔄 Restart manual diminta melalui SIGUSR1');
        handleAutoRestart(1000);
    });

    process.on('SIGUSR2', () => {
        logEvent('MANUAL_RESTART_REQUESTED', { signal: 'SIGUSR2' });
        console.log('🔄 Restart manual diminta melalui SIGUSR2');
        handleAutoRestart(1000);
    });
};

export const manualRestart = () => {
    logEvent('MANUAL_RESTART_TRIGGERED', {
        pid: process.pid,
        uptime: process.uptime()
    });

    console.log('🔄 Restart manual dijalankan...');
    handleAutoRestart(1000);
};

export const softRestart = () => {
    logEvent('SOFT_RESTART_TRIGGERED', {
        pid: process.pid,
        uptime: process.uptime()
    });

    console.log('🔄 Soft restart dijalankan...');

    process.kill(process.pid, 'SIGUSR1');
};

export const getRestartStatus = () => {
    return {
        restartCount,
        maxRestarts,
        lastRestartTime,
        canRestart: restartCount <= maxRestarts,
        timeSinceLastRestart: lastRestartTime ? Date.now() - lastRestartTime.getTime() : null
    };
};