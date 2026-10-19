# IMPORTANT: PLEASE READ FIRST

# UniVerse
A browser-based student organization management app designed to centralize student organization information in one place. It allows students to discover organizations, view their profiles, manage memberships, and keep track of events and announcements.

### Core Features:
- Organization listing with search + category filtering
- Organization profile pages
- Join + leave functionality
- "My Organization" Dashboard
- Organization, event, and announcement management for officers and admins

### INSTRUCTIONS
## Requirements:
- Node.js (we used v24; v22 or newer should work). Download from https://nodejs.org
- A terminal (PowerShell on Windows, Terminal on Mac)

## How to run the app

1. Open a terminal and go into the backend folder:

       cd backend

2. Create the settings file. It's already filled in; just copy it.

   Windows:

       copy .env.example .env

   Mac/Linux:

       cp .env.example .env

3. Install everything the app needs (this can take a minute):

       npm install

4. Create the database and add the demo data:

       npm run setup

5. Start the server:

       npm start

   You should see: `Server running at http://localhost:3000`
   Leave this terminal open while you use the app.

6. Open `frontend/login.html` in your browser (double-click the file).

## Demo accounts

| Role    | Email             | Password   |
|---------|-------------------|------------|
| Student | student@mmdc.edu  | student123 |
| Officer | officer@mmdc.edu  | officer123 |
| Admin   | admin@mmdc.edu    | admin123   |

These are also listed on the login page.

## What to try

- Student: join and leave an organization on its page, then check "My Organizations" on the Dashboard.
- Admin: approve or reject the two registration requests, and remove an organization. The numbers at the top update.
- Officer: sees the officer tools on the Dashboard.

## Troubleshooting

- "Failed to fetch" or organizations don't load: the server isn't running. Repeat step 5.
- Want the demo data back (e.g. the two registration requests)? Stop the server and run `npx prisma migrate reset`, `npx prisma generate`, then `npm run setup` again, then `npm start`.
- Port 3000 already in use: close the other program using it, or restart your computer.

### Group 24 (Developers)
- Ghian Renzen Arboleda
- Alyssa Posilero
- Elizabeth Gelena
