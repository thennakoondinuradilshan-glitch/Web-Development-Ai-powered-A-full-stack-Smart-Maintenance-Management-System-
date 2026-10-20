# Smart Maintenance Viva Demonstration Checklist

## 1. Start the services

1. Confirm the Windows MongoDB service is running.
2. From `backend-mern`, run `npm.cmd start`.
3. Verify `http://localhost:5000/api/health` returns `success: true` and `database: "Connected"`.
4. From `frontend`, run `npm.cmd run dev`.
5. Open `http://localhost:5173`.

The backend API uses `MONGODB_URI` from `backend-mern/.env`; when it is not set, the safe local default is `mongodb://127.0.0.1:27017/smart_maintenance`.

## 2. Show the database in MongoDB Compass

Connect to the effective MongoDB URI without displaying credentials. Show the application database and the collections for users, equipment, maintenance requests, maintenance schedules, and sessions. Do not drop or reset any collection during the demonstration.

## 3. Demonstrate the application

1. Sign in with an existing Admin account.
2. Show the Dashboard’s equipment and maintenance summaries.
3. Use Equipment to search, filter, add, edit, view, and delete an equipment record when appropriate.
4. Create and update a Maintenance Request, then show its status and error handling.
5. Open Preventive Maintenance and demonstrate schedule creation, due dates, recurring frequency, completion, cancellation, overdue, due-today, and upcoming states.
6. Show that completing a recurring schedule creates only one next schedule, even if the completion request is repeated.
7. Open Reports to show uptime, work-order flow, overdue work, cost summary, and the maintenance follow-up action.
8. Use User Management as Admin to review users and role permissions.
9. Show the About section, light/dark mode, responsive sidebar, and accessible navigation.
10. Use the AI maintenance features only for the capabilities currently exposed by the application.

## 4. Email reminder note

The scheduler is configured for daily execution at 08:00 in `Asia/Colombo` and sends only to `ADMIN_NOTIFICATION_EMAIL`. Email delivery must be verified separately with the configured SMTP connection; do not claim delivery unless the SMTP server accepts the test message. Never show `EMAIL_APP_PASSWORD`, session secrets, or cookies during the viva.

## 5. Validation commands

From `frontend`:

```powershell
npm.cmd run build
npm.cmd run lint
```

From `backend-mern`:

```powershell
node --check server.js
```

The protected API should return `401` when requested without a login session.
