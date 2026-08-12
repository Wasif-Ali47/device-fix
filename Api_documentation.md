# API Documentation

## Overview

This backend is a single unified service. It handles authentication, user profiles, chat history, exams, quizzes, uploaded profile images, and AI-powered mobile repair mentor interactions.

---

## Base URLs

- **Backend**: `http://localhost:5044` (or production URL)

---

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are valid for **7 days** and are returned upon successful login.

---

# Backend APIs

## 1. Authentication Routes (`/auth`)

### 1.1 Signup

**Endpoint:** `POST /auth/signup`

**Description:** Register a new user account. Sends OTP to email for verification.

**Request Body:**
```json
{
  "fullName": "string (required)",
  "email": "string (required, valid email format)",
  "password": "string (required, minimum 6 characters)",
  "profileImage": "file (optional, multipart/form-data)"
}
```

**Validation Flow:**
1. Checks if `fullName`, `email`, or `password` is missing → **400** `{ "error": "All fields required" }`
2. Validates email format → **400** `{ "error": "Invalid email format" }`
3. Validates password length (minimum 6 characters) → **400** `{ "error": "Password must be at least 6 characters" }`
4. Checks if email already exists → **400** `{ "error": "User exists" }`

**Success Response:** `200 OK`
```json
{
  "message": "Signup successful, verify OTP",
  "userId": "string (MongoDB ObjectId)"
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "error": "Server error"
}
```

**Notes:**
- OTP is automatically generated (6 digits) and sent to the provided email
- Profile image is optional and saved to `/uploads/profile/` if provided
- User must verify OTP before login

---

### 1.2 Verify OTP

**Endpoint:** `POST /auth/verify-otp`

**Description:** Verify the OTP sent to user's email during signup.

**Request Body:**
```json
{
  "userId": "string (required, valid MongoDB ObjectId)",
  "otp": "string (required, exactly 6 digits)"
}
```

**Validation Flow:**
1. Checks if `userId` or `otp` is missing → **400** `{ "error": "User ID and OTP required" }`
2. Validates `userId` is a valid MongoDB ObjectId → **400** `{ "error": "Invalid user ID" }`
3. Validates OTP format (exactly 6 digits) → **400** `{ "error": "Invalid OTP format" }`
4. Checks if OTP matches stored OTP → **400** `{ "error": "Invalid OTP" }`

**Success Response:** `200 OK`
```json
{
  "message": "Email verified"
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "error": "Server error"
}
```

**Notes:**
- After successful verification, `emailVerified` is set to `true` and OTP is cleared
- User can now login after verification

---

