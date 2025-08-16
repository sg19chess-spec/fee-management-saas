import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/students/route'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              institution_id: 'test-institution-id',
              role: 'institution_admin'
            }
          }
        }
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      and: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({ 
        data: [
          {
            id: '1',
            name: 'John Doe',
            admission_number: 'ADM001',
            class_id: 'class-1',
            institution_id: 'test-institution-id'
          }
        ], 
        error: null 
      }),
    })),
  })),
}))

describe('Students API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/students', () => {
    it('returns list of students with pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/students?page=1&limit=10')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('students')
      expect(data).toHaveProperty('pagination')
      expect(Array.isArray(data.students)).toBe(true)
    })

    it('filters students by search query', async () => {
      const request = new NextRequest('http://localhost:3000/api/students?search=john')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.students).toHaveLength(1)
    })

    it('filters students by class', async () => {
      const request = new NextRequest('http://localhost:3000/api/students?class=class-1')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.students).toHaveLength(1)
    })
  })

  describe('POST /api/students', () => {
    it('creates a new student successfully', async () => {
      const studentData = {
        name: 'Jane Doe',
        admission_number: 'ADM002',
        class_id: 'class-1',
        parent_name: 'John Doe',
        parent_phone: '+1234567890',
        parent_email: 'parent@example.com'
      }

      const request = new NextRequest('http://localhost:3000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data).toHaveProperty('student')
      expect(data.student.name).toBe(studentData.name)
    })

    it('validates required fields', async () => {
      const invalidData = {
        name: '', // Empty name
        admission_number: 'ADM003'
      }

      const request = new NextRequest('http://localhost:3000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('prevents duplicate admission numbers', async () => {
      // Mock Supabase to return existing student
      const mockSupabase = require('@supabase/supabase-js')
      mockSupabase.createClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'test-user-id',
                email: 'test@example.com',
                user_metadata: {
                  institution_id: 'test-institution-id',
                  role: 'institution_admin'
                }
              }
            }
          })
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ 
            data: { id: 'existing-student' }, 
            error: null 
          }),
        })),
      })

      const studentData = {
        name: 'Jane Doe',
        admission_number: 'ADM001', // Existing admission number
        class_id: 'class-1'
      }

      const request = new NextRequest('http://localhost:3000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Admission number already exists')
    })
  })
})
