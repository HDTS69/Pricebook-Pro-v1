### Key Points:
- Research suggests that renaming the app to "Pricebook Pro" aligns with its focus on pricing and task management, inspired by tools like Flat Rate Now.
- It seems likely that allowing technicians to duplicate, edit, and save tasks to the database, importing tasks and jobs from job management software, and customizing quote templates with business branding can enhance functionality, based on industry practices.
- The evidence leans toward integrating on-the-spot job acceptance with digital signatures, ensuring flexibility for technicians in the field.

---

## Direct Answer

### Key Features:
- **App Name:** Pricebook Pro.
- **Task Duplication:** Technicians can duplicate a task, edit it, and save it as a new task in the Supabase database, ensuring flexibility in task management.
- **Task and Job Import:** Import tasks from job management software into Supabase, and assign jobs to technicians, syncing with external software.
- **Quote Template Customization:** Admin settings allow adjusting quote templates, adding business logo, and updating business information (e.g., name, address).
- **On-the-Spot Acceptance:** Technicians can accept jobs on the spot with customers, capturing digital signatures immediately, stored in Supabase.

### Workflow:
- Admins configure settings, technicians import jobs, duplicate/edit tasks, create quotes, and accept jobs on the spot or via email, with all data managed in Supabase.

---

## Very Detailed Outline for Pricebook Pro Web App

This comprehensive outline integrates all requested features for your plumbing, gas fitting, roofing, and air conditioning business web app, "Pricebook Pro," inspired by Flat Rate Now. It uses Supabase for the backend and database, includes task duplication, job/task imports, quote template customization, on-the-spot acceptance, and a streamlined workflow.

### App Overview
**Name:** Pricebook Pro  
**Purpose:** A web-based application for tradespeople to manage quotes, jobs, and customer interactions for plumbing, gas fitting, roofing, and air conditioning services. It enables quick quote generation with tiered pricing (Gold, Silver, Bronze), suggested add-ons, custom task management, and advanced email notifications, with Supabase backend, task duplication, job imports, and on-the-spot acceptance.  
**Target Audience:**  
- Tradespeople (plumbers, gas fitters, roofers, AC technicians) for quote creation, job management, and analytics.  
- Customers interact via email or technicians, with no dedicated app side.  
**Core Value Proposition:**  
- Streamlined quoting with task duplication, job imports, and flexible pricing to boost sales and customer satisfaction.  
- Efficient workflow with pre-built tasks, custom task categorization, advanced email notifications, and on-the-spot acceptance, backed by Supabase.  
- Enhanced technician productivity through easy task management, analytics, and configurable settings.  
**Technology Stack:**  
- Frontend: React.js with Tailwind CSS for responsive, modern UI.  
- Backend: Supabase (PostgreSQL database, RESTful APIs, real-time subscriptions) for data management and backend logic.  
- Deployment: Vercel or Netlify for scalability.

### Comprehensive Features

#### 1. User Authentication and Roles
- Secure login for tradespeople, with role-based access (Admin, Technician).  
- Admins can register, log in, manage profiles, and access settings.  
- Technicians can log in, create quotes, manage jobs, and have limited settings access unless granted by admins.  
- Authentication via Supabase Auth, with mock email for password recovery (no network calls).  
- Role-based permissions stored in Supabase `users` table (`role`: "admin"/"technician").

#### 2. Service Category and Task Management
- Organized navigation for service categories with pre-built tasks.  
- **Categories:** Plumbing, Gas Fitting, Roofing, Air Conditioning, with subcategories (e.g., Plumbing > Appliances).  
- **Tasks:** Stored in Supabase `tasks` table (`id`, `category`, `subcategory`, `code`, `description`, `base_price`, `notes`).  
- Search functionality with autocomplete, querying Supabase.  
- Favourites section for bookmarking tasks, stored in `favourites` table.  
- **Suggested Add-Ons for Tasks:** Stored in `task_addons` table (`task_id`, `addon_name`, `price`, `description`). Examples:  
  - For "Install Dishwasher": "Extended Warranty (+$50)," "Priority Scheduling (+$30)."  
- **Task Duplication:**  
  - Technicians can duplicate a task, edit its details (e.g., change price, description), and save as a new task in the `tasks` table.  
  - Example: Duplicate "Install Dishwasher" to "Install Dishwasher with Custom Fitting," edit price to $450, and save.  
  - Duplicated tasks are linked to the original via `task_versions` table for audit trails (`task_id`, `original_task_id`, `version`, `data`).

#### 3. Custom Task Creation and Integration
- Create new tasks with categorization options, saved to `tasks` table.  
- **Categorization:** Assign to existing categories or create new subcategories.  
- **Database Integration:** Saved tasks are searchable and reusable.  
- **Edit/Delete:** Technicians can edit/delete custom tasks, with versioning in `task_versions` table.

