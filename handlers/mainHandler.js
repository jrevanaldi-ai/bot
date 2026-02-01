import fs from 'fs';
import path from 'path';
import { jidNormalizedUser, areJidsSameUser, isLidUser, isPnUser, jidDecode } from '@whiskeysockets/baileys';

import { logIncomingMessage, logCommandExecution } from '../utils/logger.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { updateMessageStats } from '../utils/uptimeMonitor.js';
import {
    normalizeJid,
    areSameUser,
    isLID,
    isPN,
    getJidInfo,
    getAccountType
} from '../utils/lidFunctions.js';

export const Handler = async (sock, msg, db, plugins) => {
    try {
        const m = {};

        m.message = msg.message;
        m.type = Object.keys(m.message)[0];
        m.msg = (m.type === 'viewOnceMessage') ?
            m.message[m.type].message[Object.keys(m.message[m.type].message)[0]] :
            m.message[m.type];
        m.from = msg.key.remoteJid;
        m.sender = msg.key.fromMe ?
            sock.user.id.split(':')[0] + '@s.whatsapp.net' :
            normalizeJid(msg.key.participant || msg.key.remoteJid);
        m.isGroup = m.from.endsWith('@g.us');
        if (m.isGroup) {
            try {
                m.groupMetadata = await sock.groupMetadata(m.from);
                m.participants = m.groupMetadata.participants;
                m.isAdmin = m.participants.find(v => areSameUser(v.id, m.sender))?.admin || false;
                const senderContact = m.participants.find(p => areSameUser(p.id, m.sender));
                m.pushName = senderContact?.name || senderContact?.verifiedName || m.sender.split('@')[0];

                m.groupMembersLidInfo = m.participants.map(participant => ({
                    ...participant,
                    isLidAccount: isLID(participant.id),
                    isPnAccount: isPN(participant.id),
                    accountType: getAccountType(participant.id),
                    jidInfo: getJidInfo(participant.id)
                }));
            } catch (e) {
                m.groupMetadata = null;
                m.participants = [];
                m.groupMembersLidInfo = [];
                m.isAdmin = false;
                m.pushName = m.sender.split('@')[0];
            }
        } else {
            m.groupMetadata = null;
            m.participants = [];
            m.groupMembersLidInfo = [];
            m.isAdmin = false;
            m.pushName = msg.pushName || m.sender.split('@')[0];
        }

        m.senderLidInfo = {
            isLidAccount: isLID(m.sender),
            isPnAccount: isPN(m.sender),
            accountType: getAccountType(m.sender),
            jidInfo: getJidInfo(m.sender)
        };

        m.text = (m.type === 'conversation') ?
            m.message.conversation :
            (m.type === 'imageMessage') ?
                m.message.imageMessage.caption :
                (m.type === 'videoMessage') ?
                    m.message.videoMessage.caption :
                    (m.type === 'extendedTextMessage') ?
                        m.message.extendedTextMessage.text :
                        (m.type === 'buttonsResponseMessage') ?
                            m.message.buttonsResponseMessage.selectedButtonId :
                            (m.type === 'listResponseMessage') ?
                                m.message.listResponseMessage.singleSelectReply.selectedRowId :
                                (m.type === 'templateButtonReplyMessage') ?
                                    m.message.templateButtonReplyMessage.selectedId :
                                    '';

        logIncomingMessage(m, m.pushName);

        updateMessageStats('message');

        const prefixMatch = m.text?.match(/^[\\/!#.]/);
        const prefix = prefixMatch ? prefixMatch[0] : '';
        const args = m.text ? m.text.slice(prefix.length).trim().split(/ +/) : [];
        const command = args.shift()?.toLowerCase() || '';
        const fullText = m.text ? m.text.slice(prefix.length).trim() : '';

        if (prefix && command) {
            updateMessageStats('command');

            const cmd = plugins.find(p =>
                p.cmd.includes(command) ||
                (p.aliases && p.aliases.includes(command))
            );

            if (cmd) {
                logCommandExecution(command, m.sender, true);

                if (cmd.owner && !msg.key.fromMe) {
                    const sentMsg = await sock.sendMessage(m.from, { text: 'Fitur ini hanya bisa digunakan oleh owner!' }, { quoted: msg });
                    setTimeout(async () => {
                        await sock.sendMessage(m.from, { delete: sentMsg.key });
                    }, 5000);
                    return;
                }

                try {
                    await withErrorHandling(cmd.run, sock, m, { args, fullText, prefix, command, db });

                    logCommandExecution(command, m.sender, true);
                } catch (error) {
                    logCommandExecution(command, m.sender, false);
                    console.error(`Error executing command ${command}:`, error);
                    const errorMsg = await sock.sendMessage(m.from, { text: `Error executing command: ${error.message}` }, { quoted: msg });
                    setTimeout(async () => {
                        await sock.sendMessage(m.from, { delete: errorMsg.key });
                    }, 5000);
                }
            } else {
                logCommandExecution(command, m.sender, false);
            }
        }
    } catch (error) {
        console.error('Handler Error:', error);
    }
};

export const editMsg = async (sock, jid, message, options = {}) => {
    return await sock.sendMessage(jid, message, { edit: options.edit });
};