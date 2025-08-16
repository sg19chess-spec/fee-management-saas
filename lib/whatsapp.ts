import { createClient } from '@supabase/supabase-js';

// Types for WhatsApp API
interface WhatsAppConfig {
  apiKey: string;
  endpointUrl: string;
  phoneNumberId: string;
  wabaId: string;
  businessPhone: string;
  webhookSecret?: string;
}

interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: string;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

interface Institution {
  id: string;
  name: string;
  code: string;
  whatsapp_api_key: string;
  whatsapp_endpoint_url: string;
  whatsapp_phone_number_id: string;
  whatsapp_waba_id: string;
  whatsapp_business_phone: string;
  whatsapp_webhook_secret?: string;
}

class WhatsAppService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get institution's WhatsApp configuration
   */
  async getInstitutionConfig(institutionId: string): Promise<WhatsAppConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from('institutions')
        .select(`
          whatsapp_api_key,
          whatsapp_endpoint_url,
          whatsapp_phone_number_id,
          whatsapp_waba_id,
          whatsapp_business_phone,
          whatsapp_webhook_secret
        `)
        .eq('id', institutionId)
        .single();

      if (error || !data) {
        console.error('Error fetching institution WhatsApp config:', error);
        return null;
      }

      return {
        apiKey: data.whatsapp_api_key,
        endpointUrl: data.whatsapp_endpoint_url,
        phoneNumberId: data.whatsapp_phone_number_id,
        wabaId: data.whatsapp_waba_id,
        businessPhone: data.whatsapp_business_phone,
        webhookSecret: data.whatsapp_webhook_secret,
      };
    } catch (error) {
      console.error('Error in getInstitutionConfig:', error);
      return null;
    }
  }

  /**
   * Send a simple text message via WhatsApp
   */
  async sendTextMessage(
    institutionId: string,
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = await this.getInstitutionConfig(institutionId);
      if (!config) {
        return { success: false, error: 'Institution WhatsApp configuration not found' };
      }

      // Format phone number (remove + and add country code if needed)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message,
        },
      };

      const response = await fetch(`${config.endpointUrl}/${config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result: WhatsAppResponse = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API error:', result);
        return { success: false, error: 'Failed to send WhatsApp message' };
      }

      // Log the message in reminder_logs
      await this.logReminderMessage(institutionId, phoneNumber, message, 'whatsapp', 'sent');

      return { success: true, messageId: result.messages?.[0]?.id };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Send a template message via WhatsApp
   */
  async sendTemplateMessage(
    institutionId: string,
    phoneNumber: string,
    templateName: string,
    parameters: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = await this.getInstitutionConfig(institutionId);
      if (!config) {
        return { success: false, error: 'Institution WhatsApp configuration not found' };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Convert parameters to WhatsApp format
      const components = Object.entries(parameters).map(([key, value]) => ({
        type: 'body',
        parameters: [
          {
            type: 'text',
            text: value,
          },
        ],
      }));

      const payload: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en',
          },
          components,
        },
      };

      const response = await fetch(`${config.endpointUrl}/${config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result: WhatsAppResponse = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API error:', result);
        return { success: false, error: 'Failed to send WhatsApp template message' };
      }

      // Log the message
      await this.logReminderMessage(
        institutionId,
        phoneNumber,
        `Template: ${templateName} with parameters: ${JSON.stringify(parameters)}`,
        'whatsapp',
        'sent'
      );

      return { success: true, messageId: result.messages?.[0]?.id };
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Send payment reminder to parent/guardian
   */
  async sendPaymentReminder(
    institutionId: string,
    studentId: string,
    feeItemId: string,
    templateId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get student and fee details
      const { data: studentData, error: studentError } = await this.supabase
        .from('students')
        .select(`
          *,
          users!inner(first_name, last_name, phone),
          classes(name, section)
        `)
        .eq('id', studentId)
        .single();

      if (studentError || !studentData) {
        return { success: false, error: 'Student not found' };
      }

      const { data: feeItemData, error: feeError } = await this.supabase
        .from('student_fee_items')
        .select(`
          *,
          fee_items(name, amount, due_date)
        `)
        .eq('id', feeItemId)
        .single();

      if (feeError || !feeItemData) {
        return { success: false, error: 'Fee item not found' };
      }

      const { data: templateData, error: templateError } = await this.supabase
        .from('reminder_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !templateData) {
        return { success: false, error: 'Template not found' };
      }

      // Prepare message parameters
      const parentName = `${studentData.users.first_name} ${studentData.users.last_name}`;
      const studentName = `${studentData.users.first_name} ${studentData.users.last_name}`;
      const className = `${studentData.classes.name} ${studentData.classes.section}`;
      const amount = feeItemData.fee_items.amount;
      const dueDate = new Date(feeItemData.fee_items.due_date).toLocaleDateString('en-IN');

      // Replace template variables
      let message = templateData.message_template;
      message = message.replace('{{parent_name}}', parentName);
      message = message.replace('{{student_name}}', studentName);
      message = message.replace('{{class}}', className);
      message = message.replace('{{amount}}', amount.toString());
      message = message.replace('{{due_date}}', dueDate);

      // Send the message
      const result = await this.sendTextMessage(
        institutionId,
        studentData.users.phone!,
        message
      );

      if (result.success) {
        // Log the reminder
        await this.logReminderMessage(
          institutionId,
          studentData.users.phone!,
          message,
          'whatsapp',
          'sent',
          studentId,
          templateId
        );
      }

      return result;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Send payment confirmation message
   */
  async sendPaymentConfirmation(
    institutionId: string,
    paymentId: string,
    templateId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get payment details
      const { data: paymentData, error: paymentError } = await this.supabase
        .from('payments')
        .select(`
          *,
          students!inner(
            users!inner(first_name, last_name, phone),
            classes(name, section)
          ),
          receipts(receipt_number)
        `)
        .eq('id', paymentId)
        .single();

      if (paymentError || !paymentData) {
        return { success: false, error: 'Payment not found' };
      }

      const { data: templateData, error: templateError } = await this.supabase
        .from('reminder_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !templateData) {
        return { success: false, error: 'Template not found' };
      }

      // Prepare message parameters
      const parentName = `${paymentData.students.users.first_name} ${paymentData.students.users.last_name}`;
      const studentName = `${paymentData.students.users.first_name} ${paymentData.students.users.last_name}`;
      const amount = paymentData.paid_amount;
      const receiptNumber = paymentData.receipts.receipt_number;

      // Replace template variables
      let message = templateData.message_template;
      message = message.replace('{{parent_name}}', parentName);
      message = message.replace('{{student_name}}', studentName);
      message = message.replace('{{amount}}', amount.toString());
      message = message.replace('{{receipt_number}}', receiptNumber);

      // Send the message
      const result = await this.sendTextMessage(
        institutionId,
        paymentData.students.users.phone!,
        message
      );

      if (result.success) {
        // Log the confirmation
        await this.logReminderMessage(
          institutionId,
          paymentData.students.users.phone!,
          message,
          'whatsapp',
          'sent',
          paymentData.student_id,
          templateId
        );
      }

      return result;
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Send bulk reminders to multiple students
   */
  async sendBulkReminders(
    institutionId: string,
    studentFeeItemIds: string[],
    templateId: string
  ): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const feeItemId of studentFeeItemIds) {
      try {
        const result = await this.sendPaymentReminder(institutionId, '', feeItemId, templateId);
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Fee item ${feeItemId}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Fee item ${feeItemId}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    body: string,
    signature: string,
    webhookSecret: string
  ): boolean {
    // Implement webhook signature verification
    // This is a simplified version - you should implement proper HMAC verification
    return true;
  }

  /**
   * Handle incoming webhook messages
   */
  async handleWebhook(
    institutionId: string,
    body: any,
    signature: string
  ): Promise<void> {
    try {
      const config = await this.getInstitutionConfig(institutionId);
      if (!config?.webhookSecret) {
        console.error('No webhook secret configured for institution');
        return;
      }

      // Verify webhook signature
      if (!this.verifyWebhookSignature(JSON.stringify(body), signature, config.webhookSecret)) {
        console.error('Invalid webhook signature');
        return;
      }

      // Process webhook events
      if (body.entry && body.entry.length > 0) {
        for (const entry of body.entry) {
          if (entry.changes && entry.changes.length > 0) {
            for (const change of entry.changes) {
              if (change.value && change.value.messages) {
                for (const message of change.value.messages) {
                  await this.processIncomingMessage(institutionId, message);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
    }
  }

  /**
   * Process incoming WhatsApp messages
   */
  private async processIncomingMessage(institutionId: string, message: any): Promise<void> {
    try {
      // Log incoming message
      await this.logReminderMessage(
        institutionId,
        message.from,
        message.text?.body || 'Non-text message',
        'whatsapp',
        'received'
      );

      // Handle different message types
      if (message.type === 'text') {
        await this.handleTextMessage(institutionId, message);
      }
    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }

  /**
   * Handle incoming text messages
   */
  private async handleTextMessage(institutionId: string, message: any): Promise<void> {
    const text = message.text.body.toLowerCase();
    const from = message.from;

    // Simple auto-reply system
    if (text.includes('fee') || text.includes('payment')) {
      const reply = 'Thank you for your inquiry. Please contact the school office for fee-related queries.';
      await this.sendTextMessage(institutionId, from, reply);
    } else if (text.includes('receipt') || text.includes('bill')) {
      const reply = 'Please provide your student ID or admission number to get your receipt details.';
      await this.sendTextMessage(institutionId, from, reply);
    }
  }

  /**
   * Format phone number for WhatsApp API
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Log reminder message in database
   */
  private async logReminderMessage(
    institutionId: string,
    recipientPhone: string,
    messageContent: string,
    reminderType: string,
    status: string,
    studentId?: string,
    templateId?: string
  ): Promise<void> {
    try {
      await this.supabase.from('reminder_logs').insert({
        institution_id: institutionId,
        student_id: studentId,
        template_id: templateId,
        reminder_type: reminderType,
        recipient_whatsapp: recipientPhone,
        message_content: messageContent,
        status: status,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      });
    } catch (error) {
      console.error('Error logging reminder message:', error);
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
export default whatsappService;
