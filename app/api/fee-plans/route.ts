import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for creating a fee plan
const createFeePlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  academic_year: z.string().min(1, 'Academic year is required'),
  is_active: z.boolean().default(true),
  fee_items: z.array(z.object({
    name: z.string().min(1, 'Fee item name is required'),
    amount: z.number().positive('Amount must be positive'),
    fee_type: z.enum(['tuition', 'transport', 'library', 'laboratory', 'sports', 'other']),
    due_date: z.string().optional(),
    is_optional: z.boolean().default(false),
  })).min(1, 'At least one fee item is required'),
  institution_id: z.string().uuid('Valid institution ID is required'),
});

// GET /api/fee-plans - List fee plans with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const academicYear = searchParams.get('academic_year') || '';
    const status = searchParams.get('status') || '';

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
      .from('fee_plans')
      .select(`
        id,
        name,
        description,
        academic_year,
        is_active,
        created_at,
        updated_at,
        fee_items(
          id,
          name,
          amount,
          fee_type,
          due_date,
          is_optional
        )
      `, { count: 'exact' })
      .eq('institution_id', institutionId);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    if (status) {
      query = query.eq('is_active', status === 'active');
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching fee plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch fee plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      fee_plans: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/fee-plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/fee-plans - Create a new fee plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = createFeePlanSchema.safeParse(body);
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
      name,
      description,
      academic_year,
      is_active,
      fee_items,
      institution_id,
    } = validationResult.data;

    // Check if fee plan name already exists for the institution and academic year
    const { data: existingPlan } = await supabase
      .from('fee_plans')
      .select('id')
      .eq('institution_id', institution_id)
      .eq('academic_year', academic_year)
      .eq('name', name)
      .single();

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Fee plan with this name already exists for the academic year' },
        { status: 409 }
      );
    }

    // Create fee plan
    const { data: feePlanData, error: feePlanError } = await supabase
      .from('fee_plans')
      .insert({
        institution_id,
        name,
        description,
        academic_year,
        is_active,
      })
      .select()
      .single();

    if (feePlanError) {
      console.error('Error creating fee plan:', feePlanError);
      return NextResponse.json(
        { error: 'Failed to create fee plan' },
        { status: 500 }
      );
    }

    // Create fee items
    const feeItemsData = fee_items.map(item => ({
      fee_plan_id: feePlanData.id,
      name: item.name,
      amount: item.amount,
      fee_type: item.fee_type,
      due_date: item.due_date,
      is_optional: item.is_optional,
    }));

    const { error: feeItemsError } = await supabase
      .from('fee_items')
      .insert(feeItemsData);

    if (feeItemsError) {
      console.error('Error creating fee items:', feeItemsError);
      // Clean up: delete the fee plan
      await supabase.from('fee_plans').delete().eq('id', feePlanData.id);
      return NextResponse.json(
        { error: 'Failed to create fee items' },
        { status: 500 }
      );
    }

    // Fetch the created fee plan with fee items
    const { data: createdFeePlan, error: fetchError } = await supabase
      .from('fee_plans')
      .select(`
        id,
        name,
        description,
        academic_year,
        is_active,
        created_at,
        updated_at,
        fee_items(
          id,
          name,
          amount,
          fee_type,
          due_date,
          is_optional
        )
      `)
      .eq('id', feePlanData.id)
      .single();

    if (fetchError) {
      console.error('Error fetching created fee plan:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch created fee plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Fee plan created successfully',
      fee_plan: createdFeePlan,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/fee-plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
