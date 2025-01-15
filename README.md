# School Management System API

A robust RESTful API service for managing schools, classrooms, and students with role-based access control.

## 🚀 Features

-   **Authentication & Authorization**

    -   JWT-based authentication
    -   Role-based access control (RBAC)
    -   Secure password hashing
    -   Token refresh mechanism

-   **Schools Management**

    -   Complete CRUD operations
    -   School profile management
    -   Accessible only by superadmins

-   **Classrooms Management**

    -   Create, update, and manage classrooms
    -   Capacity management
    -   Resource allocation
    -   Managed by school administrators

-   **Students Management**
    -   Student enrollment and transfers
    -   Profile management
    -   Academic record tracking
    -   Managed by school administrators

## 🛠️ Tech Stack

-   Node.js
-   Express.js
-   MongoDB/Redis
-   JWT for authentication
-   Rate limiting
-   Input validation

## 📋 Prerequisites

-   Node.js (v18 or higher)
-   MongoDB/Redis
-   npm or yarn

## 🔧 Installation

1. Clone the repository:

```bash
git clone https://github.com/Stancobridge/soar-inc-assessment/
cd school-management-api
```

2. Install dependencies:

```bash
npm install
```

## 🔑 Environment Variables

Create a `.env` file with the following variables:

```
SERVICE_NAME=
MONGO_URI=
USER_PORT=
CACHE_PREFIX=
CACHE_REDIS=
CORTEX_PREFIX=
CORTEX_REDIS=
CORTEX_TYPE=
OYSTER_PREFIX=
OYSTER_REDIS=
LONG_TOKEN_SECRET=
SHORT_TOKEN_SECRET=
NACL_SECRET=


```

## 🔒 Authentication

The API uses JWT-based authentication with the following roles:

-   **Superadmin**: Manages school and school admins
-   **School Administrator**: Access limited to their school's resources

### Login Flow

1. POST `/api/auth/login`
2. Receive access and refresh tokens
3. Include access token in Authorization header: `Bearer <token>`

### Security Considerations

-   Passwords must be at least 8 characters long
-   Passwords are hashed before storage
-   Email addresses must be valid and unique
-   Only superadmins can register new users
-   Access token is required for registration
-   Username must be unique in the system

### Rate Limiting

-   Maximum 5 registration attempts per IP address per hour
-   Blocked IPs will receive a 429 Too Many Requests response

### Notes

-   All fields are required
-   Email verification might be required based on configuration
-   Passwords should contain a mix of letters, numbers, and special characters
-   Username should only contain alphanumeric characters and underscores

## 📚 API Documentation

### Auth Endpoints

## 🔒 Authentication Documentation

### Register New User

Register a new user in the system. Only superadmins can register new users.

#### Endpoint

```http
POST /api/auth/register
```

#### Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
    "username": "string",
    "password": "string",
    "confirm_password": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
}
```

#### Request Body Parameters

| Parameter        | Type   | Required | Description                     |
| ---------------- | ------ | -------- | ------------------------------- |
| username         | string | Yes      | Unique username for the account |
| password         | string | Yes      | Password (min 8 characters)     |
| confirm_password | string | Yes      | Must match password             |
| email            | string | Yes      | Valid email address             |
| first_name       | string | Yes      | User's first name               |
| last_name        | string | Yes      | User's last name                |

#### Success Response

```json
{
    "message": "Registration successful",
    "ok": true,
    "data": {
        "user": {
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string"
        },
        "authToken": "string",
        "refreshToken": "string"
    },
    "errors": []
}
```

### Login

Authenticate a user and receive access tokens.

#### Endpoint

```http
POST /api/auth/login
```

#### Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
    "username": "string",
    "password": "string"
}
```

#### Request Body Parameters

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| username  | string | Yes      | User's username |
| password  | string | Yes      | User's password |

#### Success Response

```json
{
    "message": "Login successful",
    "ok": true,
    "data": {
        "user": {
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string"
        },
        "authToken": "string",
        "refreshToken": "string"
    },
    "errors": []
}
```

### Refresh Token

Generate a new auth token using a refresh token.

#### Endpoint

```http
POST /api/refresh-tokens
```

#### Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
    "refreshToken": "string"
}
```

#### Success Response

```json
{
    "message": "Refresh token refreshed successfully",
    "ok": true,
    "data": {
        "authToken": "string",
        "refreshToken": "string"
    },
    "errors": []
}
```

### Schools Endpoints

### Create School (Superadmin only)

Create a new school in the system.

#### Endpoint

```http
POST /api/schools
```

#### Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

#### Request Body

```json
{
    "name": "string",
    "address": "string",
    "website": "string",
    "description": "string",
    "phone": "string",
    "email": "string"
}
```

#### Success Response

```json
{
    "message": "School created successfully",
    "ok": true,
    "data": {
        "school": {
            "name": "string",
            "address": "string",
            "phone": "string",
            "email": "string",
            "website": "string",
            "description": "string",
            "createdByUserId": "string",
            "_id": "string",
            "createdAt": "string",
            "updatedAt": "string"
        }
    },
    "errors": []
}
```

### List Schools

Retrieve a list of all schools.

#### Endpoint

```http
GET /api/schools
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request Parameters

None

#### Query Parameters

| Parameter | Type   | Required | Description                | Default |
| --------- | ------ | -------- | -------------------------- | ------- |
| page      | number | No       | Page number for pagination | 1       |
| limit     | number | No       | Number of schools per page | 10      |

#### Success Response

```json
{
    "message": "Schools fetched successfully",
    "ok": true,
    "data": {
        "schools": [
            {
                "_id": "string",
                "name": "string",
                "address": "string",
                "phone": "string",
                "email": "string",
                "website": "string",
                "description": "string",
                "createdByUserId": "string",
                "createdAt": "string",
                "updatedAt": "string"
            }
        ],
        "totalPages": 1,
        "currentPage": 1,
        "totalSchools": 1,
        "hasNextPage": false,
        "hasPrevPage": false
    },
    "errors": []
}
```

### Get School

Retrieve details of a specific school by ID.

#### Endpoint

```http
GET /api/schools/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| id        | string | Yes      | Unique ID of school |

#### Success Response

```json
{
    "message": "School fetched successfully",
    "ok": true,
    "data": {
        "school": {
            "_id": "string",
            "name": "string",
            "address": "string",
            "phone": "string",
            "email": "string",
            "website": "string",
            "description": "string",
            "createdByUserId": "string",
            "createdAt": "string",
            "updatedAt": "string"
        }
    },
    "errors": []
}
```

### Update School

Update details of a specific school by ID.

#### Endpoint

```http
PATCH /api/schools/:id
```

#### Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| id        | string | Yes      | Unique ID of school |

#### Request Body

```json
{
    "name": "string",
    "website": "string",
    "description": "string",
    "phone": "string",
    "email": "string"
}
```


#### Success Response

```json
{
    "message": "School updated successfully",
    "ok": true,
    "data": {
        "school": {
            "_id": "string",
            "name": "string",
            "address": "string",
            "phone": "string",
            "email": "string",
            "website": "string",
            "description": "string",
            "createdByUserId": "string",
            "createdAt": "string",
            "updatedAt": "string"
        }
    },
    "errors": []
}
```


### Delete School

Delete a specific school by ID.

#### Endpoint

```http
DELETE /api/schools/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| id        | string | Yes      | Unique ID of school |

#### Success Response

```json
{
    "message": "School deleted successfully",
    "ok": true,
    "data": {},
    "errors": []
}
```


### Classrooms Endpoints

-   GET `/api/class-rooms` - List classrooms
-   POST `/api/class-rooms/classrooms` - Create classroom
-   PUT `/api/class-rooms/:schoolId/classrooms/:id` - Update classroom
-   DELETE `/api/class-rooms/:schoolId/classrooms/:id` - Delete classroom

### Students Endpoints

-   GET `/api/schools/:schoolId/students` - List students
-   POST `/api/schools/:schoolId/students` - Enroll student
-   PUT `/api/schools/:schoolId/students/:id` - Update student
-   DELETE `/api/schools/:schoolId/students/:id` - Remove student

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run specific tests:

```bash
npm test tests/unit/schools.test.js
```

## 🔐 Security Features

-   JWT token authentication
-   Role-based access control
-   Input validation
-   Rate limiting
-   Password hashing
-   XSS protection
-   CORS configuration

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## ⚠️ Important Notes

-   Ensure proper error handling in production
-   Regularly update dependencies
-   Monitor API rate limits
-   Back up database regularly
-   Follow security best practices
