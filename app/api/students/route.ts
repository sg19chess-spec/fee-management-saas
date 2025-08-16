import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for creating a student
const createStudentSchema = z.object({
  admission_number: z.string().min(1, 'Admission number is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  class_id: z.string().min(1, 'Class is required'),
  guardian_name: z.string().min(1, 'Guardian name is required'),
  guardian_phone: z.string().min(10, 'Valid phone number is required'),
  guardian_email: z.string().email('Valid email is required'),
  guardian_relationship: z.string().min(1, 'Relationship is required'),
  address: z.string().min(1, 'Address is required'),
  emergency_contact: z.string().min(10, 'Valid emergency contact is required'),
  blood_group: z.string().optional(),
  previous_school: z.string().optional(),
  admission_date: z.string().min(1, 'Admission date is required'),
  institution_id: z.string().uuid('Valid institution ID is required'),
});

// GET /api/students - List students with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('class_id') || '';
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
      .from('students')
      .select(`
        id,
        admission_number,
        first_name,
        last_name,
        guardian_phone,
        guardian_email,
        enrollment_status,
        admission_date,
        classes(
          name,
          section
        )
      `, { count: 'exact' })
      .eq('institution_id', institutionId);

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%`);
    }

    if (classId) {
      query = query.eq('class_id', classId);
    }

    if (status) {
      query = query.eq('enrollment_status', status);
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('first_name')
      .range(from, to);

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      students: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = createStudentSchema.safeParse(body);
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
      admission_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      class_id,
      guardian_name,
      guardian_phone,
      guardian_email,
      guardian_relationship,
      address,
      emergency_contact,
      blood_group,
      previous_school,
      admission_date,
      institution_id,
    } = validationResult.data;

    // Check if admission number already exists
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('institution_id', institution_id)
      .eq('admission_number', admission_number)
      .single();

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Admission number already exists' },
        { status: 409 }
      );
    }

    // Check if class exists and belongs to institution
    const { data: classData } = await supabase
      .from('classes')
      .select('id')
      .eq('id', class_id)
      .eq('institution_id', institution_id)
      .single();

    if (!classData) {
      return NextResponse.json(
        { error: 'Invalid class ID' },
        { status: 400 }
      );
    }

    // Create user account
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `${admission_number}@${institution_id}.student.local`,
      password: `student${admission_number}`,
      email_confirm: true,
      user_metadata: {
        role: 'student',
        institution_id,
      },
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userData.user.id,
        institution_id,
        role: 'student',
        first_name,
        last_name,
        email: `${admission_number}@${institution_id}.student.local`,
        phone: guardian_phone,
        date_of_birth,
        gender,
        address,
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Clean up: delete the created user
      await supabase.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Create student record
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert({
        id: userData.user.id,
        institution_id,
        class_id,
        admission_number,
        admission_date,
        guardian_name,
        guardian_phone,
        guardian_email,
        guardian_relationship,
        emergency_contact,
        blood_group,
        previous_school,
        current_academic_year: new Date().getFullYear().toString(),
        enrollment_status: 'active',
      })
      .select()
      .single();

    if (studentError) {
      console.error('Error creating student:', studentError);
      // Clean up: delete the created user and profile
      await supabase.auth.admin.deleteUser(userData.user.id);
      await supabase.from('users').delete().eq('id', userData.user.id);
      return NextResponse.json(
        { error: 'Failed to create student record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Student created successfully',
      student: studentData,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
