# Covion Partners - Complete Pages and Features Documentation

## Overview
Covion Partners is a comprehensive business collaboration platform that combines project management, deal making, financial management, team collaboration, job posting, and more. The platform supports multiple user roles (Public, Partner, Manager, Business/Admin, Investor, Viewer, CEO) with role-based access control.

---

## User Roles & Account Types

### Account Types
1. **Public Account** (Free) - Limited features, can create up to 4 projects, 2 job posts/month
2. **Partner Account** (Free) - For investors, 2% fee on successful investments
3. **Manager Account** ($25/month) - Full project creation and management
4. **Business Account** ($45/month) - Full platform access with advanced features

### User Roles
- `public` - Public account users
- `partner` - Manager account users
- `investor` - Partner account users
- `viewer` - Read-only access
- `admin` - Business account users, full access
- `ceo` - CEO dashboard access

---

## Core Feature Categories

### 1. Authentication & Onboarding
### 2. Project Management
### 3. Deal Making & Negotiations
### 4. Financial Management
### 5. Team Collaboration
### 6. Workflow & Task Management
### 7. Jobs & Hiring
### 8. Messaging & Communication
### 9. Organizations & Companies
### 10. Admin & Management
### 11. Settings & Configuration
### 12. Public Features

---

## Complete Page List

### AUTHENTICATION & ONBOARDING

#### `/` (Home Page)
**Purpose:** Landing page with platform overview
**Features:**
- Infinito AI chat integration for platform questions
- Featured public projects preview
- Community feed preview
- Feature cards (Workflow, Deals, Finance, Projects, Team, Jobs)
- Navigation to signup/login
- Role-based redirects after login

**How it works:**
- Redirects authenticated users to role-specific dashboards
- Shows 3 random public projects
- Displays sample feed posts
- Links to `/account-types` for signup

---

#### `/login`
**Purpose:** User authentication
**Features:**
- Email/password login
- Signup form
- Password reset
- Account type selection during signup
- OAuth integration (if configured)

**Integration:**
- Redirects to `/dashboard` (partners), `/ceodash` (admins), `/publicprojects` (investors/viewers)
- Sets user session and role

---

#### `/signup`
**Purpose:** New user registration
**Features:**
- Account type selection
- Email verification
- Profile creation
- Role assignment based on account type

**Integration:**
- Creates user in `users` and `profiles` tables
- Assigns role based on selected account type
- Redirects to onboarding

---

#### `/account-types`
**Purpose:** Account type selection and subscription management
**Features:**
- Display all account tiers with features
- Current subscription status
- Upgrade/downgrade options
- Stripe integration for paid plans
- Free trial for paid tiers

**Features by Tier:**
- **Public:** View projects, support projects, create 2 projects, join projects
- **Partner:** All public + basic analytics, project funding
- **Manager:** All partner + unlimited projects, team collaboration, priority support
- **Business:** All manager + API access, custom reports, advanced analytics

**Integration:**
- Links to Stripe checkout for paid plans
- Updates user role in database
- Manages subscription lifecycle

---

#### `/onboarding`
**Purpose:** New user onboarding flow
**Features:**
- Profile completion
- Company information
- Initial preferences setup
- Feature introduction

---

### PROJECT MANAGEMENT

#### `/projects`
**Purpose:** Main projects listing page
**Features:**
- Project cards with thumbnails
- Search and filter by status
- Status statistics (Total, Active, Pending, On Hold, Completed)
- Join project by key
- Create new project button
- Favorite/pin projects
- Project progress indicators
- Budget display
- Team member count
- Delete project (owner only)
- Public view link

**Key Features:**
- **Join Project:** Enter project key to request access
- **Status Filtering:** Click stat cards to filter
- **Search:** Search by name or description
- **Favorites:** Pin important projects to top
- **Public Limit:** Public users limited to 4 projects

**Integration:**
- Uses `useProjects` hook
- Creates notifications for join requests
- Links to `/projects/[id]` for details
- Links to `/projects/new` for creation

---

#### `/projects/new`
**Purpose:** Create new project
**Features:**
- Project name, description
- Budget, deadline
- Status selection
- Media file uploads
- Initial team member addition
- Project key generation

**Integration:**
- Creates project in database
- Sets owner as team member
- Generates unique project key
- Redirects to project detail page

---

#### `/projects/[id]`
**Purpose:** Individual project detail page
**Features:**
- Project overview and details
- Team members list
- Tasks and workflow
- Financial information
- Project files
- Updates/announcements
- Settings (owner only)
- Media gallery

**Integration:**
- Links to `/projects/[id]/team` for team management
- Links to `/projects/financials` for finances
- Links to `/task/[id]` for task details
- Links to `/projectfiles` for file management

---

#### `/projects/[id]/edit`
**Purpose:** Edit project details
**Features:**
- Update project information
- Modify budget and deadlines
- Change status
- Update media files
- Manage project settings

---

#### `/projects/[id]/team`
**Purpose:** Project team management
**Features:**
- View all team members
- Add/remove members
- Manage roles and permissions
- Access level assignment
- Member status (active, pending, inactive)

