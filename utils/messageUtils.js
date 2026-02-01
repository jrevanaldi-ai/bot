import { proto } from '@whiskeysockets/baileys';

export const editMessage = async (sock, jid, message, key) => {
    const content = proto.Message.fromObject(message);
    const response = await sock.relayMessage(
        jid,
        { ...content },
        { messageId: key.id }
    );

    return response;
};

export const deleteMessage = async (sock, jid, messageKey) => {
    return await sock.sendMessage(
        jid,
        { delete: messageKey }
    );
};

export const sendMessageAndEdit = async (sock, jid, initialMessage, editMessageFunction, delay = 3000) => {
    const initialMsg = await sock.sendMessage(jid, initialMessage);

    setTimeout(async () => {
        try {
            const editedContent = typeof editMessageFunction === 'function'
                ? await editMessageFunction()
                : editMessageFunction;

            await sock.sendMessage(
                jid,
                { text: editedContent },
                { edit: initialMsg.key }
            );
        } catch (error) {
            console.error('Error editing message:', error);
        }
    }, delay);

    return initialMsg;
};

export const sendLoadingMessage = async (sock, jid, loadingText = 'Processing...', resultText) => {
    const loadingMsg = await sock.sendMessage(jid, { text: loadingText });

    return async (finalText = resultText) => {
        await sock.sendMessage(
            jid,
            { text: finalText },
            { edit: loadingMsg.key }
        );
    };
};