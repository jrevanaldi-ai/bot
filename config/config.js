export const config = {
    ownerNumber: '',

    prefixes: ['!', '#', '.', '/'],

    botName: 'Astralune Bot',

    botDescription: 'WhatsApp Bot menggunakan Baileys dengan sistem modular',

    limitNonPremium: 10,

    limitPremium: 999,

    delayBeforePairingCode: 3000,

    delayOnReconnect: 5000,

    database: {
        filename: './store/bot_data.db'
    },

    logLevel: 'info',

    features: {
        autoRead: true,
        antiDelete: false,
        welcomeMessage: true,
        goodbyeMessage: true
    }
};