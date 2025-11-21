# TalentFlow - Modern Applicant Tracking System (ATS)

TalentFlow is a comprehensive, modern Applicant Tracking System designed to streamline the recruitment process. It offers a premium user experience with features like dark mode, real-time analytics, and seamless candidate management.

## 🚀 Key Features

### 🎨 UI/UX & Design
- **Modern Aesthetics**: Built with a premium design language using glassmorphism, gradients, and smooth animations.
- **Dark/Light Mode**: Fully supported theme switching with system preference sync.
- **Responsive Design**: Optimized for all devices, from desktops to mobile phones.

### 👥 Candidate Management
- **Manual Entry**: Add candidates manually with comprehensive details.
- **Resume Upload**: Support for PDF and Word documents with validation.
- **Resume Preview**: Integrated document viewer to read resumes directly within the app without downloading.
- **Pipeline Management**: Drag-and-drop or status-based movement through recruitment stages (Applied, Screening, Interview, Offer, Hired).
- **Rating System**: Rate candidates to easily identify top talent.

### 💼 Job Management
- **Create & Edit**: Full control over job postings with detailed descriptions, requirements, and salary ranges.
- **Status Control**: Open, close, or archive job positions.
- **Shareable Links**: Generate direct application links for candidates.

### 📊 Analytics & Insights
- **Real-time Dashboard**: Visual overview of your recruitment funnel.
- **Conversion Rates**: Track how candidates move through stages.
- **Time-to-Hire**: Monitor efficiency with historical trend data.
- **Interactive Charts**: Beautiful visualizations using Recharts.

### 📧 Communication
- **Email Templates**: Pre-defined templates for common recruitment scenarios (Interview Invite, Rejection, Offer).
- **Direct Emailing**: Send emails to candidates directly from their profile.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn UI, Lucide Icons
- **Backend**: Supabase (Database, Auth, Storage)
- **State Management**: React Query
- **Charts**: Recharts

## 🔄 Application Flow

### 1. Dashboard
Upon logging in, the user is greeted by the **Dashboard**, which provides a high-level overview of:
- Active Jobs
- Total Candidates
- Recent Activities
- Quick Actions (Add Candidate, Create Job)

### 2. Job Management
- Users can create new job postings via the **"Create Job"** dialog.
- Clicking on a job card opens the **Job Details** page, where you can:
  - Edit job details.
  - View all candidates applied to this specific job.
  - Toggle job status (Active/Closed).

### 3. Candidate Journey
- **Adding**: Use the "Add Candidate" button to manually input candidate data and upload their resume.
- **Reviewing**: Click on a candidate to view their **Detailed Profile**:
  - **Overview**: Contact info, cover letter, and job details.
  - **Resume**: View the uploaded resume file directly in the browser.
  - **Notes**: Add internal notes for the hiring team.
- **Processing**: Move candidates through stages (e.g., from "Screening" to "Interview") and send email updates.

### 4. Analytics
- The **Analytics Dashboard** offers deep insights into recruitment performance:
  - **Pipeline Distribution**: See where candidates are stuck.
  - **Funnel Conversion**: Analyze drop-off rates between stages.
  - **Hiring Velocity**: Track average time-to-hire.

## 🏃‍♂️ Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 📄 License

This project is licensed under the MIT License.
