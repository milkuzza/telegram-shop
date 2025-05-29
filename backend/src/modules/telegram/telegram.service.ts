import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly webhookUrl: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
  }

  async sendMessage(chatId: number, text: string, options?: any): Promise<any> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          ...options,
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send message to ${chatId}:`, error.message);
      throw error;
    }
  }

  async sendPhoto(chatId: number, photo: string, caption?: string, options?: any): Promise<any> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendPhoto`,
        {
          chat_id: chatId,
          photo,
          caption,
          parse_mode: 'HTML',
          ...options,
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send photo to ${chatId}:`, error.message);
      throw error;
    }
  }

  async setWebhook(url?: string): Promise<any> {
    try {
      const webhookUrl = url || this.webhookUrl;
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/setWebhook`,
        {
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query', 'pre_checkout_query', 'successful_payment'],
        }
      );
      this.logger.log(`Webhook set to: ${webhookUrl}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to set webhook:', error.message);
      throw error;
    }
  }

  async getWebhookInfo(): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${this.botToken}/getWebhookInfo`
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get webhook info:', error.message);
      throw error;
    }
  }

  async deleteWebhook(): Promise<any> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/deleteWebhook`
      );
      this.logger.log('Webhook deleted');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to delete webhook:', error.message);
      throw error;
    }
  }

  async answerPreCheckoutQuery(preCheckoutQueryId: string, ok: boolean, errorMessage?: string): Promise<any> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/answerPreCheckoutQuery`,
        {
          pre_checkout_query_id: preCheckoutQueryId,
          ok,
          error_message: errorMessage,
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to answer pre-checkout query:', error.message);
      throw error;
    }
  }

  async createInvoiceLink(invoice: any): Promise<string> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/createInvoiceLink`,
        invoice
      );
      return response.data.result;
    } catch (error) {
      this.logger.error('Failed to create invoice link:', error.message);
      throw error;
    }
  }

  async sendInvoice(chatId: number, invoice: any): Promise<any> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendInvoice`,
        {
          chat_id: chatId,
          ...invoice,
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send invoice to ${chatId}:`, error.message);
      throw error;
    }
  }

  async setChatMenuButton(chatId: number, menuButton: any): Promise<any> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/setChatMenuButton`,
        {
          chat_id: chatId,
          menu_button: menuButton,
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to set menu button for ${chatId}:`, error.message);
      throw error;
    }
  }

  async setMyCommands(commands: any[]): Promise<any> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/setMyCommands`,
        {
          commands,
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to set bot commands:', error.message);
      throw error;
    }
  }

  async handleWebhook(update: any): Promise<void> {
    try {
      this.logger.log('Received webhook update:', JSON.stringify(update, null, 2));

      if (update.message) {
        await this.handleMessage(update.message);
      }

      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }

      if (update.pre_checkout_query) {
        await this.handlePreCheckoutQuery(update.pre_checkout_query);
      }

      if (update.successful_payment) {
        await this.handleSuccessfulPayment(update.successful_payment, update.message);
      }
    } catch (error) {
      this.logger.error('Error handling webhook:', error.message);
    }
  }

  private async handleMessage(message: any): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text;

    if (text === '/start') {
      await this.sendWelcomeMessage(chatId, message.from);
    } else if (text === '/help') {
      await this.sendHelpMessage(chatId);
    } else if (text === '/shop') {
      await this.sendShopMessage(chatId);
    }
  }

  private async handleCallbackQuery(callbackQuery: any): Promise<void> {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    // Handle different callback data
    if (data.startsWith('product_')) {
      const productId = data.replace('product_', '');
      await this.sendProductDetails(chatId, productId);
    }

    // Answer callback query
    await axios.post(
      `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`,
      {
        callback_query_id: callbackQuery.id,
      }
    );
  }

  private async handlePreCheckoutQuery(preCheckoutQuery: any): Promise<void> {
    // Validate the order before payment
    const payload = JSON.parse(preCheckoutQuery.invoice_payload);
    
    // Here you would validate the order, check inventory, etc.
    const isValid = true; // Your validation logic

    await this.answerPreCheckoutQuery(preCheckoutQuery.id, isValid);
  }

  private async handleSuccessfulPayment(payment: any, message: any): Promise<void> {
    const chatId = message.chat.id;
    const payload = JSON.parse(payment.invoice_payload);

    // Process the successful payment
    // Create order, update inventory, send confirmation, etc.

    await this.sendMessage(
      chatId,
      `✅ Payment successful!\n\nOrder ID: ${payload.orderId}\nAmount: ${payment.total_amount / 100} ${payment.currency}\n\nThank you for your purchase!`
    );
  }

  private async sendWelcomeMessage(chatId: number, user: any): Promise<void> {
    const webAppUrl = this.configService.get<string>('WEB_APP_URL');
    
    await this.sendMessage(
      chatId,
      `🛍️ Welcome to Mezohit Store, ${user.first_name}!\n\nDiscover amazing products at great prices. Tap the button below to start shopping!`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🛒 Open Store',
                web_app: { url: webAppUrl },
              },
            ],
            [
              {
                text: '📱 Featured Products',
                callback_data: 'featured_products',
              },
              {
                text: '🆘 Help',
                callback_data: 'help',
              },
            ],
          ],
        },
      }
    );
  }

  private async sendHelpMessage(chatId: number): Promise<void> {
    await this.sendMessage(
      chatId,
      `🆘 <b>Help & Support</b>\n\n` +
      `🛒 <b>Shopping:</b> Use the "Open Store" button to browse and purchase products\n` +
      `💳 <b>Payments:</b> We accept Telegram Payments for secure transactions\n` +
      `📦 <b>Orders:</b> Track your orders directly in the app\n` +
      `🚚 <b>Shipping:</b> We offer worldwide shipping\n\n` +
      `📞 <b>Contact Support:</b> @mezohit_support\n` +
      `🌐 <b>Website:</b> mezohit.com`
    );
  }

  private async sendShopMessage(chatId: number): Promise<void> {
    const webAppUrl = this.configService.get<string>('WEB_APP_URL');
    
    await this.sendMessage(
      chatId,
      `🛍️ <b>Mezohit Store</b>\n\nBrowse our amazing collection of products!`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🛒 Open Store',
                web_app: { url: webAppUrl },
              },
            ],
          ],
        },
      }
    );
  }

  private async sendProductDetails(chatId: number, productId: string): Promise<void> {
    // Fetch product details and send formatted message
    // This would integrate with your ProductsService
    await this.sendMessage(
      chatId,
      `📱 Product details for ID: ${productId}\n\nUse the store app for full details and purchasing.`
    );
  }
}