**Integration:**
- Uses `team_members` table
- Creates notifications for new members
- Links to `/projects/[id]/viewteam` for detailed view

---

#### `/projects/[id]/viewteam`
**Purpose:** Detailed team view
**Features:**
- Team member profiles
- Role descriptions
- Activity history
- Permissions overview

---

#### `/projects/[id]/roles`
**Purpose:** Project-specific roles
**Features:**
- Define custom project roles
- Assign roles to team members
- Role-based permissions

---

#### `/projects/financials`
**Purpose:** Project financial management
**Features:**
- Budget tracking
- Expenses
- Revenue
- Financial reports
- Transaction history

**Integration:**
- Links to `/expenses` for expense management
- Integrates with payment system

---

#### `/projectsinfo`
**Purpose:** Information page about project features
**Features:**
- Feature overview
- Use cases
- Benefits
- Getting started guide

---

#### `/publicprojects`
**Purpose:** Browse public projects
**Features:**
- Grid view of public projects
- Search and filter
- Project cards with thumbnails
- Funding goals
- Progress indicators
- Action buttons (Make Deal, Invest, Support, Collaborate)
- Sort and filter options

**Integration:**
- Links to `/publicprojects/[id]` for details
- Links to `/makedeal?project={id}` for deals
- Links to `/invest?project={id}` for investments
- Links to `/purchase2support?project={id}` for support

---

#### `/publicprojects/[id]`
**Purpose:** Public project detail page
**Features:**
- Full project information
- Media gallery
- Funding progress
- Team members (public)
- Updates and announcements
- Support/investment options

**Integration:**
- Links to investment/support pages
- Links to deal creation
- Links to collaboration requests

---

#### `/publicprojects/[id]/apply`
**Purpose:** Apply to join public project
**Features:**
- Application form
- Role selection
- Message to project owner
- Application submission

**Integration:**
- Creates application record
- Sends notification to owner
- Updates project applications count

---

#### `/publicsettings`
**Purpose:** Manage public project visibility
**Features:**
- Toggle public visibility
- Configure public features
- Set funding goals
- Manage public information
- Control action buttons visibility

**Integration:**
- Updates project public settings
- Controls what appears on `/publicprojects`

---

#### `/projectfiles`
**Purpose:** Project file management
**Features:**
- File upload/download
- File organization
- Version control
- Access permissions
- File sharing

**Integration:**
- Uses Supabase Storage
- Links to `/projectfiles/[id]` for file details

---

#### `/projectfiles/[id]`
**Purpose:** Individual file details
**Features:**
- File preview
- Download
- Version history
- Comments
- Access control

---

#### `/projectrequest`
**Purpose:** Request project creation (if restricted)
**Features:**
- Project request form
- Approval workflow
- Status tracking

---

#### `/userprojects`
**Purpose:** User's personal projects view
**Features:**
- Projects owned by user
- Projects user is member of
- Quick access to project actions

---

#### `/userprojects/[id]`
**Purpose:** User project detail view
**Features:**
- Project from user perspective
- Personal tasks
- Contributions
- Activity log

---

### DEAL MAKING & NEGOTIATIONS

#### `/deals`
**Purpose:** Deals listing and management
**Features:**
- Table view of all deals
- Search and filter (status, type, confidentiality)
- Deal status badges
- Participant avatars
- Budget display
- Confidentiality levels (Public, Private, Confidential)
- Actions: View, Negotiate, Edit, Delete

**Deal Types:**
- Investment
- Partnership
- Collaboration
- Acquisition
- Custom

**Deal Statuses:**
- Pending
- Accepted
- Rejected
- Completed
- Negotiation

**Integration:**
- Links to `/deals/[id]` for details
- Links to `/makedeal` for creation
- Links to `/negotiate?deal={id}` for negotiations

---

#### `/deals/[id]`
**Purpose:** Deal detail page
**Features:**
- Full deal information
- Participants list
- Negotiation history
- Documents
- Status updates
- Comments and messages

**Integration:**
- Links to negotiation table
- Links to contract signing
- Updates deal status

---

#### `/deals/[id]/edit`
**Purpose:** Edit deal details
**Features:**
- Update deal information
- Modify participants
- Change status
- Update budget
- Modify confidentiality level

---

#### `/makedeal`
**Purpose:** Create new deal
**Features:**
- Deal creation form
- Type selection
- Participant selection
- Budget setting
- Confidentiality level
- Deadline setting
- Custom deal type option

**Integration:**
- Creates deal in database
- Sends notifications to participants
- Links to `/deals/[id]` after creation

---

#### `/deals-feature`
**Purpose:** Information page about deal features
**Features:**
- Deal making overview
- Use cases
- Benefits
- Getting started

---

#### `/dealsrequest`
**Purpose:** Request deal creation
**Features:**
- Deal request form
- Approval workflow

---

#### `/negotiate`
**Purpose:** Deal negotiation interface
**Features:**
- Negotiation table
- Counter-offers
- Terms discussion
- Document sharing
- Real-time updates

**Integration:**
- Links to `/negotiationtable` for detailed view
- Updates deal status
- Creates negotiation history

