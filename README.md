# Task Management Backend API

A secure, production ready Task Management backend REST API built with JavaScript (Node.js), Express framework, and Prisma ORM. This application is connected to a live relational database via Neon PostgreSQL and is optimized to run both by as a standalone web service hosted on Render.com and as a database backend engine supporting a React Frontend interface.

## Project Overview and Purpose

This repository contains the complete final project for Code the Dreams’s Node/Express course adapted from the foundational homework repository provided by the course into production-ready backend architecture based repository.

The application’s main objective is to maintain strict user security in order that only authenticated users have access control and authorization to mutate tasks their specific tasks. This security is accomplished with stateful cookie-based sessions, parse and sanitize data and user information via JOI schema-based validation, and automated token checks. This backend code also manages batch database operations via Prisma’s built-in `createMany`, `deleteMany`, and `updateMany` hooks to execute operations in a single transaction instead of relying on inefficient client-side loops of individual changes.

---

## Key Features

- **Strict Tenant Isolation:** Secure multi-tenant architecture forcing a manual relational evaluation (`userId: req.user.id`) across Prisma queries to block data leakage between user sessions.
- **Input Validation and Sanitization:** Comprehensive schema guardrails using JOI based schema architecture to filter incoming request objects, validate strings against allowed priority levels (“low”, “medium”, “high”), and scrub data formats before database injection.
- **Authentication and Session Identity:** Protected user registration using RECAPTCHA bot bypass validation keys, password encryption, and stateful session management utilizing JWTs stored over `HTTPOnly` cookies.
- **Automated CSRF Defense:** Integrated custom CSRF middleware requiring synchronous verification of double-submitted tokens passed in the request header (`X-CSRF-Token`) across all mutative requests which include POST, PATCH, and DELETE.
- **Optimized Bulk Operations:** 
  * Use `POST /api/tasks/bulk` to create multiple tasks in a single transaction
  * Use `PATCH /api/tasks/bulk-update` to modify multiple tasks based on a parameter query filter of completion status 
  * Use `DELETE /api/tasks/bulk-delete` to remove multiple tasks based on an array of target IDs.
- **Advanced Task Filtering and Controls:** Case insensitive searches, pagination server side lists, dynamic filtering by status `?isCompleted=false`, and eager-loading table joins to attach owner relationships cleanly

---

## Security Framework and Risk Mitigation
    Backend implements defenses against data misuse and automated bot attacks

- **Payload Size Expansion**: The baseline Express JSON parser configuration has been scaled to increase the amount of payload in `app.js` (`app.use(express.json({ limit: "1mb" }));` ) to fully accommodate large multi-character Google reCAPTCHA payloads without dropping request validation
- **Bot defenses**: When a new user registers, the backend sends the reCaptcha token to Google to verify the user is a real human before saving them to the database

---

## Tech Stack and Dependencies

- **Node.js**: V8 engine Javascript Server Environment
- **Prisma ORM**: Type-Safe query builder, migration runner, schema manager
- **Express.js**: Framework for API routing engine and controller middleware architecture
- **Neon PostgreSQL**: Serverless cloud database PostgreSQL instance using connection pools
- **HTTP-Status-Codes**: Standard HTTP response tracking
- **JOI**: Object schema validation and data scrubbing

---

## Instructions on How to Setup Locally and for Development:

### Prerequisites

- **Node.js** (v18+)
- **Git** version control system
- **PostgreSQL** postgresSQL instance such as docker 

### Local Installation Steps

To run and configure this backend application on your computer do the following steps:

1. **Clone the Repository**
   Use the command below to download a local copy using Bash:
   Use copy and paste under https: on code (green button) on github

```bash

git clone https://github.com/BytesOfStrength/node–homework.git
cd node-homework
```

2. Install dependencies
   Use this command to install framework components, security tools, and library assets

```bash
npm install
```

3. **Environment Configuration File:**
   Create your local `.env` file in your project’s root and insert your credential variables. There is a created `.env.local.example` in the node-homework repository for reference: 

Cloud based database connection string that you are assigned when you get neon.tech account

DATABASE_URL= "postgresql://<db_user>:<db_password>@<neon_host_string>.neon.tech/<db_name>?sslmode=require"

Stateful security token string for digital signatures
JWT_SECRET=your_random_chosen_alphanumeric_string_digital_signature

