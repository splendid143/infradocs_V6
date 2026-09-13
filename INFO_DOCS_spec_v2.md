Build a production-ready responsive web application called INFO DOCS.

**Change from v1 of this spec:** this version assumes **no existing
database**. A brand-new Supabase project is created from scratch as part of
this build, with schema delivered as version-controlled SQL migrations
(never created by hand through the Supabase dashboard).

**INFO DOCS is a standalone, web-native application.** It is built,
deployed, and operated independently. It does not share a Supabase project,
a schema, a codebase, or any other component with any other application —
mobile or otherwise. Any references to a separate mobile client in the
original v1 spec are removed below; nothing here should be designed around
being consumed by a second client.

1. PURPOSE

INFO DOCS is a professional infrastructure documentation and information management system for physical network infrastructure in data centers, server rooms, telecom rooms, and technical facilities.

It is the organization's single source of truth for:

Sites
Rooms
Racks
Equipment
Equipment ports
Patch panels
Patch panel ports
Physical cables
Cable endpoints
Photos
Documents
Notes
QR codes
Status
Audit history
Users
Access permissions

This is NOT a project management application.

The primary purpose is:

Know what infrastructure exists, where it is, how it is connected, who changed it, and what documentation belongs to it.

The system must be designed with security, role-based access, approval workflow, auditability, data integrity, and portability from the beginning.

2. TECHNOLOGY

Use:

Frontend:

React
TypeScript
Vite
React Router
Tailwind CSS
TanStack Query
React Hook Form
Zod
Lucide icons

Authentication:

Supabase Auth

Database:

**A new Supabase PostgreSQL project, created for this application.**
Schema is defined entirely through version-controlled SQL migrations under
`supabase/migrations/`, applied via the Supabase CLI (`supabase db push` or
`supabase migration up`) — never edited directly in the dashboard's table
editor, so the schema stays reproducible and auditable.

Storage:

Supabase Storage (buckets created by migration/setup script, not manually)

Backend-ready architecture:

Keep API/data-access logic isolated so FastAPI can be introduced later.
Do not put database logic throughout UI components.

The application must work on:

Desktop
Laptop
Tablet
Mobile browser (responsive web — not a native or Flutter app)

This is a web-native application only. There is no companion mobile app,
and the Supabase project created for INFO DOCS is not shared with, or
designed around, any other client.

3. SECURITY PRINCIPLE

Security must NOT depend on frontend UI visibility.

Never assume:

"Button is hidden = user cannot perform the action."

Authorization must be enforced by:

Supabase Auth
User profile/role
PostgreSQL Row Level Security
Server-side validation for privileged operations
Storage access policies

The frontend should provide a good user experience, but the database/backend must remain the final security boundary.

Never expose:

Supabase service_role key
Database passwords
Private storage credentials
Server secrets

in browser code.

Only use the public/publishable Supabase key in the frontend.

**The service_role key is used exactly once**, in the Supabase project setup
step (creating the first ADMIN account and seeding reference data via a
one-off script run outside the browser, e.g. locally with the Supabase CLI
or a short-lived Node script). It must never be committed, never shipped in
any client bundle, and never referenced from `src/`.

4. AUTHENTICATION FLOW

Use Supabase Auth.

Do NOT build custom password authentication.

Supported authentication:

Email
Password
Password reset
Email verification where configured
Logout
Session persistence
Session expiration handling

Authentication flow:

User opens application
        ↓
Check Supabase session
        ↓
No session?
        ↓
Login / Signup
        ↓
Supabase Auth
        ↓
Authentication successful
        ↓
Load public.users profile
        ↓
Check account status
        ↓
Check approval status
        ↓
Check role
        ↓
Create authorized application session
        ↓
Open Dashboard

If there is no valid session:

DO NOT query protected infrastructure data.
Redirect to /login.

5. USER SIGNUP FLOW

Provide a Signup page.

Fields:

Full name
Email
Password
Confirm password
Optional company/department
Accept terms checkbox

Validate:

Required fields
Valid email
Password strength
Password confirmation
Duplicate email handling

Signup must NOT automatically grant infrastructure access.

New users must enter an approval workflow.

Use the following lifecycle:

SIGNUP
  ↓
AUTHENTICATED
  ↓