---

#### `/negotiationtable`
**Purpose:** Detailed negotiation interface
**Features:**
- Full negotiation history
- Term-by-term negotiation
- Document attachments
- Participant actions
- Status tracking

---

#### `/opendeals`
**Purpose:** Browse open/public deals
**Features:**
- Public deals listing
- Deal discovery
- Filtering options
- Application to join deals

---

#### `/customdeal` & `/custom-deal`
**Purpose:** Create custom deal types
**Features:**
- Custom deal configuration
- Special terms
- Unique workflows

---

### FINANCIAL MANAGEMENT

#### `/financialhub`
**Purpose:** Financial hub information page
**Features:**
- Financial features overview
- Real-time insights
- Secure transactions
- Financial analytics
- Send money features
- Support token features

---

#### `/balance`
**Purpose:** View account balance
**Features:**
- Current balance
- Pending balance
- Transaction history
- Balance breakdown

**Integration:**
- Uses `cvnpartners_user_balances` table
- Links to `/withdraw` for withdrawals
- Links to transaction history

---

#### `/payments`
**Purpose:** Payment management
**Features:**
- Payment history
- Payment methods
- Recurring payments
- Payment settings

**Integration:**
- Links to `/managepayments` for detailed management
- Integrates with Stripe

---

#### `/managepayments`
**Purpose:** Comprehensive payment management
**Features:**
- Payment methods (cards, bank accounts)
- Add/remove payment methods
- Set default payment method
- Payment history
- Billing information

**Integration:**
- Uses Stripe for payment processing
- Links to `/savepayments` for saved methods

---

#### `/savepayments`
**Purpose:** Saved payment methods
**Features:**
- List saved payment methods
- Edit payment methods
- Set default
- Remove methods

---

#### `/pay`
**Purpose:** Make a payment
**Features:**
- Payment form
- Recipient selection
- Amount entry
- Payment method selection
- Payment confirmation

**Integration:**
- Processes payments through Stripe
- Updates balances
- Creates transaction records

---

#### `/withdraw`
**Purpose:** Withdraw funds
**Features:**
- Withdrawal form
- Payment method selection (Bank, PayPal, Debit Card)
- Amount entry
- Withdrawal history
- Status tracking

**Integration:**
- Uses `/api/withdrawals` endpoints
- Integrates with Plaid (ACH), PayPal, Stripe (Debit)
- Updates balance after processing

---

#### `/3-payments`
**Purpose:** Three-payment system (legacy/alternative)
**Features:**
- Alternative payment interface
- Multiple payment options
- Payment processing

---

#### `/purchase2support`
**Purpose:** Support projects with purchases
**Features:**
- Support amount selection
- Payment processing
- Token allocation
- Support confirmation

**Integration:**
- Links to `/purchase2support/[id]` for specific project
- Links to `/purchase2support/success` after payment

---

#### `/purchase2support/[id]`
**Purpose:** Support specific project
**Features:**
- Project-specific support
- Amount selection
- Payment processing
- Support confirmation

---

#### `/purchase2support/success`
**Purpose:** Support payment success page
**Features:**
- Confirmation message
- Transaction details
- Next steps

---

#### `/invest`
**Purpose:** Investment interface
**Features:**
- Investment form
- Project selection
- Investment amount
- Terms review
- Investment processing

**Integration:**
- Links to `/invest/[id]` for specific project
- Creates investment records
- Updates project funding

---

#### `/invest/[id]`
**Purpose:** Invest in specific project
**Features:**
- Project investment details
- Investment amount
- Terms and conditions
- Payment processing
- Investment confirmation

---

#### `/reinvest`
**Purpose:** Reinvest earnings
**Features:**
- Reinvestment options
- Amount selection
- Project selection
- Reinvestment processing

**Integration:**
- Links to `/reinvest/[id]` for specific project

---

#### `/reinvest/[id]`
**Purpose:** Reinvest in specific project
**Features:**
- Project-specific reinvestment
- Amount calculation
- Processing

---

#### `/business-expense`
**Purpose:** Business expense tracking
**Features:**
- Expense entry
- Category selection
- Receipt upload
- Approval workflow

**Integration:**
- Links to `/business-expenses` for listing
- Links to `/business-expense-history` for history

---

#### `/business-expenses`
**Purpose:** Business expenses listing
**Features:**
- All expenses
- Filtering and search
- Status tracking
- Approval actions

---

#### `/business-expense-history`
**Purpose:** Expense history
**Features:**
- Historical expenses
- Reports
- Analytics
- Export options

---

#### `/expenses`
**Purpose:** General expense management
**Features:**
- Expense tracking
- Categories
- Budgets
- Reports

**Integration:**
- Links to `/expense/[id]` for details

---

#### `/expense/[id]`
**Purpose:** Individual expense details
**Features:**
- Expense information
- Receipts
- Approval status
- Comments

---

#### `/covionbank`
**Purpose:** Covion Bank interface
**Features:**
- Banking features
- Account management
- Financial services

---