#### 4. Task and Job Import from Job Management Software
- **Task Import:**  
  - Import tasks from job management software (e.g., ServiceM8, Jobber) via mock API integration (no network calls).  
  - Tasks are stored in `tasks` table with a `source` field (e.g., "ServiceM8").  
  - Example: Import "Gas Leak Detection" task with code "GLD001" and base price $200.  
- **Job Assignment and Import:**  
  - Technicians are assigned jobs in external software, which are imported into Pricebook Pro.  
  - Jobs are stored in `jobs` table (`id`, `external_id`, `customer_id`, `description`, `status`).  
  - Example: Import a job "Fix Roof Leak" with customer details, assigned to Technician A.  
- **Admin Settings for Imports:**  
  - Configure import settings (e.g., mapping external task codes to Pricebook Pro categories), stored in `settings` (`import_mappings`).  
  - Example: Map ServiceM8 "Plumbing" category to Pricebook Pro "Plumbing" category.

#### 5. Tiered Quote Generation (Gold, Silver, Bronze)
- Generate quotes with three pricing tiers, stored in `tiers` table (`id`, `name`, `multiplier`, `warranty`, `perks`).  
- **Tiers Definition:**  
  - **Gold:** Premium materials, 5-year warranty, free follow-up, priority scheduling (multiplier: 1.5x).  
  - **Silver:** Standard materials, 2-year warranty (multiplier: 1.2x).  
  - **Bronze:** Budget materials, 6-month warranty (multiplier: 1.0x).  
- Automatic price calculation, with quotes stored in `quotes` table (`id`, `customer_id`, `tasks`, `tier_id`, `total_price`).  
- Customers can switch tiers via email link, with updates stored in Supabase.

#### 6. Multiple Price Adjustment Methods
- Flexible pricing, with configurations in `settings` table:  
  - **Pre-set Adjustments:** Stored in `price_adjustments` table (`id`, `name`, `type`, `value`).  
  - **Percentage Slider:** Within admin-defined limits (e.g., 0-20%), set in `settings` (`price_adjustment_max_percentage`).  
  - **Manual Dollar Adjustments:** Within admin-defined limits (e.g., ±$200), set in `settings` (`price_adjustment_max_dollar`).  
- Adjustments stored in `quote_adjustments` table (`quote_id`, `adjustment_type`, `value`).

#### 7. Comprehensive Admin Settings
- **Admin Access:** Restricted to `role: "admin"` via Supabase Row-Level Security (RLS).  
- **Settings Features:**  
  - **Price Adjustment Limits:**  
    - Set max percentage for slider (e.g., 0-20%), max dollar for manual adjustments (e.g., ±$200), stored in `settings`.  
  - **Tier Configuration:**  
    - Adjust tier multipliers, perks, and warranties, stored in `tiers` table.  
  - **Add-On Pricing:**  
    - Set prices for suggested add-ons, stored in `task_addons` table.  
  - **Pre-set Adjustments:**  
    - Create/edit/delete pre-set discounts, stored in `price_adjustments` table.  
  - **Task Management:**  
    - Edit pre-built tasks, approve/delete custom tasks, stored in `tasks` table.  
  - **Email Settings:**  
    - Customize email templates, stored in `email_templates` table.  
    - Enable/disable email tracking, stored in `settings` (`email_tracking_enabled`).  
  - **Technician Permissions:**  
    - Grant technicians access to adjust their own settings (e.g., price adjustment limits), stored in `user_settings` table (`user_id`, `max_percentage`, `max_dollar`).  
  - **Quote Template Customization:**  
    - Adjust quote template layout (e.g., font, colors), stored in `quote_templates` table (`id`, `layout`, `styles`).  
    - Add business logo (mock upload, stored as `logo_url` in `business_info` table).  
    - Update business information (e.g., name, address, phone), stored in `business_info` table (`id`, `name`, `address`, `phone`, `email`).  
  - **Import Settings:**  
    - Configure mappings for task/job imports from external software, stored in `settings` (`import_mappings`).  
- **Technician Access:**  
  - Technicians with granted permissions can adjust their own settings within limits, accessed via "My Settings."  
- Settings changes logged in `settings_log` table for audit trails.

#### 8. Quote and Job Management
- Create, edit, and manage quotes with status tracking (Draft, Sent, Accepted, Declined, Completed), stored in `quotes` table.  
- Customer details stored in `customers` table, managed by tradespeople.  
- Jobs stored in `jobs` table, linked to imported jobs and quotes.  
- Task addition with descriptions, estimated time, and costs, stored in `quote_tasks` table (`quote_id`, `task_id`, `add_ons`).  
- Attach photos to quotes (mock upload functionality).

