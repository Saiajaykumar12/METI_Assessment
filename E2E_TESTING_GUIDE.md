# End-to-End Testing Guide

## Prerequisites
- Backend running on `http://127.0.0.1:8000`
- Frontend running on `http://localhost:5173` or `http://localhost:5174`
- Supabase project configured with tables and RLS policies
- Groq API key configured

## Step-by-Step Test Workflow

### Phase 1: Authentication
1. Open browser to `http://localhost:5173` (or 5174)
2. Click "Google Login"
3. Complete Google authentication
4. Verify you're redirected to home page
5. ✓ **PASS**: Session established and displayed in header

### Phase 2: Candidate Details
1. Fill in candidate form:
   - Full Name: "Test Candidate"
   - Country: "United States"
   - City: "New York"
   - Education: "Bachelor's Degree"
   - Experience Years: "5"
   - Job Title: "Software Engineer"
   - Career Goal: "Senior Engineer"
2. Upload a PDF resume
3. Wait for "Resume uploaded and assessment generated successfully"
4. ✓ **PASS**: Candidate created, resume uploaded, assessment generated

### Phase 3: Assessment - Question Display
1. Page should show assessment name
2. First question should be displayed
3. Progress bar should show "Question 1 of 12"
4. Question navigation panel should show on right (desktop)
5. ✓ **PASS**: All questions loaded, navigation ready

### Phase 4: MCQ Question Type
1. Look for question with radio button options
2. Select an option (e.g., Option A)
3. Wait for "Saving..." indicator to disappear
4. ✓ **PASS**: Answer saved to backend

### Phase 5: Text Question Type
1. Navigate to text question (if available)
2. Type a response (should be auto-saved)
3. Change the response
4. Verify only latest response is saved (no duplicates)
5. ✓ **PASS**: Text answer saved and updated

### Phase 6: Navigation - Next/Previous
1. Click "Next Question"
2. Verify previous answer was saved
3. New question displays
4. Progress bar updates (e.g., "Question 2 of 12")
5. Click "Previous Question"
6. Verify first question displays with your answer still there
7. ✓ **PASS**: Navigation works, answers persist

### Phase 7: Question Navigation Panel
1. Look at right side panel (or scroll down on mobile)
2. Verify all 12 questions listed as Q1-Q12
3. Currently selected question is highlighted (dark)
4. Answered questions show "✓" mark in green
5. Click on Q5 (or any question)
6. Page jumps to that question
7. ✓ **PASS**: Question panel navigation works

### Phase 8: Page Refresh Test
1. Answer questions 1-3 completely
2. Press F5 to refresh browser
3. Wait for assessment to load
4. Verify you're back at question 1 (or current question)
5. Verify answers to Q1-Q3 are still there
6. Answer count shows "3 of 12" answered
7. ✓ **PASS**: Progress restored from localStorage

### Phase 9: Answer Update Test
1. Go to an MCQ question
2. Select Option A
3. Wait for save
4. Select Option B (different answer)
5. Backend should have only ONE response (not two)
6. Option B should be selected
7. ✓ **PASS**: UPSERT prevents duplicates

### Phase 10: Progress Through All Questions
1. Continue answering all 12 questions
2. For MCQ: select an option
3. For Text: type at least 10 characters
4. Navigate through all questions
5. Verify counter increments (1 of 12, 2 of 12, etc.)
6. ✓ **PASS**: All questions answerable

### Phase 11: Submit Assessment
1. Answer all required questions
2. On the last question (Q12), button should say "Submit Assessment"
3. Click "Submit Assessment"
4. Wait for processing
5. Should redirect to Results page
6. ✓ **PASS**: Assessment submitted successfully

### Phase 12: Results Page
1. Results page displays with performance metrics
2. Overall Score shows percentage (e.g., 75%)
3. Performance badge shows: Excellent/Good/Fair/Needs Work
4. Competency scores table shows breakdown
5. Strengths section shows strong areas
6. Development gaps section shows weak areas
7. Attempt information shows assessment details
8. ✓ **PASS**: Results displayed correctly

### Phase 13: Back to Dashboard
1. Click "Back to Dashboard" button
2. Dashboard page loads
3. Your assessment appears in the grid
4. Shows: score, competency index, completion date
5. Status shows as "completed"
6. Click "View Details"
7. Results page displays again
8. ✓ **PASS**: Dashboard navigation works

### Phase 14: Dashboard Features
1. Verify candidate info displays correctly
2. Shows all completed assessments
3. Each assessment shows:
   - Performance score (CPI)
   - Competency index (CCI)
   - Completion date
   - Status badge with color
4. Multiple assessments can be viewed
5. ✓ **PASS**: Dashboard fully functional

### Phase 15: Logout and Re-login
1. Click "Logout" button
2. Redirected to login
3. Complete Google authentication again
4. Dashboard still shows previous assessment
5. Can start new assessment
6. ✓ **PASS**: Session and data persistence works

## API Endpoint Testing (Optional)

### Test in Postman or curl

#### Health Check
```bash
curl http://127.0.0.1:8000/health
# Expected: {"status":"ok","database":"connected"}
```

#### Create Candidate
```bash
curl -X POST http://127.0.0.1:8000/api/v1/candidates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","country":"US","city":"NY","education":"BS","experience_years":3,"job_title":"Dev","career_goal":"Lead"}'
```

#### Get Assessments
```bash
curl -X GET http://127.0.0.1:8000/api/v1/assessments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Questions
```bash
curl -X GET http://127.0.0.1:8000/api/v1/assessments/ASSESSMENT_ID/questions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create Attempt
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/attempts?assessment_id=ASSESSMENT_ID&candidate_id=CANDIDATE_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Save Response
```bash
curl -X PUT http://127.0.0.1:8000/api/v1/attempts/ATTEMPT_ID/responses/QUESTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answer":"Option A"}'
```

#### Submit Assessment
```bash
curl -X POST http://127.0.0.1:8000/api/v1/attempts/ATTEMPT_ID/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Dashboard
```bash
curl -X GET http://127.0.0.1:8000/api/v1/attempts/candidate/CANDIDATE_ID/results \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Expected Results Summary

✅ All 27+ test steps should pass
✅ No console errors in browser dev tools
✅ No 500 errors in backend logs
✅ Database shows new records in all tables
✅ Supabase logs show successful queries
✅ Groq generates relevant questions from resume
✅ Scores calculated correctly (0-100%)
✅ All navigation works smoothly
✅ Loading states appear appropriately
✅ Error messages are descriptive

## Troubleshooting

### Backend won't start
- Check Python version (3.9+)
- Check all dependencies installed: `pip install -r requirements.txt`
- Check .env file has SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY

### Frontend won't load
- Check npm packages: `npm install`
- Check .env has VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
- Clear browser cache: Ctrl+Shift+Delete

### Can't login
- Check Supabase project has Google OAuth configured
- Verify redirect URL includes localhost:5173/5174

### Assessment questions empty
- Check Groq API key is valid
- Check resume extraction worked (check resume_text in database)
- Check question generation logs in backend

### Responses not saving
- Check backend logs for upsert errors
- Verify user is authenticated (check token in Authorization header)
- Check responses table has correct schema

### Score shows 0%
- Verify scoring_config has correct values in questions table
- Check answer is matching correct_answer exactly
- Check text answer length >= 10 chars for full credit

## Performance Notes

- Initial assessment load: 1-2 seconds
- Question navigation: <100ms
- Answer save: <500ms (depends on network)
- Dashboard load: <2 seconds
- Result calculation: <1 second