#### `/subscription`
**Purpose:** Subscription management
**Features:**
- Current subscription
- Plan details
- Billing information
- Upgrade/downgrade options

**Integration:**
- Links to `/account-types` for plan changes
- Integrates with Stripe subscriptions

---

#### `/funding-settings`
**Purpose:** Funding configuration
**Features:**
- Funding preferences
- Payment methods
- Funding goals
- Auto-funding settings

---

#### `/publicfunding`
**Purpose:** Public funding interface
**Features:**
- Public funding options
- Crowdfunding features
- Funding campaigns

---

### WORKFLOW & TASK MANAGEMENT

#### `/workflowhub`
**Purpose:** Workflow hub information page
**Features:**
- Workflow features overview
- Automation capabilities
- Real-time collaboration
- Priority management
- Productivity insights

---

#### `/workflow`
**Purpose:** Workflow management
**Features:**
- Workflow creation
- Task automation
- Workflow templates
- Status tracking

**Integration:**
- Links to `/workmode` for work interface
- Links to tasks

---

#### `/workmode`
**Purpose:** Work mode interface
**Features:**
- Active work sessions
- Task focus mode
- Time tracking
- Productivity tools

**Integration:**
- Links to `/workmode/timeline/[id]` for timeline view

---

#### `/workmode/timeline/[id]`
**Purpose:** Work timeline view
**Features:**
- Timeline visualization
- Task scheduling
- Dependencies
- Progress tracking

---

#### `/work-dashboard`
**Purpose:** Work dashboard
**Features:**
- Work overview
- Active tasks
- Time tracking
- Productivity metrics

---

#### `/work-submission`
**Purpose:** Submit completed work
**Features:**
- Work submission form
- File attachments
- Quality checks
- Submission approval

**Integration:**
- Links to `/admin/work-submissions` for admin review

---

#### `/my-assignments`
**Purpose:** View assigned tasks
**Features:**
- All assigned tasks
- Status filtering
- Priority sorting
- Task details

**Integration:**
- Links to `/task/[id]` for task details
- Uses `useTasks` hook

---

#### `/task/[id]`
**Purpose:** Individual task details
**Features:**
- Task information
- Status updates
- Comments
- Attachments
- Time tracking
- Dependencies

**Integration:**
- Links to project page
- Updates task status
- Creates notifications

---

### JOBS & HIRING

#### `/jobs`
**Purpose:** Jobs board
**Features:**
- Job listings grid
- Search and filter (location, type, experience level, skills)
- Remote filter
- Job cards with company logos
- Application count
- View count
- Apply button

**Job Types:**
- Full Time
- Part Time
- Contract
- Internship
- Freelance

**Integration:**
- Links to `/jobs/[id]` for details
- Links to `/jobs/post` for posting
- Links to `/jobs/[id]/apply` for applications
- Public users limited to 2 posts/month

---

#### `/jobs/[id]`
**Purpose:** Job detail page
**Features:**
- Full job description
- Company information
- Requirements
- Benefits
- Application form
- Similar jobs

**Integration:**
- Links to `/jobs/[id]/apply` for application
- Links to `/jobs/[id]/edit` for editing (employer)
- Links to `/jobs/[id]/applications` for viewing applications

---

#### `/jobs/[id]/apply`
**Purpose:** Apply for job
**Features:**
- Application form
- Resume upload
- Cover letter
- Application submission
- Status tracking

**Integration:**
- Creates application record
- Sends notification to employer
- Updates application count

---

#### `/jobs/[id]/edit`
**Purpose:** Edit job posting
**Features:**
- Update job details
- Modify requirements
- Change status
- Update salary

---

#### `/jobs/[id]/applications`
**Purpose:** View job applications
**Features:**
- All applications
- Applicant profiles
- Application status
- Filtering and search
- Application actions (approve, reject, interview)

**Integration:**
- Links to applicant profiles
- Updates application status
- Sends notifications

---

#### `/jobs/post`
**Purpose:** Post new job
**Features:**
- Job posting form
- Company selection
- Job details
- Requirements
- Salary information
- Skills tags
- Job type and level

**Integration:**
- Creates job in database
- Links to organization
- Sets employer
- Public users limited to 2/month

---

#### `/jobs/guide`
**Purpose:** Job posting guide
**Features:**
- How to post jobs
- Best practices
- Tips and guidelines

---

#### `/open-roles`
**Purpose:** Open project roles
**Features:**
- Project-based roles
- Role applications
- Role management

**Integration:**
- Links to projects
- Links to role applications

---

#### `/approved-positions`
**Purpose:** Approved positions listing
**Features:**
- Approved job positions
- Position details
- Application options

---

#### `/hire`
**Purpose:** Hiring interface
**Features:**
- Hiring dashboard
- Candidate search
- Interview scheduling
- Offer management

---

#### `/jobportal`
**Purpose:** Job portal interface
**Features:**
- Alternative job interface
- Job discovery
- Company profiles

---

### MESSAGING & COMMUNICATION

#### `/messages`
**Purpose:** Messages inbox
**Features:**
- Message list
- Search messages
- Unread indicators
- Message threads
- Edit/delete messages (sent only)
- New message button