### 1.3 Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string (required, valid email format)",
  "password": "string (required)"
}
```

**Validation Flow:**
1. Checks if `email` or `password` is missing → **400** `{ "error": "Email and password required" }`
2. Validates email format → **400** `{ "error": "Invalid email format" }`
3. Checks if email exists in database → **400** `{ "error": "Email not registered" }`
4. Validates password match → **400** `{ "error": "Password incorrect" }`
5. Checks if email is verified → **400** `{ "error": "Email not verified" }`

**Success Response:** `200 OK`
```json
{
  "token": "string (JWT token, valid for 7 days)"
}
```

**Error Response:** `400 Bad Request` or `500 Internal Server Error`
```json
{
  "error": "Error message"
}
```

**Notes:**
- Token must be included in Authorization header for protected routes
- Token expires after 7 days

---

### 1.4 Google Login

**Endpoint:** `POST /auth/google-login`

**Description:** Authenticate user using Google OAuth ID token.

**Request Body:**
```json
{
  "idToken": "string (required, Google OAuth ID token)"
}
```

**Validation:**
- Missing `idToken` → **400** `{ "error": "Google ID token required" }`
- Invalid Google token → **400** `{ "error": "Invalid Google token" }`

**Success Response:** `200 OK`
```json
{
  "token": "string (JWT token)",
  "id": "string (user MongoDB ObjectId)"
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "error": "Google authentication failed"
}
```

**Notes:**
- If user doesn't exist, a new user is created automatically
- Google profile picture is saved as `profileImage` if available
- Email verification status is set based on Google account verification

---

### 1.5 Get Profile

**Endpoint:** `GET /auth/profile/:id`

**Description:** Retrieve user profile information.

**Authentication:** Required

**URL Parameters:**
- `id` - User MongoDB ObjectId

**Validation:**
- Invalid user ID format → **400** `{ "error": "Invalid user ID" }`
- User not found → **404** `{ "error": "User not found" }`

**Success Response:** `200 OK`
```json
{
  "_id": "string",
  "fullName": "string",
  "email": "string",
  "profileImage": "string (URL path)",
  "googleId": "string (if exists)",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

**Notes:**
- Excludes sensitive fields: `chatHistories`, `examHistory`, `otp`, `quizProgress`, `examProgress`, `resetOTP`, `emailVerified`

---

### 1.6 Update Profile

**Endpoint:** `PUT /auth/profile/:id`

**Description:** Update user profile information (name, password, profile image).

**Authentication:** Required

**URL Parameters:**
- `id` - User MongoDB ObjectId

**Request Body (multipart/form-data):**
```json
{
  "fullName": "string (optional)",
  "oldPassword": "string (required if changing password)",
  "newPassword": "string (optional, minimum 6 characters)",
  "profileImage": "file (optional)"
}
```

**Validation:**
- Invalid user ID → **400** `{ "message": "Invalid user ID" }`
- User not found → **404** `{ "message": "User not found" }`
- New password provided without old password → **400** `{ "message": "Old password required" }`
- Old password incorrect → **400** `{ "message": "Old password is incorrect" }`
- No data to update → **400** `{ "message": "No data to update" }`

**Success Response:** `200 OK`
```json
"Your Information Updated"
```

**Error Response:** `500 Internal Server Error`
```json
{
  "message": "Server error"
}
```

**Notes:**
- Profile image is saved to `/uploads/profile/` directory
- Password is stored in plain text (as per implementation)

---

### 1.7 Forgot Password

**Endpoint:** `POST /auth/forgot-password`

**Description:** Request password reset OTP sent to email.

**Request Body:**
```json
{
  "email": "string (required, valid email format)"
}
```

**Validation:**
- Missing email → **400** `{ "error": "Email required" }`
- Invalid email format → **400** `{ "error": "Invalid email format" }`
- User not found → **404** `{ "error": "User not found" }`

**Success Response:** `200 OK`
```json
{
  "message": "OTP sent"
}
```

**Notes:**
- OTP is generated (6 digits) and sent to the provided email
- OTP is stored in `resetOTP` field

---

### 1.8 Reset Password

**Endpoint:** `POST /auth/reset-password`

**Description:** Reset password using OTP received via email.

**Request Body:**
```json
{
  "email": "string (required)",
  "otp": "string (required, exactly 6 digits)",
  "newPassword": "string (required, minimum 6 characters)"
}
```

**Validation:**
- Missing fields → **400** `{ "error": "All fields required" }`
- Invalid OTP format → **400** `{ "error": "Invalid OTP format" }`
- Password too short → **400** `{ "error": "Password must be at least 6 characters" }`
- Invalid OTP → **400** `{ "error": "Invalid OTP" }`

**Success Response:** `200 OK`
```json
{
  "message": "Password reset successful"
}
```

**Notes:**
- After successful reset, `resetOTP` is cleared
- New password replaces the old one

---

## 2. Chat Routes (`/chat`)

### 2.1 Save Chat

**Endpoint:** `POST /chat`

**Description:** Save a chat message (question and reply) for a specific topic.

**Authentication:** Required

**Request Body:**
```json
{
  "topic": "string (required)",
  "question": "string (required)",
  "reply": "string (required)"
}
```

**Validation:**
- Missing fields → **400** `{ "error": "Missing fields" }`

**Success Response:** `200 OK`
```json
{
  "message": "Chat saved successfully"
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "error": "Server error"
}
```

**Notes:**
- If topic doesn't exist, a new topic entry is created
- Messages are appended to the existing topic's messages array
- Each message includes `question`, `reply`, and `date` (auto-generated)

---

### 2.2 Get Chat History

**Endpoint:** `GET /chat?topic=<topic_name>`

**Description:** Retrieve chat history for a specific topic.

**Authentication:** Required

**Query Parameters:**
- `topic` - Topic name (required)

**Validation:**
- Missing topic → **400** `{ "error": "Missing topic" }`

**Success Response:** `200 OK`
```json
{
  "chatHistory": [
    {
      "question": "string",
      "reply": "string",
      "date": "ISO date string"
    }
  ]
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "error": "Server error"
}
```

**Notes:**
- Returns empty array if topic doesn't exist
- Messages are sorted by date (oldest first)

---

### 2.3 Get All Chat Topics

**Endpoint:** `GET /chat/topics`

**Description:** Retrieve list of all chat topics for the authenticated user.

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "topics": ["topic1", "topic2", "topic3"]
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "error": "Server error"
}
```

**Notes:**
- Returns array of topic names (strings)
- Empty array if no topics exist

---

## 3. Exam Progress Routes (`/exam_progress`)

### 3.1 Save Exam Progress

**Endpoint:** `POST /exam_progress`

**Description:** Save or update exam progress for a specific topic.

**Authentication:** Required

**Request Body:**
```json
{
  "topic": "string (required)",
  "correct": "number (required)",
  "total": "number (required)"
}
```

**Validation:**
- Missing fields → **400** `{ "message": "Missing fields" }`
- User not found → **404** `{ "message": "User not found" }`

**Success Response:** `200 OK`
```json
{
  "message": "Exam progress saved",
  "examProgress": [
    {
      "topic": "string",
      "correct": "number",
      "total": "number",
      "percentage": "number",
      "attempts": "number",
      "lastUpdated": "ISO date string"
    }
  ]
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "message": "Server error"
}
```

**Notes:**
- Percentage is automatically calculated: `Math.round((correct / total) * 100)`
- If topic already exists, it updates the existing entry and increments `attempts`
- If topic is new, it creates a new entry with `attempts: 1`
- `lastUpdated` is automatically set to current date

---

### 3.2 Get Exam Progress

**Endpoint:** `GET /exam_progress`

**Description:** Retrieve all exam progress for the authenticated user.

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "examProgress": [
    {
      "topic": "string",
      "correct": "number",
      "total": "number",
      "percentage": "number",
      "attempts": "number",
      "lastUpdated": "ISO date string"
    }
  ],
  "overallPercentage": "number (0-100)"
}
```

