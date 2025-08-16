import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import whatsappService from '@/lib/whatsapp';
import { z } from 'zod';

// Validation schema for sending reminders
const reminderSchema = z.object({
  studentFeeItemIds: z.array(z.string().uuid()),
  templateId: z.string().uuid(),
  type: z.enum(['single', 'bulk']).default('single'),
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

    // Check permissions (only school admin and accountant can send reminders)
    if (!['school_admin', 'accountant'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const institutionId = userProfile.institution_id;
    const body = await request.json();

    // Validate request body
    const validationResult = reminderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { studentFeeItemIds, templateId, type } = validationResult.data;

    // Verify template exists and belongs to institution
    const { data: template, error: templateError } = await supabase
      .from('reminder_templates')
      .select('*')
      .eq('id', templateId)
      .eq('institution_id', institutionId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Verify all fee items belong to the institution
    const { data: feeItems, error: feeItemsError } = await supabase
      .from('student_fee_items')
      .select(`
        id,
        student_fees!inner(
          students!inner(institution_id)
        )
      `)
      .in('id', studentFeeItemIds);

    if (feeItemsError) {
      return NextResponse.json({ error: 'Error fetching fee items' }, { status: 500 });
    }

    // Check if all fee items belong to the institution
    const invalidItems = feeItems?.filter(
      item => (item.student_fees as any).students.institution_id !== institutionId
    );

    if (invalidItems && invalidItems.length > 0) {
      return NextResponse.json({ 
        error: 'Some fee items do not belong to your institution' 
      }, { status: 403 });
    }

    let result;

    if (type === 'bulk') {
      // Send bulk reminders
      result = await whatsappService.sendBulkReminders(
        institutionId,
        studentFeeItemIds,
        templateId
      );
    } else {
      // Send single reminder (first item in array)
      if (studentFeeItemIds.length !== 1) {
        return NextResponse.json({ 
          error: 'Single reminder requires exactly one fee item ID' 
        }, { status: 400 });
      }

      // Get student ID from fee item
      const { data: feeItem, error: feeItemError } = await supabase
        .from('student_fee_items')
        .select(`
          student_fees!inner(student_id)
        `)
        .eq('id', studentFeeItemIds[0])
        .single();

      if (feeItemError || !feeItem) {
        return NextResponse.json({ error: 'Fee item not found' }, { status: 404 });
      }

      result = await whatsappService.sendPaymentReminder(
        institutionId,
        (feeItem.student_fees as any).student_id,
        studentFeeItemIds[0],
        templateId
      );

      // Convert single result to bulk format for consistency
      result = {
        success: result.success,
        sent: result.success ? 1 : 0,
        failed: result.success ? 0 : 1,
        errors: result.error ? [result.error] : [],
      };
    }

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        sent: result.sent,
        failed: result.failed,
        errors: result.errors,
        message: `Successfully sent ${result.sent} reminder(s)` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        sent: result.sent,
        failed: result.failed,
        errors: result.errors 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Get reminder logs for the institution
export async function GET(request: NextRequest) {
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

    // Check permissions
    if (!['school_admin', 'accountant'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const institutionId = userProfile.institution_id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const reminderType = searchParams.get('type');

    // Build query
    let query = supabase
      .from('reminder_logs')
      .select(`
        *,
        students!inner(
          users!inner(first_name, last_name),
          classes(name, section)
        ),
        reminder_templates(name)
      `)
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false });

    // Add filters
    if (status) {
      query = query.eq('status', status);
    }
    if (reminderType) {
      query = query.eq('reminder_type', reminderType);
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: logs, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Error fetching reminder logs' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching reminder logs:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