**Integration:**
- Links to `/messages/[id]` for thread view
- Links to `/messages/new` for new message
- Marks messages as read

---

#### `/messages/[id]`
**Purpose:** Message thread view
**Features:**
- Full conversation
- Reply functionality
- Message history
- Participant information
- File attachments

**Integration:**
- Creates reply messages
- Updates read status
- Links to user profiles

---

#### `/messages/new`
**Purpose:** Compose new message
**Features:**
- Recipient selection
- Subject and content
- File attachments
- Send message

**Integration:**
- Creates message in database
- Sends notification to recipient
- Links to `/messages/[id]` after sending

---

#### `/feed`
**Purpose:** Community feed
**Features:**
- Social feed posts
- Like and comment
- Share posts
- User activity
- Project updates

**Integration:**
- Displays updates from projects
- Shows user activity
- Links to profiles and projects

---

#### `/groupchat`
**Purpose:** Group chat interface
**Features:**
- Group conversations
- Multiple participants
- File sharing
- Real-time messaging

---

#### `/contact`
**Purpose:** Contact form
**Features:**
- Contact form
- Support requests
- General inquiries

---

#### `/contacts`
**Purpose:** Contacts management
**Features:**
- Contact list
- Contact details
- Communication history

---

### ORGANIZATIONS & COMPANIES

#### `/createorganization`
**Purpose:** Create new organization
**Features:**
- Organization creation form
- Company details
- Logo upload
- Initial settings

**Integration:**
- Creates organization in database
- Sets creator as owner
- Links to `/myorganizations`

---

#### `/myorganizations`
**Purpose:** User's organizations
**Features:**
- Organizations list
- Organization cards
- Quick actions
- Settings access

**Integration:**
- Links to `/company/[slug]` for details
- Links to `/organization-staff` for staff management
- Links to `/companysettings` for settings

---

#### `/company/[slug]`
**Purpose:** Company/organization profile
**Features:**
- Company information
- Team members
- Job postings
- Projects
- Documents

**Integration:**
- Links to `/company/[slug]/documents` for documents
- Links to `/company/[slug]/job-history` for job history
- Links to jobs posted by company

---

#### `/company/[slug]/documents`
**Purpose:** Company documents
**Features:**
- Document library
- File organization
- Access control
- Document sharing

---

#### `/company/[slug]/job-history`
**Purpose:** Company job history
**Features:**
- Historical job postings
- Statistics
- Analytics

---

#### `/companysettings`
**Purpose:** Company settings
**Features:**
- Company information
- Logo and branding
- Settings configuration
- Member management

**Integration:**
- Links to `/organization-staff` for staff

---

#### `/organization-staff`
**Purpose:** Organization staff management
**Features:**
- Staff member list
- Add staff by email
- Role assignment (Owner, Admin, Manager, Member, Viewer)
- Status management (Active, Pending, Inactive)
- Search and filter
- Edit/remove staff

**Roles:**
- **Owner:** Full control (cannot be edited/deleted)
- **Admin:** Can manage organization and members
- **Manager:** Can manage projects and teams
- **Member:** Full access to projects
- **Viewer:** Read-only access

**Integration:**
- Uses `/api/organization-staff` endpoints
- Updates `team_members` table with `organization_id`
- Creates notifications

---

#### `/partners-overview`
**Purpose:** Partners overview
**Features:**
- Partners listing
- Partner profiles
- Partnership information

---

#### `/partners-settings`
**Purpose:** Partner settings
**Features:**
- Partner configuration
- Partnership management
- Settings

---

### ADMIN & MANAGEMENT

#### `/admin/users`
**Purpose:** User management (Admin)
**Features:**
- User list
- User details
- Role management
- Status updates
- User search

**Integration:**
- Links to `/admin/users/new` for new user
- Links to `/admin/users/edit/[id]` for editing

---

#### `/admin/users/new`
**Purpose:** Create new user (Admin)
**Features:**
- User creation form
- Role assignment
- Initial settings

---

#### `/admin/users/edit/[id]`
**Purpose:** Edit user (Admin)
**Features:**
- User information
- Role changes
- Status updates
- Permissions

---

#### `/admin/withdrawals`
**Purpose:** Withdrawal management (Admin)
**Features:**
- Withdrawal requests
- Approval workflow
- Status tracking
- Payment processing

**Integration:**
- Links to withdrawal details
- Updates withdrawal status

---

#### `/admin/work-submissions`
**Purpose:** Work submission review (Admin)
**Features:**
- Submitted work list
- Review interface
- Approval/rejection
- Quality checks

**Integration:**
- Links to `/work-submission` details
- Updates submission status

---

#### `/admin/opportunities`
**Purpose:** Opportunities management (Admin)
**Features:**
- Opportunities list
- Create/edit opportunities
- Status management

**Integration:**
- Links to `/admin/opportunities/new` for creation
- Links to `/admin/opportunities/edit/[id]` for editing

---

#### `/admin/opportunities/new`
**Purpose:** Create opportunity (Admin)
**Features:**
- Opportunity form
- Details entry
- Status setting