PENDING APPROVAL
  ↓
ADMIN REVIEW
  ↓
APPROVED
  ↓
ROLE ASSIGNED
  ↓
ACCESS ENABLED

If rejected:

PENDING
   ↓
REJECTED
   ↓
NO INFRASTRUCTURE ACCESS

If disabled later:

ACTIVE
   ↓
DISABLED
   ↓
NO ACCESS

A newly registered user must receive the minimum privilege by default.

Do not automatically create an ADMIN or ENGINEER.

**Bootstrap exception:** since this is a brand-new Supabase project, there is
no ADMIN yet to approve the first user. Handle this with a one-time setup
script (run with the service_role key, outside the browser — see section 3)
that creates exactly one ADMIN account directly in `public.users` with
`approval_status = 'APPROVED'`. Every account created afterward, including
through the app's own signup form, follows the normal PENDING → ADMIN
REVIEW flow with no exceptions.

6. USER ACCOUNT MODEL

Use Supabase Auth for identity.

Use public.users for application profile and authorization information.

The public.users record should contain fields such as:

id
user_code
name
email
role
account_status
approval_status
is_active
department
created_at
approved_at
approved_by
disabled_at
disabled_by
last_login_at

Do NOT store passwords in public.users.

Use the Auth user's UUID as the primary identity.

7. ACCOUNT STATUS

Define clear states:

PENDING
APPROVED
REJECTED
DISABLED

Access rules:

PENDING:

Can authenticate if desired
Cannot access infrastructure data
Show "Awaiting administrator approval"

REJECTED:

Cannot access infrastructure

DISABLED:

Cannot access infrastructure

APPROVED:

Access determined by assigned role

Only an ADMIN can approve, reject, disable, reactivate, or change roles.

8. ROLES

Initial roles:

ADMIN

Full administrative access.

Can:

View all infrastructure
Create records
Edit records
Delete records where allowed
Archive records
Manage users
Approve users
Reject users
Disable users
Reactivate users
Change user roles
Upload/delete documents
View audit history
Generate reports
Manage system configuration

ENGINEER

Infrastructure management access.

Can:

View infrastructure
Create infrastructure
Edit infrastructure
Add/update cables
Add/edit equipment
Add/edit racks
Add/edit patch panels
Add notes
Upload photos/documents
Update operational status
Generate permitted reports
Scan/view QR records
Search infrastructure

Cannot:

Approve users
Change user roles
Manage administrators
Delete users
Modify authorization settings

VIEWER

Read-only access.

Can:

View infrastructure
Search
Scan QR
View photos/documents
View notes
View permitted reports

Cannot:

Create infrastructure
Edit infrastructure
Change status
Upload files
Delete records
Manage users

9. ADMIN PORTAL

Create a dedicated:

/admin

area.

Only ADMIN users may access it.

Pages:

/admin
/admin/users
/admin/users/pending
/admin/users/active
/admin/users/disabled
/admin/audit
/admin/settings

Pending Users

Display:

Name
Email
Department
Signup date
Requested access
Current status

Actions:

Approve
Reject
View details

When approving:

Show role selection:

ENGINEER
VIEWER

ADMIN assignment should require an additional confirmation.

Do not silently create administrators.

10. USER MANAGEMENT

Admin user page should show:

Name
Email
User Code
Role
Approval Status
Account Status
Created
Approved By
Approved Date
Last Login

Actions:

Approve
Reject
Disable
Reactivate
Change role
View activity
View audit history

For dangerous operations use confirmation dialogs.

Example:

Disable this user? They will immediately lose access to INFO DOCS.

Role change should require confirmation.

11. AUTHORIZATION FLOW

Every protected page must pass:

Has valid Supabase session?
        ↓
YES
        ↓
Load public.users
        ↓
Is account APPROVED?
        ↓
YES
        ↓
Is account ACTIVE?
        ↓
YES
        ↓
Check role
        ↓
Allow page/action

Otherwise deny access.

Implement reusable:

AuthGuard
RoleGuard
PermissionGuard

Example conceptual permissions:

infrastructure.read
infrastructure.create
infrastructure.update
infrastructure.delete
files.upload
files.delete
reports.view
users.manage
users.approve
users.roles
audit.view

Use permissions internally even though the initial roles are fixed.

