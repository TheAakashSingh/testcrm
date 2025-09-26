# CRM - Sales Team Collaboration Tool

A simple CRM built for sales teams to manage leads and work together in real-time.

## What's Included

- User login/signup with different roles (Admin, Manager, Sales Rep)
- Add, edit, delete, and assign leads
- Track activities on leads (notes, calls, emails)
- Live updates when team members make changes
- Charts showing lead stats
- Mobile-friendly design
- Easy setup with Docker

## Tech Used

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express and TypeScript
- **Database**: MySQL with Prisma
- **Real-time**: Socket.io
- **Auth**: JWT tokens

## Quick Start


1. **Install MySQL** (use XAMPP if you prefer)
2. **Create database** named `crm` in phpMyAdmin
3. **Backend setup**:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev --name init
   npm run dev
   ```
4. **Frontend setup** (new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## First Time Use

1. Go to http://localhost:3000
2. Click "Register" to create your admin account
3. Login and start adding leads
4. Share with your team - they'll see updates in real-time

## API Endpoints

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/activities` - Add activity to lead

## Database

Uses MySQL with these tables:
- Users (with roles)
- Leads (with status and assignment)
- Activities (notes/calls/emails on leads)

## Need Help?

Check the code comments or run into issues? The setup is straightforward - most problems are with database connections. Make sure MySQL is running and the database exists.#

