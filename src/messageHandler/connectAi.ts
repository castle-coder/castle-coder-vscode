import axios from 'axios';
import * as vscode from 'vscode';
import { getAccessToken } from '../auth';

const baseUrl = 'http://13.125.85.38:8080/api/v1';

export class LLMMessageHandler {
  constructor(private view: vscode.WebviewView) {}

  async handleMessage(message: any) {
    if (message.type === 'llm-chat') {
      const { chatSessionId, prompt } = message;
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
          'Accept': 'application/json'
        };
        const response = await axios.post(`${baseUrl}/llm/generate-code`, {
          chatSessionId,
          prompt,
        }, { headers });
        const data = response.data;
        this.view.webview.postMessage({ type: 'llm-chat-response', data });
      } catch (error: any) {
        this.view.webview.postMessage({ type: 'llm-chat-error', error: error.message });
      }
    }
  }
} 