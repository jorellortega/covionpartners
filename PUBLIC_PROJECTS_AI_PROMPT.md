# Public Projects Information and Features

## Overview
The Public Projects section allows users to browse, view, and interact with publicly visible projects. This includes a listing page, individual project detail pages, a support/purchase page for funding projects, and a settings page for managing public project visibility and features.

---

## 1. Public Projects List Page (`/publicprojects`)

**URL:** `https://www.covionpartners.com/publicprojects`

**Purpose:** Displays a grid of all public projects that users can browse, search, and interact with.

### Features:
- **Search Bar**: Allows users to search projects by name or description
- **Filter Button**: Opens filter options (currently placeholder)
- **Sort Button**: Opens sorting options (currently placeholder)
- **Project Cards**: Each card displays:
  - Project thumbnail/image
  - Project name and description
  - Project owner avatar (clickable to view profile)
  - Project status badge
  - Budget/funding goal
  - Project type
  - Progress percentage
  - Deadline
  - Action buttons (Make Deal, Invest, Support, Collaborate) - conditionally shown based on project settings

### Navigation Links:
- **"Home" Button** → `https://www.covionpartners.com/`
- **"Back to Dashboard" Button** (if logged in) → `https://www.covionpartners.com/dashboard`
- **Project Card Click** → `https://www.covionpartners.com/publicprojects/{projectId}`
- **Owner Avatar Click** → `https://www.covionpartners.com/profile/{ownerId}`
- **Settings Icon** (owner only) → `https://www.covionpartners.com/projects/{projectId}` (private project settings)
- **Eye Icon** (owner only) → `https://www.covionpartners.com/publicsettings?project={projectId}` (opens in new tab)
- **Globe Icon** (owner only) → `https://www.covionpartners.com/publicprojects/{projectId}` (opens in new tab)
- **"Make Deal" Button** (if enabled) → `https://www.covionpartners.com/makedeal?project={projectId}`
- **"Invest" Button** (if enabled) → `https://www.covionpartners.com/invest?project={projectId}`
- **"Support" Button** (if accepts_support enabled) → `https://www.covionpartners.com/purchase2support/{projectId}`
- **"Collaborate" Button** (if enabled) → `https://www.covionpartners.com/collaborations/{projectId}`
- **File Download Buttons** → Opens file URL in new tab
- **External Link Buttons** → Opens external URL in new tab

### Owner-Only Features:
- Settings icon to access private project settings
- Eye icon to view public settings
- Globe icon to view public project page
- Support project funding progress display (if accepts_support is enabled)

---

## 2. Public Project Detail Page (`/publicprojects/{projectId}`)

**URL:** `https://www.covionpartners.com/publicprojects/{projectId}` (e.g., `https://www.covionpartners.com/publicprojects/f1a478a3-8802-4a02-942f-ed5983d60b70`)

**Purpose:** Provides a detailed view of a single public project with media, resources, open positions, and action buttons.

### Features:
- **Media Gallery**: 
  - Main image/video display with view mode toggle (cover/contain)
  - Thumbnail grid for all media files
  - File download buttons for documents
  - External links section
- **Project Description**: Full project description text
- **Project Resources**: 
  - Toggle switch (owner only) to enable/disable public resource visibility
  - List of downloadable resources
  - Upload button (owner only) to add new resources
- **Project Overview Card**: 
  - Created date
  - Deadline
  - Progress bar
  - Budget
  - Project type
- **Support Project Card** (if accepts_support enabled):
  - Funding progress bar
  - Current funding vs. goal
  - Donation amount input
  - "Support" button → `https://www.covionpartners.com/purchase2support/{projectId}`
- **Make Deal Card** (if show_make_deal enabled):
  - "Make Deal" button → `https://www.covionpartners.com/makedeal?project={projectId}`
