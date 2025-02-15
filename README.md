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

## 📙 Database diagram

The database design can be found here [View Document](https://drive.google.com/file/d/1FJl9TNYw4f2-F5_ALrZPD5SIamTj0zfR/view?usp=sharing)

## 🛠️ Technical decisions made.

1. To accommodate the full REST API pattern, I modified the implementation of `Api.manager.js`. Initially, it did not support base routes and parameterized routes, such as `/api/students` and `/api/students/:id`. This change was made to enhance the system's functionality. It also affects how HTTP methods are exposed to the public. Here is how it looks now

```js
this.httpExposed = [
    'post=index.createSchool', //exposes /schools instead /schools/createSchool
    'patch=updateSchool:schoolId', //exposes /schools/:schoolId instead /schools/updateSchool
    'get=getOneSchool:schoolId', //exposes /schools/:schoolId instead /schools/getOneSchool
    'get=index.getAllSchools', // exposes /schools instead of /schools/getAllSchools
    'delete=deleteSchool:schoolId', //exposes /schools/:schoolId instead /schools/deleteSchool
];
```

2. The token endpoint was initially exposed, which posed a security risk by making the system vulnerable. I removed the exposure to improve security.

3. The roles and users fetched during middleware checks (e.g., `__authentication`, `_superAdmin`, and `__schoolAdministrator`) are cached in the system for one hour. This reduces database latency and improves performance.

4. I added a seed file to create roles and a default super admin. Since the super admin is required to perform most actions and cannot be created publicly, it is added through the seed file, which runs only once. To avoid conflicts, the seed files are ordered by a naming convention: the first file starts with 0, the second with 1, and so on.

## 🔧 Installation

1. Clone the repository:

```bash
git clone https://github.com/Stancobridge/soar-inc-assessment/
cd soar-inc-assessment
```

2. Install dependencies:

```bash
npm install
```

## 🔑 Environment Variables

Create a `.env` file with the following variables:

```
SERVICE_NAME=soar_inc # you can change to anything
MONGO_URI=<MONGO DB URL>
USER_PORT=3000 # change to any port
CACHE_PREFIX=soar_app # you can change to anything
CACHE_REDIS=<REDIS URL WITH PORT>
CORTEX_PREFIX=soar_app # you can change to anything
CORTEX_REDIS=<REDIS URL WITH PORT>
CORTEX_TYPE=service # you can change to anything
OYSTER_PREFIX=soar_app # you can change to anything
OYSTER_REDIS=<REDIS URL WITH PORT>
LONG_TOKEN_SECRET=<JWT LONG TOKEN SECRET>
SHORT_TOKEN_SECRET=<JWT SHORT TOKEN SECRET>
NACL_SECRET=<NACL_SECRET> # can be empty for this use case


```

## 🌱 Seed default data (Roles and SuperAdmin)

```bsh
npm run seed
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
-   Username must be unique in the system

### Rate Limiting

-   Maximum 50 attempts per IP address per 15mins
-   Blocked IPs will receive a 429 Too Many Requests response


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

# Schools Endpoints

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

# School Admin Endpoints

### Create School Admin

Assign a user as an administrator for a specific school.

#### Endpoint

```http
POST /api/school-admins
```

#### Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

#### Request Body

```json
{
    "userId": "string",
    "schoolId": "string"
}
```

#### Request Body Parameters

| Parameter | Type   | Required | Description                         |
| --------- | ------ | -------- | ----------------------------------- |
| userId    | string | Yes      | ID of the user to make admin        |
| schoolId  | string | Yes      | ID of the school to assign admin to |

#### Success Response

```json
{
    "message": "School admin created successfully",
    "ok": true,
    "data": {
        "schoolId": "string",
        "userId": "string",
        "_id": "string",
        "createdAt": "string",
        "updatedAt": "string"
    },
    "errors": []
}
```

### List School Admins

Retrieve a list of all school administrators.

#### Endpoint

```http
GET /api/school-admins
```

#### Headers

```
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter | Type   | Required | Description                | Default |
| --------- | ------ | -------- | -------------------------- | ------- |
| page      | number | No       | Page number for pagination | 1       |
| limit     | number | No       | Number of admins per page  | 10      |

#### Success Response

```json
{
    "message": "School admins fetched successfully",
    "ok": true,
    "data": {
        "docs": [
            {
                "_id": "string",
                "schoolId": "string",
                "userId": "string",
                "createdAt": "string",
                "updatedAt": "string"
            }
        ],
        "totalDocs": 1,
        "limit": 10,
        "totalPages": 1,
        "page": 1,
        "pagingCounter": 1,
        "hasPrevPage": false,
        "hasNextPage": false,
        "prevPage": null,
        "nextPage": null
    },
    "errors": []
}
```

### Get School Admin

Retrieve details of a specific school administrator by ID.

#### Endpoint

```http
GET /api/school-admins/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Required | Description               |
| --------- | ------ | -------- | ------------------------- |
| id        | string | Yes      | Unique ID of school admin |

#### Success Response

```json
{
    "message": "School admin fetched successfully",
    "ok": true,
    "data": {
        "_id": "string",
        "schoolId": "string",
        "createdAt": "string",
        "updatedAt": "string",
        "user": {
            "_id": "string",
            "first_name": "string",
            "last_name": "string",
            "username": "string",
            "email": "string",
            "roles": ["string"],
            "createdAt": "string",
            "updatedAt": "string"
        }
    },
    "errors": []
}
```

### Delete School Admin

Remove a school administrator assignment.

#### Endpoint

```http
DELETE /api/school-admins/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Required | Description               |
| --------- | ------ | -------- | ------------------------- |
| id        | string | Yes      | Unique ID of school admin |

#### Success Response

```json
{
    "message": "School admin deleted successfully",
    "ok": true,
    "data": {},
    "errors": []
}
```

### Classrooms Endpoints

### Create Classroom

Create a new classroom for a specific school.

#### Endpoint

```http
POST /api/class-rooms
```

#### Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

#### Request Body

```json
{
    "schoolId": "string",
    "name": "string",
    "capacity": 100
}
```

#### Request Body Parameters

| Parameter | Type   | Required | Description                        |
| --------- | ------ | -------- | ---------------------------------- |
| schoolId  | string | Yes      | ID of the school                   |
| name      | string | Yes      | Name of the classroom              |
| capacity  | number | Yes      | Maximum number of students allowed |

#### Success Response

```json
{
    "message": "Class room created successfully",
    "ok": true,
    "data": {
        "name": "string",
        "schoolId": "string",
        "capacity": 100,
        "createdByUserId": "string",
        "_id": "string",
        "createdAt": "string",
        "updatedAt": "string"
    },
    "errors": []
}
```

### Update Classroom

Update details of a specific classroom.

#### Endpoint

```http
PATCH /api/class-rooms/:id
```

#### Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| id        | string | Yes      | Unique ID of classroom |

#### Request Body

```json
{
    "schoolId": "string",
    "name": "string",
    "capacity": 100
}
```

#### Request Body Parameters

| Parameter | Type   | Required | Description                        |
| --------- | ------ | -------- | ---------------------------------- |
| schoolId  | string | No       | ID of the school                   |
| name      | string | No       | Name of the classroom              |
| capacity  | number | No       | Maximum number of students allowed |

#### Success Response

```json
{
    "message": "Class room updated successfully",
    "ok": true,
    "data": {
        "_id": "string",
        "name": "string",
        "schoolId": "string",
        "capacity": 100,
        "createdByUserId": "string",
        "createdAt": "string",
        "updatedAt": "string"
    },
    "errors": []
}
```

### List Classrooms

Retrieve a list of all classrooms.

#### Endpoint

```http
GET /api/class-rooms
```

#### Headers

```
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter | Type   | Required | Description                   | Default |
| --------- | ------ | -------- | ----------------------------- | ------- |
| page      | number | No       | Page number for pagination    | 1       |
| limit     | number | No       | Number of classrooms per page | 10      |

#### Success Response

```json
{
    "message": "Class rooms fetched successfully",
    "ok": true,
    "data": {
        "docs": [
            {
                "_id": "string",
                "name": "string",
                "schoolId": "string",
                "capacity": 100,
                "createdByUserId": "string",
                "createdAt": "string",
                "updatedAt": "string"
            }
        ],
        "totalDocs": 3,
        "limit": 10,
        "totalPages": 1,
        "page": 1,
        "pagingCounter": 1,
        "hasPrevPage": false,
        "hasNextPage": false,
        "prevPage": null,
        "nextPage": null
    },
    "errors": []
}
```

### Get Classroom

Retrieve details of a specific classroom by ID.

#### Endpoint

```http
GET /api/class-rooms/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| id        | string | Yes      | Unique ID of classroom |

#### Success Response

```json
{
    "message": "Class room fetched successfully",
    "ok": true,
    "data": {
        "_id": "string",
        "name": "string",
        "schoolId": "string",
        "capacity": 100,
        "createdByUserId": "string",
        "createdAt": "string",
        "updatedAt": "string"
    },
    "errors": []
}
```

### Delete Classroom

Delete a specific classroom by ID.

#### Endpoint

```http
DELETE /api/class-rooms/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| id        | string | Yes      | Unique ID of classroom |

#### Success Response

```json
{
    "message": "Class room deleted successfully",
    "ok": true,
    "data": {},
    "errors": []
}
```

### Create Student

Register a user as a student in a specific classroom and school.

#### Endpoint

```http
POST /api/students
```

#### Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

#### Request Body

```json
{
    "classRoomId": "string",
    "schoolId": "string"
}
```

#### Request Body Parameters

| Parameter   | Type   | Required | Description         |
| ----------- | ------ | -------- | ------------------- |
| classRoomId | string | Yes      | ID of the classroom |
| schoolId    | string | Yes      | ID of the school    |

#### Success Response

```json
{
    "message": "Student created successfully",
    "ok": true,
    "data": {
        "student": {
            "userId": "string",
            "classRoomId": "string",
            "registrationNumber": "string",
            "status": "pending",
            "schoolId": "string",
            "_id": "string",
            "createdAt": "string",
            "updatedAt": "string"
        }
    },
    "errors": []
}
```

### Students Endpoints

### List Students

Retrieve a list of students with filtering options.

#### Endpoint

```http
GET /api/students
```

#### Headers

```
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter | Type   | Required | Description                            | Default |
| --------- | ------ | -------- | -------------------------------------- | ------- |
| schoolId  | string | Yes      | ID of the school to filter students    | -       |
| classId   | string | No       | ID of the classroom to filter students | -       |
| page      | number | No       | Page number for pagination             | 1       |
| limit     | number | No       | Number of students per page            | 10      |

#### Success Response

```json
{
    "message": "Students fetched successfully",
    "ok": true,
    "data": {
        "docs": [
            {
                "_id": "string",
                "userId": "string",
                "classRoomId": "string",
                "registrationNumber": "string",
                "status": "pending",
                "schoolId": "string",
                "createdAt": "string",
                "updatedAt": "string"
            }
        ],
        "totalDocs": 1,
        "limit": 10,
        "totalPages": 1,
        "page": 1,
        "pagingCounter": 1,
        "hasPrevPage": false,
        "hasNextPage": false,
        "prevPage": null,
        "nextPage": null
    },
    "errors": []
}
```

### Update Student

Update details of a specific student.

#### Endpoint

```http
PATCH /api/students/:id
```

#### Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Required | Description                 |
| --------- | ------ | -------- | --------------------------- |
| id        | string | Yes      | Unique ID of student record |

#### Request Body

```json
{
    "classRoomId": "string",
    "schoolId": "string",
    "status": "string"
}
```

#### Request Body Parameters

| Parameter   | Type   | Required | Description                            |
| ----------- | ------ | -------- | -------------------------------------- |
| classRoomId | string | No       | ID of the new classroom                |
| schoolId    | string | No       | ID of the new school                   |
| status      | string | No       | New status (e.g., "active", "pending") |

#### Success Response

```json
{
    "message": "Student updated successfully",
    "ok": true,
    "data": {
        "_id": "string",
        "userId": "string",
        "classRoomId": "string",
        "registrationNumber": "string",
        "status": "string",
        "schoolId": "string",
        "createdAt": "string",
        "updatedAt": "string"
    },
    "errors": []
}
```

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

# How to Deploy

## PM2 Deployment

1. Install PM2 globally:

```bash
npm install -g pm2
```

2. Start the application:

```bash
pm2 start ./index.js --name "school-management-api"
```

3. Enable startup script (auto-restart on server reboot):

```bash
pm2 startup
pm2 save
```

4. Useful PM2 commands:

```bash
pm2 status                  # Check application status
pm2 logs                    # View logs
pm2 monit                   # Monitor CPU/Memory
pm2 restart school-management-api  # Restart application
```

## Docker Deployment

1. Build and run with Docker Compose:

```bash
docker-compose up -d
```

2. Monitor containers:

```bash
docker-compose ps
docker-compose logs -f
```

# 🚀 Deployment

## Environment Setup

### Development

1. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

2. Configure required environment variables

### Production

For production deployment, set environment variables securely:

#### PM2

```bash
pm2 start src/index.js --name "school-management-api" --env-file .env.production
```

#### Docker

Use docker-compose environment file:

1. Create `.env.production`

2. Reference in docker-compose:

```bash
docker-compose --env-file .env.production up -d
```

### Security Notes

-   Never commit `.env` files to version control
-   Use different secrets for development and production
-   Consider using a secrets management service in production