Security and Bot-Bypass strings:
RECAPTCHA_SECRET="your_production_recaptcha_secret_key_string" (this is the key you get if you personally logon to google and Adding reCAPTCHA Support for your own project)

RECAPTCHA_BYPASS="your_configured_recaptcha_development_bypass_phrase"

GOOGLE_CLIENT_ID given value that matches the value in node-essentials -front-end repository
GOOGLE_CLIENT_ID="174295933149-09i1it2go1ssjpqtqam9vdm1pj257aqu.apps.googleusercontent.com"

*** **Note for Developers using reCAPTCHA**:
By default the registration endpoint has GOOGLE reCAPTCHA bot protection. If you clone this repository, you have two options for local testing:

* **Option 1: Use the Built-In Bypass (Quick Testing)** : Ensure that the `RECAPTCHA_BYPASS` variable's value is in your local `.env` file and matches across your configuration. When testing endpoints via Postman or JEST where a frontend token widget is not available, you need to supply a custom header parameter tracking your secret phrase:
    * **Header key**: `X-Recaptcha-Test` 
    * **Header value**: `RECAPTCHA_BYPASS` string value
* **Option 2: Full Production Testing**: If you want to test the live Google Network handshake then
    - Go to https://www.google.com/recaptcha/admin. You'll have to log on to Google if you haven't already.
    - Select the form that says "Register a new site." Give it some label, like "my ctd node homework".
    - Generate a pair of two v2 keys for the `localhost`
    You will be given two keys, the site key and the secret key. Save the site key in a comment in your node-homework .env file, and save the secret in a variable, like:

# reCAPTCHA site key gobbledygook

# RECAPTCHA_SECRET=othergobbledygook

Create a hard to guess secret. Add it to your .env file as RECAPTCHA_BYPASS. This is for testing. Add your secrets directly to your environmental variables.

4. **Database Alignment and Structure Sync**

To build custom JavaScript code engine to run prisma commands, run this terminal command: 

```bash
npx prisma generate
```

   To sync live Neon database structure definitions with your Prisma Migrations:
   Run this terminal command:

```bash

npx prisma migrate deploy
```

5. **Launch Prisma studio(optional)**
   To verify database schemas, inspect data tables or browse rows through a visual dashboard instead of writing raw SQL commands, boot up Prisma’s interface engine locally:

```bash
npx prisma studio
```

6. **Start the Express application server** 

```bash
npm run dev
```

(the application will run with local host at `http://localhost:3000`)

## Production Cloud Deployment Configuration using Render.com
   This backend application works with Render.com
   Follow these steps:
   1. Create a Render.com account or login and connect with your Github account 
   2. Click New+ and select Webservice 
   3. Select `node-homework` repository 
   4. Supply the following settings:
    * **Runtime:** Node
    * **Branch:** main
    * **Build command:** `npm install --production && npx prisma migrate deploy`
    * **Start command:** `npm start` 
   5. Add environment variables matching those in your local `.env` file by clicking `Add .env` button
   * **DATABASE_URL**
   * **JWT_SECRET**
   * **RECAPTCHA_BYPASS**
   * **RECAPTCHA_SECRET**

8. Click **Deploy Web Service**: look for a green live status indicator