- **Open Positions Card** (if public_open_positions_enabled):
  - Toggle switch (owner only) to enable/disable public open positions visibility
  - List of open roles with:
    - Role name and description
    - Compensation information
    - Positions needed count
    - "Apply for Role" button → `https://www.covionpartners.com/publicprojects/{projectId}/apply?role={roleId}&roleName={encodedRoleName}`
  - "Manage Open Positions" button (owner only) → `https://www.covionpartners.com/projects/{projectId}/roles`
- **Actions Card** (if actions_enabled):
  - Toggle switch (owner only) to enable/disable actions card visibility
  - "Make Deal" button (if show_make_deal) → `https://www.covionpartners.com/makedeal?project={projectId}`
  - "Invest" button → `https://www.covionpartners.com/invest?project={projectId}`
  - "Collab" button → `https://www.covionpartners.com/collab?project={projectId}`
  - "Join Project" button (opens dialog to enter project key)
  - QR Code display with download option

### Navigation Links:
- **"Back to Public Projects" Button** → `https://www.covionpartners.com/publicprojects`
- **"Support" Button** → `https://www.covionpartners.com/purchase2support/{projectId}`
- **"Make Deal" Button** → `https://www.covionpartners.com/makedeal?project={projectId}`
- **"Invest" Button** → `https://www.covionpartners.com/invest?project={projectId}`
- **"Collab" Button** → `https://www.covionpartners.com/collab?project={projectId}`
- **"Apply for Role" Button** → `https://www.covionpartners.com/publicprojects/{projectId}/apply?role={roleId}&roleName={encodedRoleName}`
- **"Manage Open Positions" Button** (owner only) → `https://www.covionpartners.com/projects/{projectId}/roles`
- **File Download Buttons** → Downloads resource file
- **External Link Buttons** → Opens external URL in new tab
- **QR Code Download** → Downloads QR code image

### Owner-Only Features:
- Toggle switches for:
  - Public resources visibility
  - Public open positions visibility
  - Actions card visibility
- Upload new resources button
- Manage open positions button

### User Interactions:
- **Join Project**: Users can enter a project key to request to join the project
- **Apply for Role**: Users can apply for open positions (redirects to signup if not logged in)
- **Support Project**: Users can enter a donation amount and proceed to payment

---

## 3. Purchase to Support Page (`/purchase2support/{projectId}`)

**URL:** `https://www.covionpartners.com/purchase2support/{projectId}` (e.g., `https://www.covionpartners.com/purchase2support/f1a478a3-8802-4a02-942f-ed5983d60b70`)

**Purpose:** Allows users to purchase tokens to support a project through a multi-step process with Stripe payment integration.

### Features:
- **3-Step Process**:
  1. **Step 1: Select a Token** - Choose from available tokens for the project
  2. **Step 2: Select a Price** - Choose from preset amounts ($10, $25, $50, $100, $250, $500) or enter custom amount
  3. **Step 3: Review & Payment** - Review summary and complete payment with Stripe

### Step 1: Select Token
- Grid display of available tokens with visual preview
- Token serial numbers (partially masked for privacy)
- Click to select a token and proceed to Step 2

### Step 2: Select Price
- Preset amount buttons ($10, $25, $50, $100, $250, $500)
- Custom amount input field
- "Back" button to return to Step 1
- "Next" button to proceed to Step 3

### Step 3: Review & Payment
- **Review Section**:
  - Selected token preview with serial number
  - Certificate preview
  - Summary showing:
    - Selected price
    - Stripe fee (2.9% + $0.30)
    - Platform fee (2%)
    - Net amount project receives
- **Payment Section**:
  - Stripe Payment Element for secure card input
  - "Complete Purchase" button
  - After successful payment:
    - Success message
    - Token download button
    - Certificate download button
    - "View All My Tokens" button → `https://www.covionpartners.com/mytokens`

