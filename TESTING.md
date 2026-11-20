# Testing with Playwright

## Setup
```bash
cd frontend
npm install
npx playwright install
```

## Running Tests
```bash
# Run all tests
npm test

# Run with UI mode
npm run test:ui

# Run in debug mode
npm run test:debug

# View test report
npm run test:report
```

## Writing Tests
Tests are located in `frontend/tests/`
- `auth/` - Authentication tests
- `lectures/` - Lecture management tests
- `digests/` - Digest generation tests

## Test Coverage Areas
- Authentication (login, signup, logout)
- Upload lecture (file upload, form validation)
- Generate digest (form, progress, results)
- Dashboard (stats, navigation)
- Profile (edit, password change)
- Settings (preferences, account)
