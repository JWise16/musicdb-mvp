/**
 * Re-export the Redux-based admin auth hook as the default
 * This replaces the old direct Supabase admin check implementation
 */
export { useAdminAuth } from './useAdminAuthRedux';