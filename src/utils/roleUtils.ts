// Utility functions for handling user roles

export const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'promoter', label: 'Promoter' },
  { value: 'booking_agent', label: 'Booking Agent' },
  { value: 'other', label: 'Other' },
] as const;

export type RoleValue = typeof ROLE_OPTIONS[number]['value'];

/**
 * Formats a role value for display
 * @param role - The role value from the database
 * @returns Formatted role string for display
 */
export const formatRole = (role: string): string => {
  const roleOption = ROLE_OPTIONS.find(option => option.value === role);
  return roleOption ? roleOption.label : role;
};

/**
 * Validates if a role value is valid
 * @param role - The role value to validate
 * @returns True if the role is valid
 */
export const isValidRole = (role: string): role is RoleValue => {
  return ROLE_OPTIONS.some(option => option.value === role);
};

/**
 * Gets the default role for new users
 * @returns Default role value
 */
export const getDefaultRole = (): RoleValue => {
  return 'manager';
}; 