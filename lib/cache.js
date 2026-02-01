class SimpleCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, ttl = 60000) {
        const expireTime = Date.now() + ttl;
        this.cache.set(key, { value, expireTime });
    }

    get(key) {
        const cached = this.cache.get(key);
        if (!cached) {
            return undefined;
        }

        if (Date.now() > cached.expireTime) {
            this.cache.delete(key);
            return undefined;
        }

        return cached.value;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    cleanup() {
        for (const [key, cached] of this.cache.entries()) {
            if (Date.now() > cached.expireTime) {
                this.cache.delete(key);
            }
        }
    }

    keys() {
        return Array.from(this.cache.keys());
    }

    size() {
        return this.cache.size;
    }

    clear() {
        this.cache.clear();
    }
}

export const cache = new SimpleCache();

export const createTTLCache = (ttl = 60000) => {
    return {
        cache: new Map(),
        ttl,

        set(key, value) {
            this.cache.set(key, {
                value,
                timestamp: Date.now()
            });
        },

        get(key) {
            const item = this.cache.get(key);
            if (!item) return undefined;

            if (Date.now() - item.timestamp > this.ttl) {
                this.cache.delete(key);
                return undefined;
            }

            return item.value;
        },

        has(key) {
            const item = this.get(key);
            return item !== undefined;
        },

        delete(key) {
            return this.cache.delete(key);
        },

        clear() {
            this.cache.clear();
        },

        keys() {
            return Array.from(this.cache.keys()).filter(key => this.get(key) !== undefined);
        }
    };
};