**Error Response:**
- User not found → **404** `{ "message": "User not found" }`
- Server error → **500** `{ "message": "Server error" }`

**Notes:**
- `overallPercentage` is calculated as average of all topic percentages
- Returns `0` if no exam progress exists

---

## 4. Quiz Routes (`/api/quiz`)

### 4.1 Submit Quiz Progress

**Endpoint:** `POST /api/quiz/submit`

**Description:** Submit or update quiz progress for a specific topic.

**Authentication:** Required

**Request Body:**
```json
{
  "topic": "string (required)",
  "correctAnswers": "number (required)",
  "totalQuestions": "number (required)"
}
```

**Validation:**
- Missing required fields → **400**
```json
{
  "success": false,
  "message": "Missing required fields"
}
```
- User not found → **404**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Quiz progress saved successfully",
  "quizProgress": [
    {
      "topic": "string",
      "correctAnswers": "number",
      "totalQuestions": "number",
      "percentage": "number",
      "attempts": "number",
      "lastAttemptAt": "ISO date string",
      "isCompleted": "boolean"
    }
  ]
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Server error"
}
```

**Notes:**
- Percentage is automatically calculated: `Math.round((correctAnswers / totalQuestions) * 100)`
- If topic already exists, it updates and increments `attempts`
- If topic is new, it creates entry with `attempts: 1` and `isCompleted: true`
- `lastAttemptAt` is automatically set to current date

---

### 4.2 Get Quiz Progress

**Endpoint:** `GET /api/quiz/progress`

**Description:** Retrieve all quiz progress for the authenticated user.

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "totalTopics": "number",
  "quizProgress": [
    {
      "topic": "string",
      "correctAnswers": "number",
      "totalQuestions": "number",
      "percentage": "number",
      "attempts": "number",
      "lastAttemptAt": "ISO date string",
      "isCompleted": "boolean"
    }
  ]
}
```

**Error Response:**
- User not found → **404**
```json
{
  "success": false,
  "message": "User not found"
}
```
- Server error → **500**
```json
{
  "success": false,
  "message": "Server error"
}
```

**Notes:**
- `totalTopics` indicates the number of topics with quiz progress
- Returns empty array if no quiz progress exists

---

# AI Mentor APIs

## 1. Ask Mentor

**Endpoint:** `POST /ask`

**Description:** Ask a question to the AI mentor and get a response. The mentor acts as a Mobile Repair expert.

**Authentication:** Required

**Rate Limiting:** 10 requests per minute

**Request Body:**
```json
{
  "topic": "string (required)",
  "question": "string (required)"
}
```

**Validation:**
- Missing `topic` or `question` → **400** `{ "error": "Invalid input." }`

**Success Response:** `200 OK`
```json
{
  "reply": "string (AI-generated response)"
}
```