This makes future custom roles possible.

12. DATABASE

**Create a new Supabase project for this application.** There is no
pre-existing database to connect to — the schema below is created from
scratch, entirely through migration files (`supabase/migrations/*.sql`), so
the exact same schema can be re-applied to any environment (local dev,
staging, production) with `supabase db push`.

Do NOT create the schema by hand in the Supabase dashboard's table editor.
This Supabase project belongs to INFO DOCS alone — do not design any table,
policy, or bucket to be consumed by another application or client.

Entities to create via migration:

users
sites
rooms
racks
equipment
equipment_ports
patch_panels
patch_ports
cables
cable_endpoints
attachments
notes
status_history
qr_codes

Use foreign keys and constraints.

Do not allow orphaned records.

Respect:

Site
 ↓
Room
 ↓
Rack
 ↓
Equipment / Patch Panel
 ↓
Ports
 ↓
Cable Endpoints
 ↓
Cable

13. INFRASTRUCTURE DATA VALIDATION

Do not rely only on frontend validation.

Validate important rules at database/backend level.

Examples:

A cable must have:

valid cable ID
cable type
specification
valid endpoints
valid status

Endpoints must refer to existing:

equipment ports OR
patch panel ports

A cable must support:

Equipment Port ↔ Equipment Port
Equipment Port ↔ Patch Port
Patch Port ↔ Equipment Port
Patch Port ↔ Patch Port

Do NOT assume:

every rack has a patch panel
every cable uses a patch panel
every rack has the same equipment
port numbering is always 1-48

14. DATA INTEGRITY

Prevent invalid connections.

Examples:

Cannot connect to a nonexistent port.
Cannot select a disabled port unless explicitly permitted.
Cannot create duplicate cable IDs.
Cannot create invalid endpoint references.
Do not allow an endpoint to have conflicting active connections unless the data model explicitly permits it.
Do not delete parent records that would leave orphaned children.

Display clear validation errors.

15. DELETE STRATEGY

The application must support deletion, but deletion must be controlled.

There are two categories.

Soft delete / archive

Use for infrastructure records where historical information should normally be preserved.

Examples:

Cable
Equipment
Rack
Patch panel
Site
Room

Preferred action:

ARCHIVED

or

REMOVED

Historical data should remain available to authorized users.

Permanent delete

Permanent deletion should be restricted to ADMIN.

Use confirmation:

DELETE PERMANENTLY?

This action cannot be undone.

[Cancel] [Delete Permanently]

Require a stronger confirmation for important records.

Do not permanently delete records if they are referenced by historical/audit records unless the database rules explicitly permit it.

Never silently cascade-delete infrastructure history.

16. DOCUMENT AND PHOTO UPLOADS

Use Supabase Storage.

Create controlled storage buckets/folders for:

infrastructure-photos
infrastructure-documents

**Both buckets are created as part of the new project's setup migration
(section 12), private by default, with access governed by storage policies
(section 17) — not created ad hoc through the dashboard.**

Examples:

cables/CBL-F-00125/photo-001.jpg
equipment/EQ-SPINE-001/photo-001.jpg
racks/RACK-S01/photo-001.jpg
patch-panels/FPP-L01-001/photo-001.jpg

Database attachments table stores:

attachment ID
record type
record ID
file name
storage path
MIME type
size
uploaded by
uploaded timestamp
description
document type

Do not store file binary data in PostgreSQL.

17. FILE SECURITY

Validate uploads.

Allowed examples:

Images:

JPG
JPEG
PNG
WEBP

Documents:

PDF
XLSX
DOCX
TXT

Set configurable file-size limits.

Reject:

executable files
scripts
unknown dangerous file types

Use storage policies based on authenticated user and application authorization.

VIEWER:

Can view/download permitted attachments
Cannot upload

ENGINEER:

Can upload
Can view
Can delete attachments they are authorized to manage

ADMIN:

Full file management

Do not expose private storage buckets publicly.

Use authenticated access/signed URLs where appropriate.

18. PHOTO EXPERIENCE

On record pages provide:

Photos

[ + Upload Photos ]

┌────────┐ ┌────────┐ ┌────────┐
│ photo  │ │ photo  │ │ photo  │
└────────┘ └────────┘ └────────┘

Support:

