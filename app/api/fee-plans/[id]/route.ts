import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for updating fee plans
const updateFeePlanSchema = z.object({
  name: z.string().min(1, 'Fee plan name is required').max(100).optional(),
  description: z.string().optional(),
  academic_year: z.string().min(1, 'Academic year is required').optional(),
  total_amount: z.number().min(0, 'Total amount must be positive').optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  discount_reason: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  fee_items: z.array(z.object({
    id: z.string().optional(), // For existing items
    name: z.string().min(1, 'Fee item name is required'),
    amount: z.number().min(0, 'Amount must be positive'),
    description: z.string().optional(),
    due_date: z.string().min(1, 'Due date is required'),
    is_optional: z.boolean().default(false)
  })).optional()
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

    // Extract user info from JWT
    const institutionId = request.headers.get('x-institution-id');
    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID required' },
        { status: 400 }
      );
    }

    // Fetch fee plan details
    const { data: feePlan, error: feePlanError } = await supabase
      .from('fee_plans')
      .select('*')
      .eq('id', params.id)
      .eq('institution_id', institutionId)
      .single();

    if (feePlanError) {
      if (feePlanError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Fee plan not found' },
          { status: 404 }
        );
      }
      throw feePlanError;
    }

    // Fetch fee items
    const { data: feeItems, error: feeItemsError } = await supabase
      .from('fee_items')
      .select('*')
      .eq('fee_plan_id', params.id)
      .eq('institution_id', institutionId)
      .order('created_at');

    if (feeItemsError) {
      throw feeItemsError;
    }

    // Format the response
    const formattedFeePlan = {
      ...feePlan,
      fee_items: feeItems || []
    };

    return NextResponse.json(formattedFeePlan);

  } catch (error) {
    console.error('Error fetching fee plan:', error);
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
    const validationResult = updateFeePlanSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { fee_items, ...feePlanData } = validationResult.data;

    // Check if fee plan exists and belongs to the institution
    const { data: existingFeePlan, error: checkError } = await supabase
      .from('fee_plans')
      .select('*')
      .eq('id', params.id)
      .eq('institution_id', institutionId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Fee plan not found' },
          { status: 404 }
        );
      }
      throw checkError;
    }

    // Create update object with timestamp
    const updateData = {
      ...feePlanData,
      updated_at: new Date().toISOString()
    };

    // Update the fee plan
    const { data: updatedFeePlan, error: updateError } = await supabase
      .from('fee_plans')
      .update(updateData)
      .eq('id', params.id)
      .eq('institution_id', institutionId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Update fee items if provided
    if (fee_items && fee_items.length > 0) {
      // First, get existing fee items
      const { data: existingItems } = await supabase
        .from('fee_items')
        .select('id')
        .eq('fee_plan_id', params.id)
        .eq('institution_id', institutionId);

      const existingItemIds = existingItems?.map(item => item.id) || [];

      // Process each fee item
      for (const item of fee_items) {
        if (item.id && existingItemIds.includes(item.id)) {
          // Update existing item
          await supabase
            .from('fee_items')
            .update({
              name: item.name,
              amount: item.amount,
              description: item.description,
              due_date: item.due_date,
              is_optional: item.is_optional,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
            .eq('institution_id', institutionId);
        } else {
          // Create new item
          await supabase
            .from('fee_items')
            .insert({
              fee_plan_id: params.id,
              name: item.name,
              amount: item.amount,
              description: item.description,
              due_date: item.due_date,
              is_optional: item.is_optional,
              institution_id: institutionId
            });
        }
      }

      // Remove items that are no longer in the list
      const newItemIds = fee_items.filter(item => item.id).map(item => item.id);
      const itemsToDelete = existingItemIds.filter(id => !newItemIds.includes(id));
      
      if (itemsToDelete.length > 0) {
        await supabase
          .from('fee_items')
          .delete()
          .in('id', itemsToDelete)
          .eq('institution_id', institutionId);
      }
    }

    // Log the update for audit purposes
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'fee_plans',
        record_id: params.id,
        action: 'UPDATE',
        old_values: existingFeePlan,
        new_values: updatedFeePlan,
        institution_id: institutionId,
        user_id: request.headers.get('x-user-id') || 'system'
      });

    return NextResponse.json({
      message: 'Fee plan updated successfully',
      fee_plan: updatedFeePlan
    });

  } catch (error) {
    console.error('Error updating fee plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if fee plan exists and belongs to the institution
    const { data: existingFeePlan, error: checkError } = await supabase
      .from('fee_plans')
      .select('*')
      .eq('id', params.id)
      .eq('institution_id', institutionId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Fee plan not found' },
          { status: 404 }
        );
      }
      throw checkError;
    }

    // Check if fee plan is assigned to any students
    const { data: assignments, error: assignmentError } = await supabase
      .from('fee_plan_assignments')
      .select('id')
      .eq('fee_plan_id', params.id)
      .eq('institution_id', institutionId)
      .limit(1);

    if (assignmentError) {
      throw assignmentError;
    }

    if (assignments && assignments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete fee plan that is assigned to students' },
        { status: 400 }
      );
    }

    // Check if fee plan has any payments
    const { data: payments, error: paymentError } = await supabase
      .from('fee_payments')
      .select('id')
      .eq('fee_plan_id', params.id)
      .eq('institution_id', institutionId)
      .limit(1);

    if (paymentError) {
      throw paymentError;
    }

    if (payments && payments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete fee plan that has associated payments' },
        { status: 400 }
      );
    }

    // Delete fee items first (due to foreign key constraint)
    await supabase
      .from('fee_items')
      .delete()
      .eq('fee_plan_id', params.id)
      .eq('institution_id', institutionId);

    // Delete the fee plan
    const { error: deleteError } = await supabase
      .from('fee_plans')
      .delete()
      .eq('id', params.id)
      .eq('institution_id', institutionId);

    if (deleteError) {
      throw deleteError;
    }

    // Log the deletion for audit purposes
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'fee_plans',
        record_id: params.id,
        action: 'DELETE',
        old_values: existingFeePlan,
        new_values: null,
        institution_id: institutionId,
        user_id: request.headers.get('x-user-id') || 'system'
      });

    return NextResponse.json({
      message: 'Fee plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting fee plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
