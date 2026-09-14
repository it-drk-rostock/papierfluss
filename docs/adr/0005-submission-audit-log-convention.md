# 5. Submission Audit Log Convention

To track status transitions and custom actions in the audit trail without complicating the database schema, we decided to use a convention-based approach for `FormSubmissionLogV2`.
1. The schema's `actionType` (a plain string) and `details` (a nullable JSON field) will be reused.
2. For status transitions, `actionType` will be set to `'STATUS_TRANSITION'`.
3. The `details` JSON field will store transition metadata:
   ```json
   {
     "from": "Draft",
     "to": "In Review"
   }
   ```
This avoids creating new database columns or tables while providing a complete, human-readable audit trail.