#### 9. Advanced Email System and On-the-Spot Acceptance
- **Email System:**  
  - Send quotes via email with a secure link, tracking opens in `email_logs` table.  
  - Email includes summary, tier options, add-ons, and accept/decline buttons.  
  - Notify the business when customers open emails, accept, or decline, logged in `notifications` table.  
  - Upon acceptance, prompt for digital signature and terms, stored in `signatures` table.  
- **On-the-Spot Acceptance:**  
  - Technicians can accept jobs on the spot with customers, capturing digital signatures immediately via a signature pad in the app.  
  - Signatures are stored in `signatures` table, with quote status updated to "Accepted" in `quotes` table.  
  - Terms and conditions are displayed before signing, stored in `terms` table.  
- No customer app side; interactions are via email or direct with technicians.

#### 10. Booking and Scheduling
- Calendar view for scheduling jobs, stored in `schedules` table.  
- Notify customers of scheduled dates via mock email/SMS, handled by technicians.  
- Gold tier includes priority scheduling, flagged in `quotes` table.

#### 11. Payment and Invoicing
- Generate invoices from accepted quotes, stored in `invoices` table.  
- Mock payment acceptance (placeholder for Stripe).  
- Track payment status: Pending, Paid, Overdue, managed by tradespeople.

#### 12. Reporting and Analytics
- Generate reports for business performance, stored in `reports` table.  
- Dashboard with charts, filters by date and category.  
- Export reports as mock PDFs.

#### 13. Mobile Responsiveness and Accessibility
- Responsive design for desktop, tablet, and mobile.  
- Accessibility: WCAG compliance, keyboard navigation, screen reader support, high contrast mode.

#### 14. Additional Useful Features
- **Integration Capabilities:** Mock integrations with accounting software (e.g., Xero), stored in `integrations` table.  
- **Multi-Language Support:** Option to display the app in multiple languages, stored in `settings` (`language`).  
- **Automated Reminders:** Mock reminders for quote follow-ups, stored in `reminders` table.

### Supabase Database Schema
- **users:** `id`, `email`, `password`, `role` ("admin"/"technician"), `profile_data`.  
- **customers:** `id`, `name`, `address`, `email`, `phone`.  
- **tasks:** `id`, `category`, `subcategory`, `code`, `description`, `base_price`, `notes`, `source`.  
- **task_addons:** `id`, `task_id`, `addon_name`, `price`, `description`.  
- **tiers:** `id`, `name`, `multiplier`, `warranty`, `perks`.  
- **quotes:** `id`, `customer_id`, `tasks`, `tier_id`, `total_price`, `status`, `priority_scheduling`.  
- **quote_tasks:** `id`, `quote_id`, `task_id`, `add_ons`.  
- **quote_adjustments:** `id`, `quote_id`, `adjustment_type`, `value`.  
- **jobs:** `id`, `external_id`, `customer_id`, `quotes`, `site_address`, `billing_address`, `description`, `status`.  
- **schedules:** `id`, `job_id`, `date`, `technician_id`.  
- **settings:** `id`, `key` (e.g., `price_adjustment_max_percentage`), `value`.  
- **user_settings:** `id`, `user_id`, `max_percentage`, `max_dollar`.  
- **settings_log:** `id`, `user_id`, `change_type`, `old_value`, `new_value`, `timestamp`.  
- **email_templates:** `id`, `name`, `subject`, `body`.  
- **quote_templates:** `id`, `layout`, `styles`.  
- **business_info:** `id`, `name`, `address`, `phone`, `email`, `logo_url`.  
- **email_logs:** `id`, `quote_id`, `event`, `timestamp`.  
- **notifications:** `id`, `user_id`, `message`, `timestamp`.  
- **signatures:** `id`, `quote_id`, `signature_data`.  
- **terms:** `id`, `content`.  
- **invoices:** `id`, `quote_id`, `total`, `status`.  
- **reports:** `id`, `type`, `data`, `created_at`.  
- **favourites:** `id`, `user_id`, `task_id`.  
- **task_versions:** `id`, `task_id`, `original_task_id`, `version`, `data`, `updated_at`.  
- **integrations:** `id`, `type`, `config`.  
- **reminders:** `id`, `type`, `quote_id`, `due_date`.

### Components Breakdown