---

#### `/admin/opportunities/edit/[id]`
**Purpose:** Edit opportunity (Admin)
**Features:**
- Update opportunity
- Modify details
- Status changes

---

#### `/admin/reports`
**Purpose:** Admin reports
**Features:**
- Platform statistics
- User analytics
- Financial reports
- System metrics

---

#### `/admin/organizations`
**Purpose:** Organization management (Admin)
**Features:**
- Organizations list
- Organization details
- Management actions

---

#### `/admin/settings`
**Purpose:** Admin settings
**Features:**
- Platform settings
- Configuration
- System management

---

#### `/ceodash`
**Purpose:** CEO dashboard
**Features:**
- Executive overview
- Key metrics
- Strategic insights
- High-level analytics

**Access:** CEO role only

---

#### `/ceo`
**Purpose:** CEO interface
**Features:**
- CEO-specific features
- Executive tools

**Access:** CEO role only

---

#### `/ceoportal`
**Purpose:** CEO portal
**Features:**
- Portal interface
- Executive dashboard

**Access:** CEO role only

---

#### `/developerdashboard`
**Purpose:** Developer dashboard
**Features:**
- Developer tools
- API access
- Technical metrics

---

### SETTINGS & CONFIGURATION

#### `/settings`
**Purpose:** User settings
**Features:**
- **Profile Tab:**
  - Profile information
  - Avatar upload
  - Company details
  - Bio and location
- **Security Tab:**
  - Password change
  - Password reset
  - Sign out
- **Subscription Tab:**
  - Current subscription
  - Plan details
  - Change plan
  - Pause/resume/cancel
- **Billing Tab:**
  - Payment methods
  - Billing history
  - Payment management

**Integration:**
- Links to `/managepayments` for payment methods
- Links to `/account-types` for plan changes
- Updates user profile and settings

---

#### `/profile/[id]`
**Purpose:** User profile page
**Features:**
- Profile information
- Avatar
- Bio
- Activity
- Projects
- Deals
- Public information

**Integration:**
- Links to `/profile/[id]/deals` for user's deals
- Links to projects user is involved in

---

#### `/profile/[id]/deals`
**Purpose:** User's deals
**Features:**
- Deals list
- Deal status
- Deal details

---

#### `/profiles`
**Purpose:** Profiles listing
**Features:**
- Browse profiles
- Search users
- Filter options

---

#### `/accesslevels`
**Purpose:** Access levels information
**Features:**
- Access level definitions (1-5)
- Permission matrix
- Level descriptions

**Access Levels:**
- **Level 5:** Complete administrative access
- **Level 4:** Advanced access
- **Level 3:** Standard access
- **Level 4:** Basic access
- **Level 1:** Minimal view-only access

---

#### `/ai-settings`
**Purpose:** AI settings
**Features:**
- AI configuration
- Preferences
- AI feature toggles

---

#### `/ai-info`
**Purpose:** AI information
**Features:**
- AI features overview
- How it works
- Use cases

---

#### `/infinito-ai`
**Purpose:** Infinito AI interface
**Features:**
- AI chat interface
- AI assistance
- Platform questions

**Integration:**
- Uses `/api/ai-chat` endpoint
- Provides platform information

---

### PUBLIC FEATURES

#### `/publicsettings`
**Purpose:** Public settings management
**Features:**
- Public profile settings
- Visibility controls
- Public information management

---

#### `/publicfunding`
**Purpose:** Public funding interface
**Features:**
- Public funding options
- Crowdfunding
- Funding campaigns

---

### FILE MANAGEMENT

#### `/file-download`
**Purpose:** File download interface
**Features:**
- File listing
- Download options
- File management

**Integration:**
- Links to `/file-download/[id]` for file details
- Links to `/file-download/manage` for management
- Links to `/file-download/recipients` for recipients

---

#### `/file-download/[id]`
**Purpose:** File download details
**Features:**
- File information
- Download link
- Access control
- Expiration

---

#### `/file-download/manage`
**Purpose:** File management
**Features:**
- Upload files
- Manage files
- Set permissions
- Configure access

---

#### `/file-download/recipients`
**Purpose:** File recipients
**Features:**
- Recipient list
- Access management
- Download tracking

---

### CONTRACTS & LEGAL

#### `/contract-library`
**Purpose:** Contract library
**Features:**
- Contract templates
- Browse contracts
- Contract categories
- Search contracts

**Integration:**
- Links to `/contract-library/[id]` for contract details
- Links to `/sign-contract` for signing

---

#### `/contract-library/[id]`
**Purpose:** Contract details
**Features:**
- Contract information
- Template preview
- Usage instructions
- Download template

---

#### `/sign-contract`
**Purpose:** Sign contract
**Features:**
- Contract signing interface
- Document review
- Signature capture
- Contract execution

**Integration:**
- Uses Supabase Storage for contracts
- Creates contract records
- Links to contract library

---

### UPDATES & ANNOUNCEMENTS

#### `/updates`
**Purpose:** Updates listing
**Features:**
- All updates
- Filter by project
- Status filtering
- Search