multiple upload
drag/drop on desktop
camera upload on mobile browser where supported
preview
file name
uploaded by
upload date
delete
download/view

Show upload progress and errors.

19. DOCUMENT EXPERIENCE

Allow documents to be attached to:

Site
Room
Rack
Equipment
Patch Panel
Cable

Examples:

installation documents
test reports
commissioning documents
vendor documentation
diagrams
inspection reports

Show:

Documents

Test Report.pdf
Uploaded by Engineer
09-Sep-2026

[View] [Download]

20. AUDIT LOG

Create an immutable audit/history experience.

Track:

login events where appropriate
user approval
user rejection
role changes
account disable/reactivate
record creation
record update
record archive
permanent deletion
status changes
file upload
file deletion

Store:

actor
timestamp
entity type
entity ID
action
old values where appropriate
new values where appropriate

Normal users must not be able to modify audit records.

ADMIN can view audit history.

21. INFRASTRUCTURE STATUS

Use:

PLANNED
INSTALLED
TESTED
VERIFIED
ISSUE
REMOVED
ARCHIVED

Workflow:

PLANNED
   ↓
INSTALLED
   ↓
TESTED
   ↓
VERIFIED

ISSUE can occur at any relevant stage.

REMOVED/ARCHIVED should preserve historical information.

Every status change must create history.

22. DASHBOARD

Create an infrastructure-focused dashboard.

Display live counts:

Sites
Rooms
Racks
Equipment
Patch Panels
Cables
Fiber
Copper
Issues
Unverified infrastructure

Show:

Recent activity
Recently modified cables
Recent issues
Documentation gaps
Recent uploads

Do not hard-code dashboard numbers.

23. GLOBAL SEARCH

Search across:

Site ID
Site name
Room ID
Rack ID
Equipment ID
Equipment name
Patch panel ID
Cable ID
Port
Cable specification
Cable type
Length

Search result categories:

Sites
Rooms
Racks
Equipment
Patch Panels
Ports
Cables
Documents

Clicking a result opens the actual record.

24. CABLE DOCUMENTATION

Cable page is a primary feature.

Display:

Cable ID
Cable Type
Specification
Length
Quantity
Status
Endpoint A
Endpoint B
Photos
Documents
Notes
History
QR

Endpoint display:

Site
Room
Rack
Equipment / Patch Panel
Port

Example:

SPINE-SW-01
Port 48
RACK-S01
      │
      │ CBL-F-00125
      │ OM4 12C / 35m
      │
      ▼
LEAF-SW-03
Port 48
RACK-L03

Provide:

What's connected here?

from any equipment or patch-panel port.

25. QR CODES

Support QR codes for:

Sites
Racks
Equipment
Patch panels
Cables

QR payload should be a stable application reference.

Example:

https://your-domain.com/cables/CBL-F-00125

Do not embed complete technical data in QR codes.

Scanning should open the live current record.

**QR codes are tracked in their own `qr_codes` table** (entity_type,
entity_id, token, created_at) rather than only as a column on each entity —
this keeps QR resolution as one clean lookup path and makes it trivial to
regenerate or invalidate a token without touching the entity it points to.

26. REPORTS

Create reports:

Infrastructure inventory
Cable inventory
Fiber cable report
Copper cable report
Rack report
Equipment report
Patch panel report
Issue report
Status report
Documentation completeness report

Design export architecture so Excel/PDF generation can later be handled by FastAPI.

27. RESPONSIVE DESIGN

Desktop:

Sidebar | Main content

Tablet:

Collapsible sidebar | Main content

Mobile:

Top bar
Content
Bottom/slide navigation where appropriate

Tables should become cards or horizontally scrollable layouts on small screens.

Forms must be touch friendly.

28. UI DESIGN

Professional enterprise infrastructure style.

Use:

clear typography
compact information density
status badges
cards
tables
breadcrumbs
tabs
confirmation dialogs
toast notifications
loading states
empty states
error states

Avoid:

excessive animation
unnecessary gradients
gaming-style UI
oversized decorative elements

The application should feel appropriate for:

data center engineers
network engineers
infrastructure teams
IT operations
facility documentation teams

29. ERROR HANDLING

Every operation needs proper handling.

Examples:

Unauthorized:

You do not have permission to perform this action.

