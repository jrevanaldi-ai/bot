# Astralune Bot

WhatsApp Bot menggunakan Baileys dengan sistem modular dan plugin-based.

## Fitur

- Sistem plugin modular (1 fitur = 1 file)
- Pairing code connection
- Delay 3 detik sebelum generate pairing code
- Delay 5 detik saat reconnect
- SQLite memory store
- Cache system
- Edit message untuk semua respon
- Sistem perintah dengan tag, cmd, aliases, dan permission owner

## Instalasi

1. Clone atau download repository ini
2. Install dependencies: `npm install`
3. Jalankan bot: `npm start`

## Struktur Folder

```
astralune-bot/
├── handlers/           # File handler utama
├── plugins/            # Plugin-command disini (1 fitur = 1 file)
├── lib/               # Library tambahan
│   ├── database.js    # Fungsi database
│   ├── pluginLoader.js # Fungsi untuk memuat plugin
│   └── cache.js       # Sistem cache
├── utils/             # Fungsi-fungsi helper
├── config/            # File konfigurasi
├── store/             # Data autentikasi dan database
└── index.js           # File utama bot
```

## Cara Membuat Plugin Baru

Buat file baru di folder `plugins/` dengan struktur seperti berikut:

```javascript
// Contoh: plugins/nama_plugin.js
const plugin = {
    tag: 'tools',              // Kategori plugin
    cmd: ['nama_cmd'],         // Perintah utama
    aliases: ['alias1', 'alias2'], // Alias perintah
    desc: 'Deskripsi plugin',  // Deskripsi singkat
    owner: false,              // Hanya bisa digunakan owner
    run: async (sock, m, { args, fullText, prefix, command, db }) => {
        // Logika plugin disini
        return 'Hasil dari plugin';
    }
};

export default plugin;
```

Bot akan otomatis memuat plugin baru saat restart.

## Kontribusi

Silakan fork dan submit pull request jika ingin berkontribusi pada pengembangan bot ini.