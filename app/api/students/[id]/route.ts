import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for updating a student
const updateStudentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  class_id: z.string().min(1, 'Class is required').optional(),
  guardian_name: z.string().min(1, 'Guardian name is required').optional(),
  guardian_phone: z.string().min(10, 'Valid phone number is required').optional(),
  guardian_email: z.string().email('Valid email is required').optional(),
  guardian_relationship: z.string().min(1, 'Relationship is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  emergency_contact: z.string().min(10, 'Valid emergency contact is required').optional(),
  blood_group: z.string().optional(),
  previous_school: z.string().optional(),
  enrollment_status: z.enum(['active', 'inactive', 'graduated', 'transferred']).optional(),
  institution_id: z.string().uuid('Valid institution ID is required'),
});

// GET /api/students/[id] - Get a specific student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');

    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    const { data: student, error } = await supabase
      .from('students')
      .select(`
        id,
        admission_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        guardian_name,
        guardian_phone,
        guardian_email,
        guardian_relationship,
        address,
        emergency_contact,
        blood_group,
        previous_school,
        enrollment_status,
        admission_date,
        current_academic_year,
        classes(
          id,
          name,
          section
        ),
        users(
          email,
          phone,
          avatar_url
        )
      `)
      .eq('id', params.id)
      .eq('institution_id', institutionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching student:', error);
      return NextResponse.json(
        { error: 'Failed to fetch student' },
        { status: 500 }
      );
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error in GET /api/students/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/students/[id] - Update a student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = updateStudentSchema.safeParse(body);
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
      enrollment_status,
      institution_id,
    } = validationResult.data;

    // Check if student exists and belongs to institution
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id, class_id')
      .eq('id', params.id)
      .eq('institution_id', institution_id)
      .single();

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // If class_id is being updated, verify it exists and belongs to institution
    if (class_id && class_id !== existingStudent.class_id) {
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
    }

    // Update student record
    const updateData: any = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (gender !== undefined) updateData.gender = gender;
    if (class_id !== undefined) updateData.class_id = class_id;
    if (guardian_name !== undefined) updateData.guardian_name = guardian_name;
    if (guardian_phone !== undefined) updateData.guardian_phone = guardian_phone;
    if (guardian_email !== undefined) updateData.guardian_email = guardian_email;
    if (guardian_relationship !== undefined) updateData.guardian_relationship = guardian_relationship;
    if (address !== undefined) updateData.address = address;
    if (emergency_contact !== undefined) updateData.emergency_contact = emergency_contact;
    if (blood_group !== undefined) updateData.blood_group = blood_group;
    if (previous_school !== undefined) updateData.previous_school = previous_school;
    if (enrollment_status !== undefined) updateData.enrollment_status = enrollment_status;

    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', params.id)
      .eq('institution_id', institution_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating student:', updateError);
      return NextResponse.json(
        { error: 'Failed to update student' },
        { status: 500 }
      );
    }

    // Update user profile if name or phone changed
    const userUpdateData: any = {};
    if (first_name !== undefined) userUpdateData.first_name = first_name;
    if (last_name !== undefined) userUpdateData.last_name = last_name;
    if (guardian_phone !== undefined) userUpdateData.phone = guardian_phone;
    if (date_of_birth !== undefined) userUpdateData.date_of_birth = date_of_birth;
    if (gender !== undefined) userUpdateData.gender = gender;
    if (address !== undefined) userUpdateData.address = address;

    if (Object.keys(userUpdateData).length > 0) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdateData)
        .eq('id', params.id);

      if (userUpdateError) {
        console.error('Error updating user profile:', userUpdateError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      message: 'Student updated successfully',
      student: updatedStudent,
    });
  } catch (error) {
    console.error('Error in PUT /api/students/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id] - Delete a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');

    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    // Check if student exists and belongs to institution
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('id', params.id)
      .eq('institution_id', institutionId)
      .single();

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if student has any active fee records
    const { data: feeRecords } = await supabase
      .from('student_fees')
      .select('id')
      .eq('student_id', params.id)
      .limit(1);

    if (feeRecords && feeRecords.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete student with existing fee records. Please deactivate instead.' },
        { status: 400 }
      );
    }

    // Check if student has any payment records
    const { data: paymentRecords } = await supabase
      .from('payments')
      .select('id')
      .eq('student_id', params.id)
      .limit(1);

    if (paymentRecords && paymentRecords.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete student with existing payment records. Please deactivate instead.' },
        { status: 400 }
      );
    }

    // Delete student record
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', params.id)
      .eq('institution_id', institutionId);

    if (deleteError) {
      console.error('Error deleting student:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete student' },
        { status: 500 }
      );
    }

    // Delete user profile
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id);

    if (userDeleteError) {
      console.error('Error deleting user profile:', userDeleteError);
      // Don't fail the request, just log the error
    }

    // Delete user account
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(params.id);

    if (authDeleteError) {
      console.error('Error deleting user account:', authDeleteError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/students/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