Pending account:

Your account is awaiting administrator approval.

Disabled account:

Your account has been disabled. Contact an administrator.

Network error:

Unable to connect to the server. Please try again.

Upload error:

File upload failed. Check the file type and size.

Database validation:

This port is already connected to another active cable.

Never show raw database errors to normal users.

Log useful technical details appropriately for administrators/developers.

30. DATA ACCESS ARCHITECTURE

Do NOT put Supabase queries directly inside every component.

Create a clean service/repository layer:

src/
  lib/
    supabase.ts

  services/
    authService.ts
    userService.ts
    siteService.ts
    roomService.ts
    rackService.ts
    equipmentService.ts
    patchPanelService.ts
    cableService.ts
    attachmentService.ts
    auditService.ts
    reportService.ts

  hooks/
    useAuth.ts
    useCurrentUser.ts
    useSites.ts
    useRacks.ts
    useCables.ts
    useAttachments.ts

This allows future migration from direct Supabase queries to FastAPI without rewriting the UI.

31. ROUTES

Implement routes similar to:

/login
/signup
/forgot-password

/dashboard

/sites
/sites/:id

/rooms
/rooms/:id

/racks
/racks/:id

/equipment
/equipment/:id

/patch-panels
/patch-panels/:id

/cables
/cables/:id
/cables/new
/cables/:id/edit

/search
/qr

/reports

/admin
/admin/users
/admin/users/pending
/admin/users/:id
/admin/audit

Protect routes according to authentication and role.

32. APPROVAL VALIDATION

Before every privileged operation, validate authorization.

For example:

Create Cable
     ↓
Authenticated?
     ↓
Approved?
     ↓
Active?
     ↓
ENGINEER or ADMIN?
     ↓
YES → continue
NO  → reject

For user approval:

Authenticated?
     ↓
Approved?
     ↓
Active?
     ↓
ADMIN?
     ↓
YES → allow
NO → reject

Do not trust a role sent from the browser.

33. CONCURRENCY AND DATA SAFETY

Handle situations where two engineers edit the same record.

Use:

updated_at
optimistic concurrency where practical
server/database validation
clear conflict messages

Example:

This cable was modified by another user. Reload the record before saving.

Do not silently overwrite important infrastructure changes.

34. PORTABILITY

Avoid vendor lock-in wherever practical.

Keep:

database schema documented
migrations version controlled
storage paths predictable
configuration environment-based
export functionality available
backend interface replaceable

Use .env for configuration.

Example:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

Never commit secrets.

**Since this is a new project, also keep a `supabase/config.toml` and the
full `supabase/migrations/` history in version control from the very first
migration** — this is what makes the project reproducible from nothing
(`supabase init` → `supabase db push`) on a teammate's machine, a staging
environment, or if the project is ever migrated off Supabase entirely.

35. PROJECT STRUCTURE

Use:

src/
  app/
  components/
  layouts/
  pages/
  features/
    auth/
    users/
    dashboard/
    sites/
    rooms/
    racks/
    equipment/
    patch-panels/
    cables/
    attachments/
    search/
    qr/
    reports/
    audit/
  services/
  hooks/
  types/
  utils/
  lib/

supabase/
  config.toml
  migrations/
  seed.sql            (reference data only — never seeded accounts with passwords)

scripts/
  bootstrap-admin.ts   (one-time, service_role, run outside the browser — section 5)

Separate UI, business logic, data access, and types.

36. DEVELOPMENT ORDER

Implement in this exact order.

Phase 0 — Supabase Project Setup *(new — did not exist in v1 of this spec)*
Create the Supabase project (dashboard or `supabase projects create`)
Capture project URL + anon key into `.env` (never commit)
`supabase init` and write the first schema migration: users, sites, rooms, racks, equipment, equipment_ports, patch_panels, patch_ports, cables, cable_endpoints, attachments, notes, status_history, qr_codes
Enable RLS on every table and write policies per role (sections 8, 11, 17)
Create `infrastructure-photos` and `infrastructure-documents` storage buckets with access policies
Run `scripts/bootstrap-admin.ts` once to create the first ADMIN account
`supabase db push` against a local/dev instance and confirm every table, policy, and bucket exists before writing any frontend code

