import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for creating a payment
const createPaymentSchema = z.object({
  student_id: z.string().uuid('Valid student ID is required'),
  paid_amount: z.number().positive('Paid amount must be positive'),
  payment_method: z.enum(['cash', 'card', 'upi', 'net_banking', 'cheque', 'bank_transfer']),
  payment_status: z.enum(['pending', 'completed', 'failed', 'cancelled']).default('pending'),
  fee_item_ids: z.array(z.string().uuid()).min(1, 'At least one fee item is required'),
  notes: z.string().optional(),
  institution_id: z.string().uuid('Valid institution ID is required'),
});

// GET /api/payments - List payments with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const method = searchParams.get('method') || '';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';

    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('payments')
      .select(`
        id,
        receipt_number,
        paid_amount,
        payment_method,
        payment_status,
        payment_date,
        notes,
        students!inner(
          first_name,
          last_name,
          admission_number
        ),
        classes!inner(
          name,
          section
        )
      `, { count: 'exact' })
      .eq('institution_id', institutionId);

    // Apply filters
    if (search) {
      query = query.or(`receipt_number.ilike.%${search}%,students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%,students.admission_number.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('payment_status', status);
    }

    if (method) {
      query = query.eq('payment_method', method);
    }

    if (dateFrom) {
      query = query.gte('payment_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('payment_date', dateTo);
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('payment_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payments: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = createPaymentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const {
      student_id,
      paid_amount,
      payment_method,
      payment_status,
      fee_item_ids,
      notes,
      institution_id,
    } = validationResult.data;

    // Check if student exists and belongs to institution
    const { data: studentData } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number')
      .eq('id', student_id)
      .eq('institution_id', institution_id)
      .single();

    if (!studentData) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Verify fee items exist and belong to the student
    const { data: feeItems, error: feeItemsError } = await supabase
      .from('student_fee_items')
      .select(`
        id,
        amount,
        outstanding_amount,
        fee_items(name)
      `)
      .in('id', fee_item_ids)
      .eq('student_fees.students.id', student_id);

    if (feeItemsError) {
      console.error('Error fetching fee items:', feeItemsError);
      return NextResponse.json(
        { error: 'Failed to fetch fee items' },
        { status: 500 }
      );
    }

    if (!feeItems || feeItems.length !== fee_item_ids.length) {
      return NextResponse.json(
        { error: 'One or more fee items not found' },
        { status: 400 }
      );
    }

    // Calculate total outstanding amount for selected fee items
    const totalOutstanding = feeItems.reduce((sum, item) => sum + Number(item.outstanding_amount), 0);

    if (paid_amount > totalOutstanding) {
      return NextResponse.json(
        { error: 'Paid amount cannot exceed outstanding amount' },
        { status: 400 }
      );
    }

    // Generate receipt number
    const receiptNumber = `RCP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        institution_id,
        student_id,
        receipt_number: receiptNumber,
        total_amount: totalOutstanding,
        paid_amount,
        payment_method,
        payment_status,
        notes,
        collected_by: request.headers.get('user-id'), // This should be set by middleware
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Create payment fee items records
    const paymentFeeItems = feeItems.map(feeItem => ({
      payment_id: paymentData.id,
      student_fee_item_id: feeItem.id,
      amount: Math.min(Number(feeItem.outstanding_amount), paid_amount * (Number(feeItem.outstanding_amount) / totalOutstanding)),
    }));

    const { error: paymentFeeItemsError } = await supabase
      .from('payment_fee_items')
      .insert(paymentFeeItems);

    if (paymentFeeItemsError) {
      console.error('Error creating payment fee items:', paymentFeeItemsError);
      // Clean up: delete the payment
      await supabase.from('payments').delete().eq('id', paymentData.id);
      return NextResponse.json(
        { error: 'Failed to create payment fee items' },
        { status: 500 }
      );
    }

    // Update student fee items with paid amounts
    for (const feeItem of feeItems) {
      const paidAmount = Math.min(Number(feeItem.outstanding_amount), paid_amount * (Number(feeItem.outstanding_amount) / totalOutstanding));
      const newPaidAmount = Number(feeItem.amount) - Number(feeItem.outstanding_amount) + paidAmount;
      
      const { error: updateError } = await supabase
        .from('student_fee_items')
        .update({
          paid_amount: newPaidAmount,
          status: newPaidAmount >= Number(feeItem.amount) ? 'paid' : 'partial',
        })
        .eq('id', feeItem.id);

      if (updateError) {
        console.error('Error updating fee item:', updateError);
        // Continue with other updates, don't fail the entire operation
      }
    }

    // Create receipt record
    const { error: receiptError } = await supabase
      .from('receipts')
      .insert({
        payment_id: paymentData.id,
        receipt_number: receiptNumber,
      });

    if (receiptError) {
      console.error('Error creating receipt:', receiptError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      message: 'Payment created successfully',
      payment: paymentData,
      receipt_number: receiptNumber,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
