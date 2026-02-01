export const runtime = () => {
    const startTime = Date.now();

    const padZeros = (num) => String(num).padStart(2, '0');

    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60);

    return `${days} hari ${padZeros(hours)} jam ${padZeros(minutes)} menit`;
};

export const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isOwner = (sender, ownerNumber) => {
    return sender.replace(/\D/g, '') === ownerNumber.replace(/\D/g, '');
};

export const rightAlign = (text, length) => {
    return text.padStart(length, ' ');
};

export const centerAlign = (text, length) => {
    const padding = Math.floor((length - text.length) / 2);
    return ' '.repeat(padding) + text + ' '.repeat(length - text.length - padding);
};

export const cleanText = (text) => {
    return text.replace(/[^\x20-\x7E\xA0-\xFF\u0100-\u017F\u0180-\u024F]/g, '');
};

export const formatDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
};