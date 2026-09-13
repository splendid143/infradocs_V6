-- INFO DOCS - Reference Data Seed
-- Run with: supabase db seed (or manually in SQL editor)
-- This only seeds reference data - NO user accounts with passwords

-- Cable Types (already defined as enum, but can add descriptions here)
-- cable_type enum: FIBER, COPPER, COAX, POWER, OTHER

-- Infrastructure Statuses (already defined as enum)
-- infrastructure_status enum: PLANNED, INSTALLED, TESTED, VERIFIED, ISSUE, REMOVED, ARCHIVED

-- Document Types (already defined as enum)
-- document_type enum: INSTALLATION, TEST_REPORT, COMMISSIONING, VENDOR_DOC, DIAGRAM, INSPECTION, OTHER

-- User Roles (already defined as enum)
-- user_role enum: ADMIN, ENGINEER, VIEWER

-- Account Statuses (already defined as enum)
-- account_status enum: PENDING, APPROVED, REJECTED, DISABLED

-- Approval Statuses (already defined as enum)
-- approval_status enum: PENDING, APPROVED, REJECTED

-- Example: Seed some common equipment types (optional)
-- You can extend this with a separate equipment_types table if needed

-- Example: Seed common port types (optional)
-- You can extend this with a separate port_types table if needed

-- Example: Seed common manufacturers (optional)
-- You can create a manufacturers table if needed

-- This file is intentionally minimal - the application creates all reference data through enums
-- and user-generated content. No hardcoded reference data is required for the application to function.