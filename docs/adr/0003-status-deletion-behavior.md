# 3. Status Deletion Behavior and Submission Safety

When a custom status (`FormStatusV2`) is deleted by an administrator, any associated submissions could be left in a `null` status state, stranding them in limbo. To prevent this, we decided to implement application-level verification:
1. Prevent deletion of any `FormStatusV2` that has active (non-archived) submissions.
2. If deletion is forced, require the administrator to select a fallback status to migrate existing submissions into.
On the database schema level, the relationship will remain `onDelete: SetNull` to avoid cascading deletion of submissions.
