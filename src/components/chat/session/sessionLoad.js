import { vscode } from '../../api/vscodeApi.js';

export const loadChatSession = async (chatSessionId) => {
    try {
        // Send message to extension
        vscode.postMessage({
            type: 'loadChatSession',
            chatSessionId: chatSessionId
        });

        // Return a promise that will be resolved when the extension sends back the response
        return new Promise((resolve, reject) => {
            const messageHandler = (event) => {
                const message = event.data;
                if (message.type === 'loadChatSessionResponse') {
                    window.removeEventListener('message', messageHandler);
                    if (message.error) {
                        reject(new Error(message.error));
                    } else {
                        resolve({ messages: message.data });
                    }
                }
            };

            window.addEventListener('message', messageHandler);
        });
    } catch (error) {
        console.error('Error loading chat session:', error);
        throw error;
    }
};