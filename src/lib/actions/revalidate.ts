'use server'

import { revalidatePath } from 'next/cache'

/**
 * Centralized revalidation helper.
 * Revalidates all common dashboard paths after any data mutation.
 * This prevents the fragile pattern of manually listing paths in every action.
 */
export function revalidateDashboard() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/trips')
  revalidatePath('/dashboard/expenses')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/owners')
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/settlements')
  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard/partners')
}
