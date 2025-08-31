/**
 * Re-export the Redux-based auth hook as the default
 * This replaces the old direct Supabase auth implementation
 */
export { useAuth } from './useAuthRedux';