**Error Response:** `200 OK` (even on error)
```json
{
  "reply": "Something went wrong, try again."
}
```

**Notes:**
- Uses OpenAI GPT-4.1 model
- Response is limited to 150 tokens
- Chat is automatically saved to the authenticated user's chat history after a successful response
- Mentor specializes in mobile phone repair (hardware and software issues)
- Mentor provides step-by-step troubleshooting and repair guidance
- Mentor does not assist with illegal activities or hacking

**Mentor Capabilities:**
- Diagnosing hardware problems (battery, screen, connectors, buttons, cameras, sensors)
- Software troubleshooting (OS updates, app crashes, slow performance)
- Safe repair techniques
- Step-by-step instructions for common mobile issues

---

## Static File Serving

### Profile Images

**Endpoint:** `GET /uploads/profile/<filename>`

**Description:** Access uploaded profile images.

**Example:** `GET /uploads/profile/1766466132570-968887303.jpg`

**Notes:**
- Files are served from the `uploads/profile/` directory
- Only accessible if file exists

---

## Error Codes Summary

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation errors, missing fields) |
| 401 | Unauthorized (missing or invalid token) |
| 404 | Not Found (user/resource not found) |
| 500 | Internal Server Error |

---

## Data Models

### User Model

```javascript
{
  fullName: String,
  email: String (unique),
  password: String,
  googleId: String,
  emailVerified: Boolean (default: false),
  otp: String,
  resetOTP: String,
  isActive: Boolean (default: true),
  profileImage: String (default: ""),
  chatHistories: [
    {
      topic: String (required),
      messages: [
        {
          question: String,
          reply: String,
          date: Date (default: Date.now)
        }
      ]
    }
  ],
  examHistory: [
    {
      topic: String,
      score: Number,
      answers: Array,
      date: Date (default: Date.now)
    }
  ],
  quizProgress: [
    {
      topic: String (required),
      correctAnswers: Number,
      totalQuestions: Number,
      percentage: Number,
      attempts: Number (default: 1),
      lastAttemptAt: Date (default: Date.now),
      isCompleted: Boolean (default: true)
    }
  ],
  examProgress: [
    {
      topic: String (required),
      difficulty: String (default: "medium", enum: ["medium"]),
      correct: Number (required),
      total: Number (required),
      percentage: Number (required),
      attempts: Number (default: 1),
      lastUpdated: Date (default: Date.now)
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - MongoDB database name, for example `device-fix`
- `JWT_SECRET` - Secret key for JWT token signing
- `PORT` - Server port (default: 5044)
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASS` - Gmail app password
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `OPENAI_API_KEY` - OpenAI API key

---

## Notes

1. **Password Storage**: Passwords are stored in plain text (as per current implementation)
2. **Token Expiry**: JWT tokens expire after 7 days
3. **File Uploads**: Profile images are uploaded using `multipart/form-data` and saved to `uploads/profile/` directory
4. **CORS**: The backend has CORS enabled
5. **Rate Limiting**: The `/ask` endpoint has rate limiting (10 requests per minute)
6. **Email Service**: Uses Gmail SMTP for sending OTP emails
7. **Chat Saving**: `/ask` automatically saves AI chat to the authenticated user's chat history after a successful AI response

---

## API Endpoints Summary

### Unified Backend (Port 5044)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | User registration |
| POST | `/auth/verify-otp` | No | Verify email OTP |
| POST | `/auth/login` | No | User login |
| POST | `/auth/google-login` | No | Google OAuth login |
| GET | `/auth/profile/:id` | Yes | Get user profile |
| PUT | `/auth/profile/:id` | Yes | Update user profile |
| POST | `/auth/forgot-password` | No | Request password reset OTP |
| POST | `/auth/reset-password` | No | Reset password with OTP |
| POST | `/chat` | Yes | Save chat message |
| GET | `/chat?topic=<topic>` | Yes | Get chat history by topic |
| GET | `/chat/topics` | Yes | Get all chat topics |
| POST | `/ask` | Yes | Ask AI mentor a question |
| POST | `/exam_progress` | Yes | Save exam progress |
| GET | `/exam_progress` | Yes | Get exam progress |
| POST | `/api/quiz/submit` | Yes | Submit quiz progress |
| GET | `/api/quiz/progress` | Yes | Get quiz progress |
| GET | `/uploads/profile/<filename>` | No | Get profile image |

---

*Documentation generated on: January 27, 2026*
