import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import whatsappService from '@/lib/whatsapp';
import { z } from 'zod';

// Validation schema for test connection
const testConnectionSchema = z.object({
  institutionId: z.string().uuid(),
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

    // Check permissions (only school admin and accountant can test connection)
    if (!['school_admin', 'accountant'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = testConnectionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { institutionId } = validationResult.data;

    // Verify user belongs to the institution
    if (userProfile.institution_id !== institutionId) {
      return NextResponse.json({ error: 'Access denied to this institution' }, { status: 403 });
    }

    // Get institution WhatsApp configuration
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select(`
        whatsapp_api_key,
        whatsapp_endpoint_url,
        whatsapp_phone_number_id,
        whatsapp_business_phone
      `)
      .eq('id', institutionId)
      .single();

    if (institutionError || !institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    // Check if WhatsApp is configured
    if (!institution.whatsapp_api_key || !institution.whatsapp_phone_number_id) {
      return NextResponse.json({ 
        error: 'WhatsApp Business API not configured. Please configure your WhatsApp settings first.' 
      }, { status: 400 });
    }

    // Test the connection by making a simple API call
    try {
      const config = await whatsappService.getInstitutionConfig(institutionId);
      if (!config) {
        return NextResponse.json({ 
          error: 'Failed to get WhatsApp configuration' 
        }, { status: 500 });
      }

      // Test API by getting phone number details
      const response = await fetch(`${config.endpointUrl}/${config.phoneNumberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ 
          error: `WhatsApp API test failed: ${errorData.error?.message || 'Unknown error'}` 
        }, { status: 400 });
      }

      const phoneData = await response.json();

      return NextResponse.json({ 
        success: true, 
        message: 'WhatsApp Business API connection successful!',
        phoneNumber: phoneData.verified_name || 'Unknown',
        businessPhone: institution.whatsapp_business_phone,
      });

    } catch (apiError) {
      console.error('WhatsApp API test error:', apiError);
      return NextResponse.json({ 
        error: 'Failed to connect to WhatsApp Business API. Please check your configuration.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error testing WhatsApp connection:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
