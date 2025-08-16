import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import whatsappService from '@/lib/whatsapp';
import { z } from 'zod';

// Validation schema for sending WhatsApp messages
const sendMessageSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  message: z.string().min(1).max(1000),
  templateId: z.string().uuid().optional(),
  parameters: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with institution
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*, institutions!inner(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check permissions (only school admin and accountant can send messages)
    if (!['school_admin', 'accountant'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const institutionId = userProfile.institution_id;
    const body = await request.json();

    // Validate request body
    const validationResult = sendMessageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { phoneNumber, message, templateId, parameters } = validationResult.data;

    let result;

    if (templateId && parameters) {
      // Send template message
      result = await whatsappService.sendTemplateMessage(
        institutionId,
        phoneNumber,
        templateId,
        parameters
      );
    } else {
      // Send simple text message
      result = await whatsappService.sendTextMessage(
        institutionId,
        phoneNumber,
        message
      );
    }

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId,
        message: 'WhatsApp message sent successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
