# NEU Library Log & Analytics System

An institutional-grade visitor monitoring and scholarly traffic analytics platform designed for the New Era University (NEU) Library. This system provides a seamless entry terminal for patrons and a robust administrative console for library staff.

Link for website: https://personal-project-infoman2-macayan.vercel.app

<strong>Account for testing</strong>

<br>
<br><strong>Password for Admin Dashboard: admin123</strong>
<br><strong>Admin Access</strong>

<br>Jeremias C. Esperanza (jcesperanza@neu.edu.ph) - Prof (Student/Admin)  
<br>Victor Crudo (vcrudo@neu.edu.ph) - IT Support (Librarian role available)
<br>Anna Bautista (abautista@neu.edu.ph) - Library Staff (Librarian role available)

<br><strong>Student</strong>

<br>Maria Garcia (mgarcia@neu.edu.ph) - Student, Engineering
<br>Luis Tan (ltan@neu.edu.ph) - Student, Business
<br>Rose Reyes (rreyes@neu.edu.ph) - Student, Nursing


## 🚀 Features

### Visitor Terminal (Patron Interface)
- **Multi-Modal Identification**: Patrons can identify using their institutional Google email or via a physical RFID/Student ID scan.
- **Guest Registration**: Integrated flow for new patrons (guests) to register their details (Name, College) directly at the terminal.
- **Scholarly Activity Logging**: Clean, touch-optimized interface for selecting the primary purpose of the visit (Research, Reading, Group Discussion, etc.).
- **Real-time Clock & Motivation**: Displays a live terminal clock and cycling scholarly quotes to inspire library users.

### Librarian Portal (Admin Console)
- **Secure Access**: Dedicated staff login flow with credential validation (`admin123`).
- **Real-time Analytics Dashboard**: 
    - **Patronage Insights**: High-level metrics on total traffic, unique scholars, and faculty engagement.
    - **Traffic Flow**: Area charts visualizing visitor volume trajectories.
    - **Research Goals**: Pie charts detailing the distribution of library usage purposes.
- **Visitor Management**: Tools to view detailed logs and manage user access privileges (Blocking/Unblocking patrons).
- **AI-Powered Insights**: Uses Gemini AI to analyze historical logs, identify unusual patterns, and provide operational recommendations.
- **PDF Reporting**: Formal "Institutional Patronage & Scholarly Traffic Reports" generated using `jspdf` for archive and auditing.

## 🛠 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (Real-time NoSQL)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth) (Anonymous & Email/Password)
- **AI Engine**: [Genkit](https://github.com/firebase/genkit) (Powered by Gemini 2.5 Flash)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) + [AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)

## 🔐 Security & Architecture

The system implements a **Database-Backed Access Control (DBAC)** model via Firestore Security Rules:
- **Admin Sentinels**: Administrative privileges are granted via a `roles_admin` sentinel collection.
- **Privacy**: Visit logs are only readable by administrators.
- **Integrity**: User profiles can only be updated by admins or the owner, ensuring secure access status.
- **Non-Blocking Updates**: Mutations use a specialized Firebase helper to ensure immediate local UI updates while syncing in the background.

## 🧪 Testing Guide

### Librarian Access
To access the Admin Dashboard, use the **Librarian Portal** on the main terminal:
- **Institutional Email**: `admin@neu.edu.ph` or `jcesperanza@neu.edu.ph`
- **Password**: `admin123`
- **Role Selection**: If prompted, select "Librarian Console".

### Student Access
Input any of the following institutional emails to test the student entry flow:
- `mgarcia@neu.edu.ph` (Engineering)
- `ltan@neu.edu.ph` (Business)
- `rreyes@neu.edu.ph` (Nursing)

### RFID / Student ID Flow
1. Click **RFID TAP**.
2. Input a known ID (e.g., `RFID-12345`) or a new ID (e.g., `2024-001`).
3. If the ID is new, follow the **Guest Registration** flow to add them to the system.

## 📂 Project Structure

- `src/app/page.tsx`: The main Visitor Terminal.
- `src/app/admin/`: All administrative routes (Dashboard, Log Management, AI Insights).
- `src/hooks/use-library-store.ts`: The central state management for the library database.
- `src/ai/`: Genkit AI flow definitions for trend analysis.
- `src/firebase/`: Core configuration and non-blocking SDK wrappers.
- `firestore.rules`: Production-ready security logic for the database.
