'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Validation schema for WhatsApp configuration
const whatsappConfigSchema = z.object({
  whatsapp_api_key: z.string().min(1, 'API Key is required'),
  whatsapp_endpoint_url: z.string().url('Must be a valid URL'),
  whatsapp_phone_number_id: z.string().min(1, 'Phone Number ID is required'),
  whatsapp_waba_id: z.string().min(1, 'WABA ID is required'),
  whatsapp_business_phone: z.string().min(10, 'Business phone number is required'),
  whatsapp_webhook_secret: z.string().optional(),
});

type WhatsAppConfigForm = z.infer<typeof whatsappConfigSchema>;

interface Institution {
  id: string;
  name: string;
  whatsapp_api_key: string;
  whatsapp_endpoint_url: string;
  whatsapp_phone_number_id: string;
  whatsapp_waba_id: string;
  whatsapp_business_phone: string;
  whatsapp_webhook_secret?: string;
}

export default function WhatsAppConfig() {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<WhatsAppConfigForm>({
    resolver: zodResolver(whatsappConfigSchema),
  });

  // Fetch institution data
  useEffect(() => {
    fetchInstitutionData();
  }, []);

  const fetchInstitutionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('institution_id')
        .eq('id', user.id)
        .single();

      if (!userProfile?.institution_id) return;

      const { data: institutionData } = await supabase
        .from('institutions')
        .select(`
          id,
          name,
          whatsapp_api_key,
          whatsapp_endpoint_url,
          whatsapp_phone_number_id,
          whatsapp_waba_id,
          whatsapp_business_phone,
          whatsapp_webhook_secret
        `)
        .eq('id', userProfile.institution_id)
        .single();

      if (institutionData) {
        setInstitution(institutionData);
        // Populate form with existing data
        setValue('whatsapp_api_key', institutionData.whatsapp_api_key || '');
        setValue('whatsapp_endpoint_url', institutionData.whatsapp_endpoint_url || '');
        setValue('whatsapp_phone_number_id', institutionData.whatsapp_phone_number_id || '');
        setValue('whatsapp_waba_id', institutionData.whatsapp_waba_id || '');
        setValue('whatsapp_business_phone', institutionData.whatsapp_business_phone || '');
        setValue('whatsapp_webhook_secret', institutionData.whatsapp_webhook_secret || '');
      }
    } catch (error) {
      console.error('Error fetching institution data:', error);
      setMessage({ type: 'error', text: 'Failed to load institution data' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: WhatsAppConfigForm) => {
    if (!institution) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('institutions')
        .update({
          whatsapp_api_key: data.whatsapp_api_key,
          whatsapp_endpoint_url: data.whatsapp_endpoint_url,
          whatsapp_phone_number_id: data.whatsapp_phone_number_id,
          whatsapp_waba_id: data.whatsapp_waba_id,
          whatsapp_business_phone: data.whatsapp_business_phone,
          whatsapp_webhook_secret: data.whatsapp_webhook_secret || null,
        })
        .eq('id', institution.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'WhatsApp configuration saved successfully!' });
      
      // Update local state
      setInstitution(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!institution) return;

    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institutionId: institution.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'WhatsApp connection test successful!' });
      } else {
        setMessage({ type: 'error', text: `Connection test failed: ${result.error}` });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setMessage({ type: 'error', text: 'Failed to test connection' });
    } finally {
      setTesting(false);
    }
  };

  const generateWebhookUrl = () => {
    if (!institution) return '';
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook/${institution.id}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">WhatsApp Business API Configuration</h2>
        <p className="text-gray-600 mt-2">
          Configure your WhatsApp Business API settings for sending notifications and reminders.
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Key */}
          <div>
            <Input
              label="WhatsApp API Key"
              {...register('whatsapp_api_key')}
              error={errors.whatsapp_api_key?.message}
              type="password"
              placeholder="Enter your WhatsApp API key"
              helperText="Your WhatsApp Business API access token"
            />
          </div>

          {/* Endpoint URL */}
          <div>
            <Input
              label="API Endpoint URL"
              {...register('whatsapp_endpoint_url')}
              error={errors.whatsapp_endpoint_url?.message}
              placeholder="https://graph.facebook.com/v17.0"
              helperText="WhatsApp Business API endpoint URL"
            />
          </div>

          {/* Phone Number ID */}
          <div>
            <Input
              label="Phone Number ID"
              {...register('whatsapp_phone_number_id')}
              error={errors.whatsapp_phone_number_id?.message}
              placeholder="123456789012345"
              helperText="Your WhatsApp Business phone number ID"
            />
          </div>

          {/* WABA ID */}
          <div>
            <Input
              label="WABA ID"
              {...register('whatsapp_waba_id')}
              error={errors.whatsapp_waba_id?.message}
              placeholder="987654321098765"
              helperText="Your WhatsApp Business Account ID"
            />
          </div>

          {/* Business Phone */}
          <div>
            <Input
              label="Business Phone Number"
              {...register('whatsapp_business_phone')}
              error={errors.whatsapp_business_phone?.message}
              placeholder="+91-9876543210"
              helperText="Your WhatsApp Business phone number"
            />
          </div>

          {/* Webhook Secret */}
          <div>
            <Input
              label="Webhook Secret (Optional)"
              {...register('whatsapp_webhook_secret')}
              error={errors.whatsapp_webhook_secret?.message}
              type="password"
              placeholder="Enter webhook secret"
              helperText="Secret for webhook signature verification"
            />
          </div>
        </div>

        {/* Webhook URL Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Webhook URL</h3>
          <p className="text-sm text-gray-600 mb-2">
            Use this URL when configuring your WhatsApp Business API webhook:
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-white p-2 rounded border text-sm font-mono">
              {generateWebhookUrl()}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(generateWebhookUrl())}
            >
              Copy
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            type="submit"
            loading={saving}
            disabled={saving || testing}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>

          <Button
            type="button"
            variant="outline"
            loading={testing}
            disabled={saving || testing}
            onClick={testConnection}
            className="flex-1"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>
      </form>

      {/* Configuration Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Setup Instructions</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <p>
            <strong>1. Get WhatsApp Business API Access:</strong>
            <br />
            • Create a Meta Developer account at{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">
              developers.facebook.com
            </a>
            <br />
            • Create a WhatsApp Business app
            <br />
            • Get your API key, phone number ID, and WABA ID
          </p>
          <p>
            <strong>2. Configure Webhook:</strong>
            <br />
            • Use the webhook URL shown above
            <br />
            • Set the webhook secret (optional but recommended)
            <br />
            • Subscribe to message events
          </p>
          <p>
            <strong>3. Test Configuration:</strong>
            <br />
            • Save your configuration
            <br />
            • Use the "Test Connection" button to verify setup
          </p>
        </div>
      </div>
    </div>
  );
}