**Integration:**
- Links to `/updates/[id]` for details
- Links to `/updates/[id]/edit` for editing

---

#### `/updates/[id]`
**Purpose:** Update details
**Features:**
- Full update content
- Comments
- Attachments
- Status

---

#### `/updates/[id]/edit`
**Purpose:** Edit update
**Features:**
- Update editing
- Content modification
- Status changes

---

#### `/updates/[id]/sign/[documentId]`
**Purpose:** Sign document in update
**Features:**
- Document signing
- Signature capture
- Approval workflow

---

### NOTES & DOCUMENTATION

#### `/notes`
**Purpose:** Notes listing
**Features:**
- All notes
- Search and filter
- Categories
- Tags

**Integration:**
- Links to `/notes/[id]` for note details

---

#### `/notes/[id]`
**Purpose:** Note details
**Features:**
- Note content
- Editing
- Sharing
- Tags

---

### CLOUD SERVICES

#### `/cloud-services`
**Purpose:** Cloud services listing
**Features:**
- Available services
- Service categories
- Integration options

**Integration:**
- Links to `/cloud-services/[serviceId]` for service details

---

#### `/cloud-services/[serviceId]`
**Purpose:** Cloud service details
**Features:**
- Service information
- Integration setup
- Configuration
- Usage statistics

---

### MARKETPLACE

#### `/marketplace`
**Purpose:** Marketplace
**Features:**
- Marketplace listings
- Products/services
- Search and filter
- Categories

**Integration:**
- Links to `/marketplace/[id]` for item details
- Links to `/marketplace/saved` for saved items
- Links to `/marketplace/apply/[id]` for applications

---

#### `/marketplace/[id]`
**Purpose:** Marketplace item details
**Features:**
- Item information
- Pricing
- Reviews
- Purchase/apply

---

#### `/marketplace/saved`
**Purpose:** Saved marketplace items
**Features:**
- Saved items list
- Quick access
- Remove items

---

#### `/marketplace/apply/[id]`
**Purpose:** Apply to marketplace item
**Features:**
- Application form
- Requirements
- Submission

---

### UTILITIES & TOOLS

#### `/calculator`
**Purpose:** Calculator tool
**Features:**
- Financial calculator
- Investment calculator
- Business calculations

---

#### `/analytics`
**Purpose:** Analytics dashboard
**Features:**
- Platform analytics
- User metrics
- Business insights
- Reports

---

#### `/schedule`
**Purpose:** Scheduling interface
**Features:**
- Calendar view
- Event scheduling
- Meeting management

---

#### `/portfolio`
**Purpose:** Portfolio view
**Features:**
- Investment portfolio
- Project portfolio
- Performance metrics

**Integration:**
- Links to `/portfolio/[id]` for portfolio details

---

#### `/portfolio/[id]`
**Purpose:** Portfolio details
**Features:**
- Portfolio information
- Holdings
- Performance
- Analytics

---

#### `/checktoken`
**Purpose:** Token checker
**Features:**
- Token validation
- Token information
- Token status

---

#### `/mytokens`
**Purpose:** User tokens
**Features:**
- Token balance
- Token history
- Token transactions

---

#### `/createtoken`
**Purpose:** Create token
**Features:**
- Token creation
- Token configuration
- Token distribution

---

#### `/forsale`
**Purpose:** Items for sale
**Features:**
- Marketplace listings
- Sales items
- Purchase options

---

#### `/buy`
**Purpose:** Buy interface
**Features:**
- Purchase interface
- Payment processing
- Order confirmation

---

#### `/client/[id]`
**Purpose:** Client details
**Features:**
- Client information
- Client projects
- Communication history

---

#### `/business/[id]`
**Purpose:** Business details
**Features:**
- Business information
- Business projects
- Business analytics

---

#### `/businessprofile`
**Purpose:** Business profile
**Features:**
- Business profile management
- Business information
- Settings

---

#### `/buildbusiness`
**Purpose:** Build business interface
**Features:**
- Business creation
- Business setup
- Initial configuration

---

#### `/corporate`
**Purpose:** Corporate interface
**Features:**
- Corporate features
- Enterprise tools
- Corporate management

---

#### `/livepromo/[id]`
**Purpose:** Live promotion
**Features:**
- Promotion details
- Promotional content
- Engagement tracking

---

#### `/marketing`
**Purpose:** Marketing interface
**Features:**
- Marketing tools
- Campaign management
- Marketing analytics

---

#### `/script-writer`
**Purpose:** Script writer tool
**Features:**
- Script creation
- Writing tools
- Script management

---

#### `/setup-checklist`
**Purpose:** Setup checklist
**Features:**
- Onboarding checklist
- Setup tasks
- Progress tracking

---

#### `/features`
**Purpose:** Features information page
**Features:**
- Platform features overview
- Feature categories
- Use cases
- Getting started

---

#### `/teamcollabinfo`
**Purpose:** Team collaboration information
**Features:**
- Collaboration features
- Team tools
- Best practices

---

#### `/dashboard`
**Purpose:** Main dashboard (Partner role)
**Features:**
- Overview cards
- Recent activity
- Quick actions
- Project summaries
- Deal summaries
- Task summaries

