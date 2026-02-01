import fs from 'fs';
import path from 'path';
import { downloadContentFromMessage, jidNormalizedUser, proto } from '@whiskeysockets/baileys';

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
    },

    getParticipants: async (sock, groupId) => {
        try {
            const metadata = await sock.groupMetadata(groupId);
            return metadata.participants;
        } catch (error) {
            console.error('Error getting group participants:', error);
            throw error;
        }
    },

    setJoinApprovalMode: async (sock, groupId, approvalMode) => {
        try {
            return await sock.groupSettingUpdate(groupId, approvalMode ? 'announcement' : 'not_announcement');
        } catch (error) {
            console.error('Error setting join approval mode:', error);
            throw error;
        }
    },

    setSendMessageToAdminsOnly: async (sock, groupId, adminsOnly) => {
        try {
            return await sock.groupSettingUpdate(groupId, adminsOnly ? 'locked' : 'unlocked');
        } catch (error) {
            console.error('Error setting send message to admins only:', error);
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

export const fetchStatus = async (sock, jid) => {
    try {
        const normalizedJid = jidNormalizedUser(jid);
        return await sock.fetchStatus(normalizedJid);
    } catch (error) {
        console.error('Error fetching status:', error);
        throw error;
    }
};

export const updateProfilePicture = async (sock, jid, buffer) => {
    try {
        return await sock.updateProfilePicture(jid, buffer);
    } catch (error) {
        console.error('Error updating profile picture:', error);
        throw error;
    }
};

export const updateBio = async (sock, jid, bio) => {
    try {
        return await sock.updateProfileStatus(jid, bio);
    } catch (error) {
        console.error('Error updating bio:', error);
        throw error;
    }
};

export const updateStatus = async (sock, status) => {
    try {
        return await sock.updateProfileStatus(status);
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
};

export const getUserStatus = async (sock, jid) => {
    try {
        return await sock.fetchStatus(jid);
    } catch (error) {
        console.error('Error getting user status:', error);
        throw error;
    }
};

export const blockUser = async (sock, jid) => {
    try {
        return await sock.updateBlockStatus(jid, 'block');
    } catch (error) {
        console.error('Error blocking user:', error);
        throw error;
    }
};

export const unblockUser = async (sock, jid) => {
    try {
        return await sock.updateBlockStatus(jid, 'unblock');
    } catch (error) {
        console.error('Error unblocking user:', error);
        throw error;
    }
};

export const getBusinessProfile = async (sock, jid) => {
    try {
        return await sock.getBusinessProfile(jid);
    } catch (error) {
        console.error('Error getting business profile:', error);
        throw error;
    }
};

export const sendButtonMessage = async (sock, jid, text, buttons, title = '', footer = '', quoted = null) => {
    try {
        const buttonMessage = {
            text,
            footer,
            title,
            buttons,
            headerType: 1
        };

        return await sock.sendMessage(jid, buttonMessage, { quoted });
    } catch (error) {
        console.error('Error sending button message:', error);
        throw error;
    }
};

export const sendTemplateMessage = async (sock, jid, title, text, footer, buttonText, sections, quoted = null) => {
    try {
        const templateButtons = [
            {
                index: 1,
                urlButton: {
                    displayText: buttonText.url,
                    url: buttonText.urlValue
                }
            },
            {
                index: 2,
                callButton: {
                    displayText: buttonText.call,
                    phoneNumber: buttonText.phoneNumber
                }
            },
            {
                index: 3,
                quickReplyButton: {
                    displayText: sections[0]?.rows[0]?.title || 'Option 1',
                    id: sections[0]?.rows[0]?.rowId || 'option_1'
                }
            }
        ];

        const templateMessage = {
            text,
            footer,
            templateButtons,
            headerType: 1
        };

        return await sock.sendMessage(jid, templateMessage, { quoted });
    } catch (error) {
        console.error('Error sending template message:', error);
        throw error;
    }
};

export const sendListMessage = async (sock, jid, title, text, footer, buttonText, sections, quoted = null) => {
    try {
        const listMessage = {
            text,
            footer,
            title,
            buttonText,
            sections
        };

        return await sock.sendMessage(jid, listMessage, { quoted });
    } catch (error) {
        console.error('Error sending list message:', error);
        throw error;
    }
};

export const sendMedia = async (sock, jid, media, caption = '', quoted = null, options = {}) => {
    try {
        const mediaType = options.mediaType || 'document';
        const mediaMessage = {
            [mediaType]: media,
            caption,
            ...options
        };

        return await sock.sendMessage(jid, mediaMessage, { quoted });
    } catch (error) {
        console.error('Error sending media:', error);
        throw error;
    }
};

export const sendImage = async (sock, jid, image, caption = '', quoted = null) => {
    try {
        return await sock.sendMessage(jid, { image, caption }, { quoted });
    } catch (error) {
        console.error('Error sending image:', error);
        throw error;
    }
};

export const sendVideo = async (sock, jid, video, caption = '', quoted = null, gif = false) => {
    try {
        return await sock.sendMessage(jid, { video, caption, gifPlayback: gif }, { quoted });
    } catch (error) {
        console.error('Error sending video:', error);
        throw error;
    }
};

export const sendAudio = async (sock, jid, audio, quoted = null, ptt = false) => {
    try {
        return await sock.sendMessage(jid, { audio, ptt }, { quoted });
    } catch (error) {
        console.error('Error sending audio:', error);
        throw error;
    }
};

export const sendDocument = async (sock, jid, document, fileName, caption = '', quoted = null) => {
    try {
        return await sock.sendMessage(jid, { document, fileName, caption }, { quoted });
    } catch (error) {
        console.error('Error sending document:', error);
        throw error;
    }
};

export const getMessageInfo = async (sock, messageKey) => {
    try {
        return await sock.messageInfo(messageKey);
    } catch (error) {
        console.error('Error getting message info:', error);
        throw error;
    }
};

export const sendTyping = async (sock, jid, duration = 10000) => {
    try {
        await sock.presenceSubscribe(jid);
        await sock.sendPresenceUpdate('composing', jid);
        setTimeout(async () => {
            await sock.sendPresenceUpdate('paused', jid);
        }, duration);
    } catch (error) {
        console.error('Error sending typing indicator:', error);
        throw error;
    }
};