## Postman Integration and Testing
   Every endpoint, request constraint, and database operation can be verified without a user interface by routing requests through Postman . Here we will assume using the render.com to be the cloud server for the backend

   * Note: make sure Postman global parameters have "enable cookie jar" checked so stateful session cookies persist automatically
   
    ### Step 1. Authentication and Identity verification
        * **Endpoints**:
                * Registration: `POST {{urlBase}}/api/users/register`
                * Logon:`POST {{urlBase}}/api/users/logon`


        * Save in Postman environment urlBase with a value of the https://node-homework-1yhc.onrender.com 


        * **Body format:** `raw (JSON)`
        * **Payload structure:**
        ```json
          { 
	         “email”: “email@example.com”,
	         “password”: “your_secure_password”
          }
        ```
        * **System Action**: Successful registration or logon attaches a secure session cookie (visible in Postman under `jwt` identifier) and returns a `csrfToken` in the response payload. Copy this token and save it as `csrfToken` Postman environment variable. It must be included as the `X-CSRF-Token` header in all subsequent task modification requests (POST, PATCH, DELETE) to verify your authorizations and prevent CSRF (cross site request forgery).

    ### Step 2. (OPTIMIZED ADDITIONAL FUNCTIONALITY ADDED)

        * **Bulk Task Update:**

            - Endpoint request method: `PATCH`
            - For URL : `{{urlBase}}/api/tasks/bulk-update?isCompleted=false`
            - Query Parameter Logic: ?isCompleted=false (This targets incomplete records only)
            - Required Headers Configuration:
                `Content-Type: application/json`
                `X-CSRF-Token`: copy_the_csrfToken_of_the_authenticated_user or program it automatically by using `{{csrfToken}}` assuming the csrfToken has been updated in the environment of Postman 
                - Body Format: raw(JSON) 
                - **Payload Structure**: { “isCompleted”: true} 
                - **Expected JSON success response (200 OK)**:
                   { “message”: “Bulk task update successful”,
                     “tasksUpdated”: number of tasks updated
                    }
        * **Bulk Task Deletions**
            - Endpoint request method: `DELETE`
            - For URL : `{{urlBase}}/api/tasks/bulk-delete`
            - Required Headers Configuration:
                `Content-Type: application/json`
                `X-CSRF-Token`: copy_the_csrfToken_of_the_authenicated_user or program it automatically by using `{{csrfToken}}` assuming the csrfToken has been updated in the environment of Postman 
                - Body Format: raw(JSON) 
                - Payload Structure:
                     {
                    “ids”:[1,2,3] 
                    } 
                - Expected JSON success response (200 OK):
                    { “message”: “Bulk task deletion successful”,
                        “tasksDeleted”: number of tasks deleted,
                        “TotalRequested”: number of tasks requested to be deleted
                    }

## Frontend Connection Compatibility

This API layer is designed to support client interactions from the curriculum-provided user interface engine (node-essentials-front-end).

### Connecting to the React Front end Client Application

Clone the client-side application structure from the code development repository:

1. **Clone the Repository**
   Use the command below to download a local copy using Bash:
   Use copy and paste under https: on code (green button) on github

```bash


git clone https://github.com/Code-the-Dream-School/node-essentials-front-end
cd node-essentials-front-end
npm install
```

2. Configure Frontend Environment Settings: Create a local `.env` setup file, and supply the environment configuration variables. It should match the setup in the `.env.local.example` file

VITE_BASE_URL=""
VITE_TARGET="https://node-homework-1yhc.onrender.com"
VITE_GOOGLE_CLIENT_ID="174295933149-09i1it2go1ssjpqtqam9vdm1pj257aqu.apps.googleusercontent.com"
VITE_RECAPTCHA_SITE_KEY="should_match_the_recaptcha_site_key_from .env_file_from_node_homework_repository"

Note: to test locally, switch value of VITE_TARGET to point to http://localhost:3000

3. To execute client side development server engine

```bash

npm run dev
  ```

The local host should run at `http://localhost: 3001`


Because both Postman requests and client React front-end communicate with the same centralized Node.js processing pathways and cloud Neon database, database mutations sync in real time.

## Future Implementations:
* **Google OAuth 2.0 Integration**:** support single sign-on via Google login buttons. This will involve getting an unique GOOGLE_CLIENT_SECRET and personal GOOGLE_CLIENT_ID via the Google Cloud Console, setting up secure backend callback redirect routes, and syncing profile tokens securely with the React client application.
* **Frontend UI Bulk Operations:** Update React UI to include checkboxes next to task on the dashboard, enabling users to natively trigger backend’s bulk-update and bulk-delete endpoints directly from the browser.

## API Endpoints and Data Fetching


# API sources


I am thankful for the open-source services and API's that provided the information needed to run the the front-end api, as well as provide the foundational core of this project's node-homework repository
**Sources**: Code the Dream provided the React front end repository: https://github.com/Code-the-Dream-School/node-essentials-front-end as well as the foundational start for the backend end api for the node-homework repository.



Credit: Code the Dream

## Copyright and Licensing:
## License


- **Licensing and Permission:** Code from this repository should not be cloned without giving credit to the original repository


The Foundational node-homework project and the node-eseentials-front-end has a copyright from Code the Dream
Copyright (c) 2025 Code the Dream
This project is licensed under the MIT License – see the [LICENSE](./LICENSE) file for details.