**Access:** Partner role (redirects based on role)

---

## How Pages Work Together

### Project Flow
1. **Create Project:** `/projects/new` → Creates project → `/projects/[id]`
2. **Join Project:** `/projects` → Enter key → Request access → Notification to owner → Approval → `/projects/[id]`
3. **Manage Team:** `/projects/[id]` → Team tab → `/projects/[id]/team` → Add members → Notifications
4. **Public Projects:** `/projects/[id]` → Make public → `/publicsettings` → Appears on `/publicprojects`

### Deal Flow
1. **Create Deal:** `/makedeal` → Create deal → `/deals/[id]`
2. **Negotiate:** `/deals/[id]` → Negotiate → `/negotiate?deal={id}` → `/negotiationtable`
3. **Sign Contract:** Deal accepted → `/sign-contract` → Contract execution
4. **Complete:** Deal completed → Status update → Financial processing

### Financial Flow
1. **Balance:** `/balance` → View balance
2. **Pay:** `/pay` → Select recipient → Process payment → Update balances
3. **Withdraw:** `/withdraw` → Select method → Request → Admin approval → `/admin/withdrawals` → Process
4. **Support Project:** `/publicprojects/[id]` → Support → `/purchase2support/[id]` → Payment → Success

### Job Flow
1. **Post Job:** `/jobs/post` → Create job → `/jobs/[id]`
2. **Apply:** `/jobs` → View job → `/jobs/[id]` → Apply → `/jobs/[id]/apply` → Submit
3. **Review:** Employer → `/jobs/[id]/applications` → Review → Approve/Reject
4. **Hire:** Approve → `/hire` → Interview → Offer

### Messaging Flow
1. **New Message:** `/messages` → New → `/messages/new` → Compose → Send
2. **Thread View:** `/messages` → Click message → `/messages/[id]` → Reply
3. **Notifications:** System creates notifications → User sees in dashboard

### Organization Flow
1. **Create Org:** `/createorganization` → Create → `/myorganizations`
2. **Manage Staff:** `/myorganizations` → Select org → `/organization-staff` → Add/edit staff
3. **Company Profile:** `/company/[slug]` → Public profile → Jobs, projects, team

### Workflow Flow
1. **Create Task:** Project page → Create task → `/task/[id]`
2. **Assign:** Task → Assign to team member → Notification
3. **Work:** `/my-assignments` → View tasks → `/task/[id]` → Update status
4. **Submit:** Complete work → `/work-submission` → Admin review → `/admin/work-submissions`

---

## Key Integrations

### Database Tables
- `users` - User accounts
- `profiles` - User profiles
- `projects` - Projects
- `team_members` - Project/organization members
- `deals` - Business deals
- `messages` - User messages
- `jobs` - Job postings
- `organizations` - Companies/organizations
- `transactions` - Financial transactions
- `cvnpartners_user_balances` - User balances
- `cvnpartners_withdrawals` - Withdrawal requests
- `notifications` - System notifications
- `contracts` - Contract library
- `guest_accounts` - Guest access system

### External Services
- **Supabase:** Database, Auth, Storage
- **Stripe:** Payment processing, subscriptions
- **Plaid:** Bank transfers (ACH)
- **PayPal:** PayPal payments
- **Infinito AI:** AI chat assistance

### API Endpoints
- `/api/projects/*` - Project management
- `/api/deals/*` - Deal management
- `/api/payments/*` - Payment processing
- `/api/withdrawals/*` - Withdrawal processing
- `/api/subscriptions/*` - Subscription management
- `/api/organization-staff/*` - Staff management
- `/api/guest-access/*` - Guest account system
- `/api/ai-chat` - AI assistance
- `/api/contracts/*` - Contract management

---

## Security & Permissions

### Role-Based Access Control
- **Public:** Limited to 4 projects, 2 jobs/month
- **Investor:** Can invest, view analytics
- **Partner:** Full project management
- **Admin:** Full platform access
- **CEO:** Executive dashboard

### Project Access Levels
- **Level 5:** Complete admin access
- **Level 4:** Advanced access
- **Level 3:** Standard access
- **Level 2:** Basic access
- **Level 1:** View-only

### Organization Roles
- **Owner:** Full control
- **Admin:** Manage organization
- **Manager:** Manage projects
- **Member:** Full project access
- **Viewer:** Read-only

---

## Notifications System

Notifications are created for:
- Project join requests
- Deal invitations
- Task assignments
- Message receipts
- Job applications
- Work submissions
- Financial transactions
- System updates

Notifications appear in:
- Dashboard
- Header notification icon
- Email (if enabled)
- In-app notifications

---

## File Storage

### Supabase Storage Buckets
- `avatars` - User profile pictures
- `partnerfiles` - Project/organization files
- `contracts` - Contract documents
- `job-resumes` - Job application files
- `project-media` - Project media files

---

This documentation covers all major pages and features in the Covion Partners platform. Each page integrates with others through shared hooks, API endpoints, and database tables to create a cohesive business collaboration ecosystem.

