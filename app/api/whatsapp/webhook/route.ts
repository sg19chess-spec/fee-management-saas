import { NextRequest, NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';
import { createServerSupabaseClient } from '@/lib/supabase';

// Webhook verification for WhatsApp Business API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Get institution ID from the webhook URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const institutionId = pathParts[pathParts.length - 2]; // /api/whatsapp/webhook/{institutionId}

    if (!institutionId) {
      return NextResponse.json({ error: 'Institution ID not found' }, { status: 400 });
    }

    // Verify the webhook
    if (mode === 'subscribe' && token) {
      // In a real implementation, you would verify the token against the institution's webhook secret
      // For now, we'll accept any token
      console.log(`Webhook verified for institution: ${institutionId}`);
      return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid webhook verification' }, { status: 403 });
  } catch (error) {
    console.error('Error in webhook verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle incoming webhook messages
export async function POST(request: NextRequest) {
  try {
    // Get institution ID from the webhook URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const institutionId = pathParts[pathParts.length - 2]; // /api/whatsapp/webhook/{institutionId}

    if (!institutionId) {
      return NextResponse.json({ error: 'Institution ID not found' }, { status: 400 });
    }

    // Get the webhook signature for verification
    const signature = request.headers.get('x-hub-signature-256') || '';
    const body = await request.json();

    // Handle the webhook
    await whatsappService.handleWebhook(institutionId, body, signature);

    // Return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
