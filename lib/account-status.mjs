/**
 * Treat any non-null deletion marker as pending deletion.
 * Fail closed for malformed marker values instead of allowing new activity.
 */
export function isAccountDeletionPending(profile) {
  return profile?.deleted_at != null
}
