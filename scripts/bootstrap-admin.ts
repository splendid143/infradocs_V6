/**
 * Bootstrap Admin Script
 * 
 * This script creates the first ADMIN account in a brand-new Supabase project.
 * Run ONCE with the service_role key (never in browser, never committed).
 * 
 * Usage:
 * 1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
 * 2. Run: npx tsx scripts/bootstrap-admin.ts
 * 
 * This creates exactly one ADMIN account with approval_status = 'APPROVED'.
 * All subsequent users follow the normal PENDING → ADMIN REVIEW flow.
 */

import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function bootstrapAdmin() {
  console.log('🚀 INFO DOCS - Bootstrap Admin')
  console.log('===============================\n')

  // Check if admin already exists
  const { data: existingAdmin } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'ADMIN')
    .maybeSingle()

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists:')
    console.log(`   Email: ${existingAdmin.email}`)
    console.log(`   ID: ${existingAdmin.id}`)
    console.log('\n✅ Bootstrap not needed. Exiting.')
    process.exit(0)
  }

  // Get admin email from env or prompt
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME || 'System Administrator'

  if (!adminEmail || !adminPassword) {
    console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables')
    console.error('   Set them before running this script.')
    process.exit(1)
  }

  if (adminPassword.length < 8) {
    console.error('❌ ADMIN_PASSWORD must be at least 8 characters')
    process.exit(1)
  }

  console.log('Creating admin account...')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Name: ${adminName}`)
  console.log('')

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: adminName,
    },
  })

  if (authError) {
    console.error('❌ Failed to create auth user:', authError.message)
    process.exit(1)
  }

  console.log('✅ Auth user created')
  console.log(`   User ID: ${authUser.user.id}`)

  // Update profile to ADMIN with APPROVED status
  const { error: profileError } = await supabase
    .from('users')
    .update({
      role: 'ADMIN',
      account_status: 'APPROVED',
      approval_status: 'APPROVED',
      is_active: true,
      name: adminName,
      approved_at: new Date().toISOString(),
      approved_by: authUser.user.id,
    })
    .eq('id', authUser.user.id)

  if (profileError) {
    console.error('❌ Failed to update profile:', profileError.message)
    // Clean up auth user on failure
    await supabase.auth.admin.deleteUser(authUser.user.id)
    process.exit(1)
  }

  console.log('✅ Profile updated to ADMIN with APPROVED status')

  // Verify
  const { data: verified } = await supabase
    .from('users')
    .select('id, user_code, name, email, role, account_status, approval_status, is_active')
    .eq('id', authUser.user.id)
    .single()

  console.log('\n✅ Bootstrap Complete!')
  console.log('======================')
  console.log(`User Code: ${verified?.user_code}`)
  console.log(`Name: ${verified?.name}`)
  console.log(`Email: ${verified?.email}`)
  console.log(`Role: ${verified?.role}`)
  console.log(`Account Status: ${verified?.account_status}`)
  console.log(`Approval Status: ${verified?.approval_status}`)
  console.log(`Active: ${verified?.is_active}`)
  console.log('\n🔐 You can now log in at http://localhost:3000/login')
  console.log('   Use the email and password you provided.')
}

bootstrapAdmin().catch((err) => {
  console.error('❌ Unexpected error:', err)
  process.exit(1)
})