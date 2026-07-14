# 8. Stepped Database Commits for Setup Wizard

To ensure resilience against browser reloads and prevent data loss during long setup sessions, we decided to commit data to the database at each step of the creation wizard rather than keeping the entire state in memory until the end.
1. The new form will be initialized with `isActive: false`.
2. As the user completes each step of the accordion (General Info, Statuses, Transitions, Actions, n8n), the corresponding records are saved to the database immediately.
3. A final "Publish" step sets `isActive: true`, making the form live for end-users.
4. Database queries filtering for usable forms will exclude drafts where `isActive: false`.
