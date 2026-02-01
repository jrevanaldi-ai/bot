import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const connectDB = async () => {
    const db = await open({
        filename: './store/bot_data.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            registered BOOLEAN DEFAULT FALSE,
            register_age INTEGER,
            premium BOOLEAN DEFAULT FALSE,
            limit_count INTEGER DEFAULT 10
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS commands (
            name TEXT PRIMARY KEY,
            usage_count INTEGER DEFAULT 0
        )
    `);

    return db;
};