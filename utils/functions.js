import fs from 'fs';
import path from 'path';
import { downloadContentFromMessage, jidNormalizedUser } from '@whiskeysockets/baileys';

export const downloadMedia = async (message, filePath = null) => {
    try {
        const messageType = Object.keys(message)[0];
        const mediaBuffer = [];

        const stream = await downloadContentFromMessage(message[messageType], messageType.replace('Message', '').toLowerCase());

        for await (const chunk of stream) {
            mediaBuffer.push(chunk);
        }

        const buffer = Buffer.concat(mediaBuffer);

        if (filePath) {
            fs.writeFileSync(filePath, buffer);
            return filePath;
        }

        return buffer;
    } catch (error) {
        console.error('Error downloading media:', error);
        throw error;
    }
};

export const reply = async (sock, jid, text, quoted = null) => {
    try {
        return await sock.sendMessage(
            jid,
            { text },
            { quoted }
        );
    } catch (error) {
        console.error('Error replying message:', error);
        throw error;
    }
};

export const forwardMessage = async (sock, jid, message, options = {}) => {
    try {
        return await sock.forwardMessage(jid, message, options);
    } catch (error) {
        console.error('Error forwarding message:', error);
        throw error;
    }
};

export const sendContact = async (sock, jid, contacts, quoted = null) => {
    try {
        const contactArray = Array.isArray(contacts) ? contacts : [contacts];

        const vcard = contactArray.map((contact, index) => {
            return `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.fullName || contact.name}\nORG:Astralune;\nTEL;type=CELL;type=VOICE;waid=${contact.number}:${contact.number}\nEND:VCARD`;
        }).join('\n');

        return await sock.sendMessage(
            jid,
            {
                contacts: {
                    displayName: contactArray.length === 1 ? contactArray[0].fullName || contactArray[0].name : `${contactArray.length} Kontak`,
                    contacts: contactArray.map(contact => ({
                        displayName: contact.fullName || contact.name,
                        vcard
                    }))
                }
            },
            { quoted }
        );
    } catch (error) {
        console.error('Error sending contact:', error);
        throw error;
    }
};

export const groupManagement = {
    create: async (sock, groupName, participants) => {
        try {
            return await sock.groupCreate(groupName, participants);
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    },

    addParticipants: async (sock, groupId, participants) => {
        try {
            return await sock.groupParticipantsUpdate(groupId, participants, 'add');
        } catch (error) {
            console.error('Error adding participants:', error);
            throw error;
        }
    },

    removeParticipants: async (sock, groupId, participants) => {
        try {
            return await sock.groupParticipantsUpdate(groupId, participants, 'remove');
        } catch (error) {
            console.error('Error removing participants:', error);
            throw error;
        }
    },

    promoteParticipants: async (sock, groupId, participants) => {
        try {
            return await sock.groupParticipantsUpdate(groupId, participants, 'promote');
        } catch (error) {
            console.error('Error promoting participants:', error);
            throw error;
        }
    },

    demoteParticipants: async (sock, groupId, participants) => {
        try {
            return await sock.groupParticipantsUpdate(groupId, participants, 'demote');
        } catch (error) {
            console.error('Error demoting participants:', error);
            throw error;
        }
    },

    getInfo: async (sock, groupId) => {
        try {
            return await sock.groupMetadata(groupId);
        } catch (error) {
            console.error('Error getting group info:', error);
            throw error;
        }
    },

    setSubject: async (sock, groupId, subject) => {
        try {
            return await sock.groupUpdateSubject(groupId, subject);
        } catch (error) {
            console.error('Error setting group subject:', error);
            throw error;
        }
    },

    setDescription: async (sock, groupId, description) => {
        try {
            return await sock.groupUpdateDescription(groupId, description);
        } catch (error) {
            console.error('Error setting group description:', error);
            throw error;
        }
    },

    setPicture: async (sock, groupId, buffer) => {
        try {
            return await sock.updateProfilePicture(groupId, buffer);
        } catch (error) {
            console.error('Error setting group picture:', error);
            throw error;
        }
    }
};

export const presenceUpdate = async (sock, jid, presence) => {
    try {
        return await sock.sendPresenceUpdate(presence, jid);
    } catch (error) {
        console.error('Error updating presence:', error);
        throw error;
    }
};

export const revokeMessage = async (sock, jid, messageKey) => {
    try {
        return await sock.sendMessage(
            jid,
            { delete: messageKey }
        );
    } catch (error) {
        console.error('Error revoking message:', error);
        throw error;
    }
};

export const broadcast = async (sock, recipients, message) => {
    try {
        return await sock.sendMessage('status@broadcast', message, {
            backgroundColor: '#ffffff',
            font: 1,
            statusJidList: recipients
        });
    } catch (error) {
        console.error('Error broadcasting message:', error);
        throw error;
    }
};

export const sendMessageWithMentions = async (sock, jid, text, quoted = null, mentions = []) => {
    try {
        return await sock.sendMessage(
            jid,
            {
                text,
                mentions: mentions.length > 0 ? mentions : undefined
            },
            { quoted }
        );
    } catch (error) {
        console.error('Error sending message with mentions:', error);
        throw error;
    }
};

export const getUserInfo = async (sock, jids) => {
    try {
        const normalizedJids = Array.isArray(jids) ? jids : [jids];
        const result = {};

        for (const jid of normalizedJids) {
            const normalizedJid = jidNormalizedUser(jid);
            result[normalizedJid] = await sock.onWhatsApp(normalizedJid);
        }

        return result;
    } catch (error) {
        console.error('Error getting user info:', error);
        throw error;
    }
};