Phase 1 — Foundation
React/Vite setup
Tailwind
Routing
Supabase client
Environment configuration
Error handling
Application layout

Phase 2 — Authentication
Login
Signup
Email verification handling
Password reset
Session persistence
Logout
AuthGuard
User profile loading
Approval-state handling
Role handling

Phase 3 — Admin security
Admin portal
Pending users
Approve
Reject
Disable
Reactivate
Role changes
Audit history

Phase 4 — Infrastructure
Dashboard
Sites
Rooms
Racks
Equipment
Equipment ports
Patch panels
Patch ports
Cables
Cable endpoints
Status/history

Phase 5 — Files
Storage buckets
Storage policies
Photo upload
Document upload
Preview/download
Delete permissions
Attachment history

Phase 6 — Discovery
Global search
QR records
QR scanning
"What's connected here?"

Phase 7 — Reporting
Reports
Excel export interface
PDF export interface
Print-ready views

37. IMPORTANT IMPLEMENTATION RULES

Do NOT:

create fake users with passwords in the database
store passwords in public.users
use service_role in browser
trust frontend roles
rely only on hidden buttons for security
make all new users administrators
automatically approve signup users
publicly expose private documents
permanently delete infrastructure without confirmation
create duplicate infrastructure tables
design any table, policy, or bucket around being shared with another
application or client
hard-code dashboard data
hard-code IDs in UI
assume every rack has a patch panel
assume every cable is fiber
assume every cable connects equipment directly
put all business logic in React components

Do:

use Supabase Auth
use PostgreSQL RLS
use role/permission checks
use approval workflow
use audit history
validate at database/backend level
use private storage
preserve infrastructure history
support controlled deletion
make the UI responsive
keep data-access code modular
make the system ready for FastAPI
use real database data
version-control every schema migration from the project's first commit

38. ACCEPTANCE TESTS

The application is not considered complete until these scenarios work.

Setup
Supabase project exists and every migration in `supabase/migrations/`
applies cleanly to an empty project (`supabase db push` from scratch).
Bootstrap script creates exactly one ADMIN and no other accounts.

Authentication
New user signs up.
User is created in Supabase Auth.
Profile is created.
User is PENDING.
User cannot access infrastructure.
ADMIN sees pending user.
ADMIN approves user.
ADMIN assigns ENGINEER.
User can access engineer functions.

Viewer
Viewer logs in.
Viewer can search/view.
Viewer can view photos/documents.
Viewer cannot create a cable.
Viewer cannot edit a rack.
Viewer cannot upload files.
Viewer cannot access Admin.

Engineer
Engineer creates cable.
Engineer updates cable.
Engineer uploads photo.
Engineer adds note.
Engineer changes status.
Status history is created.

Admin
Admin approves users.
Admin changes roles.
Admin disables user.
Disabled user loses access.
Admin can reactivate user.
Admin can perform authorized deletion.

Data integrity
Invalid cable endpoint is rejected.
Duplicate cable ID is rejected.
Invalid port reference is rejected.
Unauthorized database operation is rejected by RLS.
Audit history cannot be modified by normal users.

Files
Authorized engineer uploads photo.
Viewer can view permitted photo.
Viewer cannot delete photo.
Unauthorized file access is rejected.
Admin can delete authorized attachment.

Infrastructure
Site → Room → Rack navigation works.
Rack → Equipment → Port works.
Rack → Patch Panel → Port works.
All four cable endpoint combinations work.
"What's connected here?" works.
QR opens the correct live record.
Global search finds records.

39. DELIVERABLE

Generate a complete runnable application.

Provide:

Supabase project setup: migrations, RLS policies, storage bucket policies, bootstrap-admin script
package.json
Vite configuration
Tailwind configuration
TypeScript configuration
Supabase client
authentication implementation
route guards
role/permission system
responsive application shell
login
signup
password reset
admin portal
user approval workflow
infrastructure pages
cable management
attachment management
search
QR functionality
audit interface
reports interface
reusable components
database type definitions
environment example
setup instructions (including Supabase project creation, not just "connect to a database")
deployment instructions

Do not provide pseudocode where working implementation is possible.

Build the application incrementally but ensure every implemented feature follows the security and authorization model above.

The final product must behave as a secure infrastructure documentation platform rather than a generic CRUD application.