### Navigation Links:
- **"Back" Button** → Returns to previous page or `/purchase2support` if no history
- **"View All My Tokens" Button** (after payment) → `https://www.covionpartners.com/mytokens`
- **Token Download** → Downloads token image as PNG
- **Certificate Download** → Downloads certificate image as PNG

### Payment Flow:
1. User selects token and amount
2. System creates Stripe Payment Intent via `/api/purchase2support/create-payment-intent`
3. User enters payment details via Stripe Elements
4. Payment is processed
5. On success, token and certificate are generated and stored
6. User can download token and certificate images
7. Redirect to success page: `/purchase2support/success?project_id={projectId}`

### Token Display:
- Tokens show serial numbers (partially masked: `***123`)
- Visual design with gradient background and handshake logo
- Certificate shows certificate number and supporter name

---

## 4. Public Settings Page (`/publicsettings?project={projectId}`)

**URL:** `https://www.covionpartners.com/publicsettings?project={projectId}` (e.g., `https://www.covionpartners.com/publicsettings?project=f1a478a3-8802-4a02-942f-ed5983d60b70`)

**Purpose:** Allows project owners to manage public visibility settings and feature toggles for their projects.

### Features:
- **Project Selection Dropdown**: Select which project to manage (if no project ID in URL)
- **Project Visibility Settings Card**:
  - Toggle between public and private visibility
  - Current status display
  - "Make Public" / "Make Private" button
- **Support Project Settings Card**:
  - Enable/disable support project feature
  - Current status display
  - Funding progress display (if enabled):
    - Current funding vs. goal
    - Progress bar
    - Percentage funded
  - "Enable Support Project" / "Disable Support Project" button
- **Show Make Deal Button Settings Card**:
  - Toggle visibility of "Make Deal" button on public project cards
  - Current status display
  - "Show Make Deal" / "Hide Make Deal" button
- **Show Invest Button Settings Card**:
  - Toggle visibility of "Invest" button on public project cards
  - Current status display
  - "Show Invest" / "Hide Invest" button
- **Show Collaborate Button Settings Card**:
  - Toggle visibility of "Collaborate" button on public project cards
  - Current status display
  - "Show Collaborate" / "Hide Collaborate" button

### Navigation Links:
- **"Back" Button** → Returns to previous page (router.back())
- **Project Selection Dropdown** → Updates URL with selected project ID

### Settings Explained:
- **Project Visibility**: Controls whether the project appears on `/publicprojects` listing page
- **Support Project**: Enables/disables the ability for users to purchase tokens to support the project
- **Show Make Deal Button**: Controls whether the "Make Deal" button appears on public project cards and detail pages
- **Show Invest Button**: Controls whether the "Invest" button appears on public project cards and detail pages
- **Show Collaborate Button**: Controls whether the "Collaborate" button appears on public project cards and detail pages

### Access Control:
- Requires user to be logged in
- Only project owners can modify settings
- If not logged in, shows "Access Denied" card with login button → `https://www.covionpartners.com/login`

### Real-time Updates:
- All toggles update the project in real-time via Supabase
- Success/error toast notifications for each action
- Loading states during updates

---

## Key Relationships Between Pages:

1. **Public Projects List** → **Public Project Detail**: Clicking a project card navigates to its detail page
2. **Public Project Detail** → **Purchase to Support**: Clicking "Support" button navigates to purchase page
3. **Public Projects List/Detail** → **Public Settings**: Owners can access settings via eye icon or direct URL
4. **Purchase to Support** → **My Tokens**: After successful payment, users can view all their tokens

## Common Features Across Pages:

- **Status Badges**: Color-coded project status indicators (Active, Pending, Completed, On Hold)
- **Loading States**: Loading spinners during data fetching
- **Error Handling**: Error messages displayed when operations fail
- **Responsive Design**: Mobile-friendly layouts with adaptive grids
- **Owner-Only Features**: Many features are only visible/editable by project owners
- **Authentication Checks**: Pages check for user authentication and redirect if needed