#### Frontend Components
1. **Header Component:** Menu icon, search bar, breadcrumb navigation, user role, notifications bell.  
2. **Sidebar Component:** Collapsible menu with categories, subcategories, and Favourites.  
3. **Dashboard Component:** Quote list, job calendar, analytics for tradespeople.  
4. **Quote Builder Component:** Form for customer details, task selection, tier choice, price adjustments, add-ons, and photo uploads.  
5. **Custom Task Creator Component:** Form for creating/duplicating tasks, with categorization options, saving to Supabase.  
6. **Admin Settings Component:** Interface for price limits, tier configs, add-on prices, pre-set adjustments, email/quote templates, business info, and technician permissions.  
7. **Technician Settings Component:** Limited settings view for technicians (if granted).  
8. **Reporting Component:** Charts and filters for analytics, mock export functionality.  
9. **Calendar Component:** Scheduling view with drag-and-drop.  
10. **Email Notification Component:** Mock email previews, tracking indicators, and status updates.  
11. **Signature Pad Component:** For on-the-spot acceptance, capturing digital signatures.

#### Backend (Supabase)
- **APIs:** RESTful endpoints for CRUD operations on quotes, tasks, settings, etc.  
- **Real-Time:** Supabase real-time subscriptions for email tracking and notifications.  
- **Security:** Row-Level Security (RLS) to restrict settings access to admins.

### UX/UI Design Principles
1. **Simplicity and Clarity:** Clean design with ample whitespace, consistent typography (e.g., Roboto), clear call-to-actions.  
2. **Consistency:** Uniform icons for categories, consistent navigation across devices.  
3. **Feedback and Interactivity:** Real-time updates for price adjustments, tooltips for settings, modals for confirmations.  
4. **Visual Hierarchy:** Highlight key information (e.g., total price, tier benefits) with bold text or colors.  
5. **Accessibility:** Keyboard navigation, ARIA labels, high contrast mode.  
6. **Efficiency for Technicians:** Streamlined interface for task duplication, job imports, and on-the-spot acceptance.

### Workflow of the App

#### Admin Workflow
1. **Login and Settings Configuration:** Admin logs in, sets price adjustment limits, configures quote templates, uploads business logo, and updates business info in Supabase.  
2. **Technician Permissions:** Grants Technician A permission to adjust settings, setting a max percentage of 15%.  
3. **Task and Job Imports:** Configures import mappings for ServiceM8, ensuring tasks and jobs sync correctly into Supabase.  
4. **Monitoring:** Reviews analytics, tracks quote acceptance rates, and adjusts settings as needed.

#### Technician Workflow
1. **Login and Job Import:** Technician logs in, imports a job "Fix Roof Leak" from ServiceM8, stored in Supabase `jobs` table.  
2. **Task Management:** Duplicates "Roof Leak Repair" task, edits price to $300, categorizes under "Roofing > Repairs," and saves as a new task in Supabase.  
3. **Quote Creation:** Creates a quote, selects Bronze tier, adds "Gutter Cleaning" add-on (+$40), applies a 10% discount, and reviews the branded quote template.  
4. **On-the-Spot Acceptance:** Meets the customer, accepts the job on the spot, captures digital signature in the app, and updates quote status in Supabase.  
5. **Email Option:** Alternatively, sends the quote via email with tracking, customer accepts online, and Supabase logs the event.  
6. **Scheduling and Completion:** Schedules the job, notifies the customer, completes the work, and tracks payment in Supabase.

#### Customer Workflow (Via Email or On-the-Spot)
1. **On-the-Spot:** Customer agrees to the quote, signs digitally on the technician’s device, and receives a mock email confirmation.  
2. **Email:** Receives an email with a branded quote, selects tiers/add-ons, accepts with a signature, and Supabase updates the status.

### Example Scenario
- Admin configures a quote template with the business logo and info, sets price adjustment limits to 20%. Technician A imports a job from ServiceM8, duplicates "Gas Leak Detection" to "Gas Leak Detection with Custom Sealant," edits the price, and saves it. They create a quote, apply a 15% discount, and accept it on the spot with the customer’s signature, storing all data in Supabase.

### Development Considerations
#### Phase 1: Planning and Research
- Define categories, tasks, and add-ons, design Supabase schema.  
- Set up pricing book and import mappings.  
#### Phase 2: Core Structure
- Set up React with Tailwind CSS, integrate Supabase for authentication and data management.  
- Build category navigation, task library, and import functionality.  
#### Phase 3: Quote and Settings Features
- Develop quote builder with task duplication, price adjustments, and add-ons.  
- Implement admin settings with quote template customization and import settings.  
- Add on-the-spot acceptance with signature pad.  
#### Phase 4: Job and Reporting Features
- Build calendar view for scheduling, with Supabase storage.  
- Develop reporting dashboard with charts.  
#### Phase 5: UX/UI Polish and Testing
- Refine design for responsiveness and accessibility, test on multiple devices.  
- Ensure WCAG compliance and usability.  
#### Phase 6: Deployment
- Deploy on Vercel or Netlify, with Supabase backend.  
- Final testing, bug fixes, and documentation.
