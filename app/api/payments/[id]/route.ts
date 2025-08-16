import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for updating payments
const updatePaymentSchema = z.object({
  payment_status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  discount_amount: z.number().min(0).optional(),
  discount_reason: z.string().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract user info from JWT (you might need to implement proper JWT verification)
    // For now, we'll assume the user info is passed in headers
    const institutionId = request.headers.get('x-institution-id');
    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID required' },
        { status: 400 }
      );
    }

    // Fetch payment details
    const { data: payment, error: paymentError } = await supabase
      .from('fee_payments')
      .select(`
        *,
        students!inner(
          first_name,
          last_name,
          admission_number,
          classes!inner(name, section)
        )
      `)
      .eq('id', params.id)
      .eq('institution_id', institutionId)
      .single();

    if (paymentError) {
      if (paymentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
      throw paymentError;
    }

    // Fetch payment fee items
    const { data: feeItems, error: feeItemsError } = await supabase
      .from('payment_fee_items')
      .select(`
        id,
        paid_amount,
        fee_items!inner(name),
        fee_plans!inner(name)
      `)
      .eq('payment_id', params.id)
      .eq('institution_id', institutionId);

    if (feeItemsError) {
      throw feeItemsError;
    }

    // Format the response
    const formattedPayment = {
      ...payment,
      student_name: `${payment.students.first_name} ${payment.students.last_name}`,
      student_admission: payment.students.admission_number,
      student_class: `${payment.students.classes.name} ${payment.students.classes.section}`,
      fee_items: feeItems?.map(item => ({
        id: item.id,
        fee_item_name: (item.fee_items as any).name,
        paid_amount: item.paid_amount,
        fee_plan_name: (item.fee_plans as any).name
      })) || []
    };

    return NextResponse.json(formattedPayment);

  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract user info from JWT
    const institutionId = request.headers.get('x-institution-id');
    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updatePaymentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { payment_status, reference_number, notes, discount_amount, discount_reason } = validationResult.data;

    // Check if payment exists and belongs to the institution
    const { data: existingPayment, error: checkError } = await supabase
      .from('fee_payments')
      .select('id, total_amount, paid_amount')
      .eq('id', params.id)
      .eq('institution_id', institutionId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
      throw checkError;
    }

    // Prepare update data
    const updateData: any = {};
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (reference_number !== undefined) updateData.reference_number = reference_number;
    if (notes !== undefined) updateData.notes = notes;
    if (discount_amount !== undefined) updateData.discount_amount = discount_amount;
    if (discount_reason !== undefined) updateData.discount_reason = discount_reason;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the payment
    const { data: updatedPayment, error: updateError } = await supabase
      .from('fee_payments')
      .update(updateData)
      .eq('id', params.id)
      .eq('institution_id', institutionId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // If payment status is being updated to completed, we might want to trigger additional actions
    if (payment_status === 'completed') {
      // You could add logic here to:
      // - Send confirmation emails/SMS
      // - Update student fee status
      // - Generate receipt
      // - Send WhatsApp notifications
      console.log(`Payment ${params.id} marked as completed`);
    }

    // Log the update for audit purposes
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'fee_payments',
        record_id: params.id,
        action: 'UPDATE',
        old_values: existingPayment,
        new_values: updatedPayment,
        institution_id: institutionId,
        user_id: request.headers.get('x-user-id') || 'system'
      });

    return NextResponse.json({
      message: 'Payment updated successfully',
      payment: updatedPayment
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
