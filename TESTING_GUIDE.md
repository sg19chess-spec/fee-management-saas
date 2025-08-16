# Testing Guide

This guide covers how to test the Fee Management System comprehensively.

## 🧪 Test Types

### 1. **Unit Tests** - Component and Function Testing
- Tests individual components and functions in isolation
- Uses Jest + React Testing Library
- Fast execution, high coverage

### 2. **Integration Tests** - API and Service Testing
- Tests API endpoints and service interactions
- Uses Jest with mocked Supabase
- Tests data flow and business logic

### 3. **End-to-End Tests** - User Journey Testing
- Tests complete user workflows
- Uses Playwright
- Tests real browser interactions

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
# Unit and Integration tests
npm test

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:coverage
```

## 📋 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run unit and integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |

## 🧩 Unit Testing

### Component Testing
```bash
# Test specific component
npm test Button.test.tsx

# Test all components
npm test tests/unit/components/
```

### Example Component Test
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Testing Patterns
- **Render Testing**: Verify components render correctly
- **Interaction Testing**: Test user interactions (clicks, form submissions)
- **Props Testing**: Test different prop combinations
- **State Testing**: Test component state changes
- **Error Testing**: Test error states and edge cases

## 🔗 Integration Testing

### API Testing
```bash
# Test specific API
npm test students.test.ts

# Test all APIs
npm test tests/integration/api/
```

### Example API Test
```typescript
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/students/route'

describe('Students API', () => {
  it('returns list of students', async () => {
    const request = new NextRequest('http://localhost:3000/api/students')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
```

### Testing Patterns
- **Request/Response Testing**: Test API endpoints
- **Validation Testing**: Test input validation
- **Error Handling**: Test error scenarios
- **Authentication**: Test auth requirements
- **Multi-tenant**: Test institution scoping

## 🌐 End-to-End Testing

### Setup Playwright
```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e
```

### Example E2E Test
```typescript
import { test, expect } from '@playwright/test'

test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/')
  await page.fill('[data-testid="email"]', 'admin@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="login-button"]')
  
  await expect(page).toHaveURL('/dashboard')
})
```

### E2E Test Scenarios
- **Authentication Flow**: Login, logout, password reset
- **Student Management**: Create, edit, delete students
- **Payment Processing**: Create payments, generate receipts
- **Fee Plan Management**: Create and edit fee plans
- **Dashboard Navigation**: Navigate between pages
- **Responsive Design**: Test on mobile and desktop

## 📊 Test Coverage

### Coverage Targets
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### Generate Coverage Report
```bash
npm run test:coverage
```

The report will be available at `coverage/lcov-report/index.html`

## 🧪 Test Data

### Mock Data
```typescript
// Sample test data
const mockStudent = {
  id: '1',
  name: 'John Doe',
  admission_number: 'ADM001',
  class_id: 'class-1',
  institution_id: 'test-institution-id'
}

const mockPayment = {
  id: '1',
  student_id: '1',
  amount: 1000,
  payment_method: 'cash',
  status: 'completed'
}
```

### Test Database
- Use separate test database
- Reset data between tests
- Use transactions for isolation

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
  ],
}
```

### Playwright Configuration (`playwright.config.ts`)
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
  },
})
```

## 🚨 Common Testing Issues

### 1. **Supabase Mocking**
```typescript
// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}))
```

### 2. **Next.js Router Mocking**
```typescript
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }
  },
}))
```

### 3. **Environment Variables**
```typescript
// Set test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
```

## 📝 Writing Tests

### Test Structure
```typescript
describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('should do something specific', () => {
    // Test implementation
  })
})
```

### Best Practices
1. **Descriptive Test Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Structure tests in three parts
3. **Test One Thing**: Each test should test one specific behavior
4. **Use Data Attributes**: Add `data-testid` attributes for reliable selection
5. **Mock External Dependencies**: Mock APIs, databases, and external services
6. **Test Edge Cases**: Test error conditions and boundary values

### Example Test with Data Attributes
```typescript
// Component
<Button data-testid="submit-button" onClick={handleSubmit}>
  Submit
</Button>

// Test
const button = screen.getByTestId('submit-button')
fireEvent.click(button)
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## 📈 Performance Testing

### Load Testing
```bash
# Install Artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### Example Load Test Configuration
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Dashboard Load"
    requests:
      - get:
          url: "/dashboard"
```

## 🎯 Testing Checklist

### Before Running Tests
- [ ] Environment variables set
- [ ] Test database configured
- [ ] Dependencies installed
- [ ] Development server can start

### Test Coverage
- [ ] Components tested
- [ ] API endpoints tested
- [ ] User flows tested
- [ ] Error scenarios tested
- [ ] Multi-tenant isolation tested

### Quality Gates
- [ ] All tests pass
- [ ] Coverage meets targets
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Accessibility standards met

## 🆘 Troubleshooting

### Common Issues
1. **Tests failing due to environment**: Check environment variables
2. **Mock not working**: Verify mock setup and imports
3. **E2E tests timing out**: Increase timeouts or check server
4. **Coverage not accurate**: Check file patterns in config

### Debug Commands
```bash
# Debug Jest tests
npm test -- --verbose

# Debug E2E tests
npm run test:e2e -- --debug

# Run specific test file
npm test Button.test.tsx

# Run tests with coverage
npm run test:coverage
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Next.js Testing](https://nextjs.org/docs/testing)
