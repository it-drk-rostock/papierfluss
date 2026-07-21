# Specification: Forms V2 (SurveyJS & n8n Workflow System)

## Problem Statement

Administrators in Papierfluss need to create and manage digital workflow forms that route through the organization. The current V1 implementation has hardcoded statuses (`ongoing`, `submitted`, `inReview`, `rejected`, `completed`) and lacks versioning and field-level access rules. Because of this, it cannot support processes that resemble physical paper routes—such as forms where specific sections must be locked/hidden based on roles/statuses, or where custom actions and workflows must be triggered at different stages.

## Solution

Implement Forms V2: a highly dynamic, collaborative digital document and workflow system. It supports:
1. Custom status configurations (states) and status transition paths (state machine).
2. Custom action buttons that can collect data, transition status, and run n8n workflows.
3. Field-level protection (visual locking on the client, and server-side masking/verification) using json-logic rules embedded in the SurveyJS schema.
4. Immutable form versioning so layout changes do not break active submissions.
5. In-memory dynamic folder visibility mapping so users only see folders containing forms they are authorized to access.
6. A 5-step onboarding wizard (Accordion/Stepper) that saves draft state to the database step-by-step and utilizes AI assistants for schema drafting, status configuration, and action definitions.

## User Stories

1. As an administrator, I want to create nested form folders, so that I can organize forms logically.
2. As a user, I want to see only the folders containing forms I have permission to read, so that my navigation panel remains uncluttered.
3. As an administrator, I want to use a step-by-step creation wizard, so that I can build complex forms without getting overwhelmed.
4. As an administrator, I want to use an AI assistant at each step of the creation wizard, so that I can quickly draft layouts, statuses, and custom actions from plain language.
5. As an administrator, I want my progress in the form creation wizard to be saved to the database at each step, so that I don't lose work on page reloads.
6. As a user, I want to fill out and submit a form, so that it enters the configured lifecycle workflow.
7. As a reviewer, I want to see only the fields I am authorized to read on a submission, so that sensitive user data (like HR details) remains protected from unauthorized eyes.
8. As a reviewer, I want to see custom action buttons (like "Approve" or "Reject") on a active submission based on its current status, so that I can transition the form's state.
9. As a reviewer, I want to be prompted to enter a comment/payload when executing specific custom actions, so that I can supply required review feedback.
10. As a user, I want to view my submitted forms and see their audit trail, so that I can track who changed the status and when.
11. As an administrator, I want to edit a form layout without breaking existing, active submissions, so that those submissions can continue to use the version they were started on.
12. As a developer, I want custom actions to trigger external n8n workflows, so that I can integrate Papierfluss with external systems.
13. As a user, I want the system to block unauthorized field modifications on the server side, so that malicious API requests cannot edit protected signature or approval fields.
14. As an administrator, I want to edit, rename, delete, and reorder folders in a tree dashboard, so that I can organize the navigation structure.
15. As a user, I want the sidebar to render forms grouped by their folders, so that navigation is logical.

## Implementation Decisions

*   **Schema Renaming & Access Boundaries**: The permissions fields on `FormV2` are split to separate Form Definition access (`editFormPermissions`, `deleteFormPermissions`) from Submission access (`createSubmissionPermissions`, `readSubmissionPermissions`, `deleteSubmissionPermissions`, `archiveSubmissionPermissions`).
*   **Field-Level Protection Properties**: Two custom properties are embedded directly inside the SurveyJS JSON schema for each question:
    *   `editPermissionRule` (json-logic): Who can modify this field.
    *   `viewPermissionRule` (json-logic): Who can view/read this field.
*   **Server-Side Field Masking**: When loading a submission's data, the server reads the linked `FormVersionV2` SurveyJS schema. For each field matching a failing `viewPermissionRule`, its value is stripped from the API payload before sending it to the client.
*   **Server-Side Field Verification**: When saving a submission, the server compares `oldData` and `newData` to isolate modified fields, and evaluates the `editPermissionRule` for each modified field. Unauthorized updates are blocked.
*   **Form Versioning**: Submissions are permanently pinned to the version they were created under. A `FormVersionV2` is mutable only while it has zero submissions; once a submission is created, the version is locked, and future edits clone and auto-increment the version.
*   **Action Status Constraints**: Instead of a complex database join table, action visibility for specific lifecycle stages is evaluated dynamically via json-logic inside `FormActionV2.permissions` (e.g., matching the current submission status).
*   **Status Deletion Safety**: Deleting a status is restricted at the application level if active submissions are currently sitting in it, or forces the administrator to select a fallback status to migrate active submissions.
*   **Conventions for Audit Logs**: Simple conventions are used inside the existing `FormSubmissionLogV2` model:
    *   For status transitions: `actionType` is `'STATUS_TRANSITION'` and `details` JSON holds the `from` and `to` status names.
*   **Folder Visibility**: Calculated dynamically in-memory by traversing parent hierarchies starting from accessible forms (folders containing zero visible forms or visible subfolders are dynamically hidden).
*   **Folder Management & Reordering**: Administrators manage folder hierarchies using an admin tree dashboard with Mantine's drag-and-drop support. Structure changes are persisted back to the database in a batch update transaction (`reorderFoldersV2`) modifying `parentId` and `order`. Deleting a folder reparents child folders and forms to the parent level or root to prevent accidental loss of forms or subfolders.

## Testing Decisions

*   **Test Seam**: We will set up a testing suite using Vitest to test the server actions and API procedures.
*   **Modules Tested**:
    *   `readSubmission` / `saveSubmission` action handlers (testing field-level masking and write verification).
    *   `getAccessibleForms` / folder tree builder (testing dynamic folder filtering).
    *   Form builder version clone logic.
*   **Good Test Principles**: Tests will evaluate external behavior (e.g., verifying that calling the API with an unauthorized user role strips protected fields from the JSON payload) without relying on internal UI states.

## Out of Scope

*   **Dynamic Role Creation**: The database and auth layer will stick to the hardcoded `UserRole` enum values (`admin`, `moderator`, `user`).
*   **n8n Pipeline Designing**: n8n workflows will continue to be configured within the n8n application and registered in Papierfluss by webhook ID only.

## Further Notes

*   This spec was compiled as a result of a grilling session based on [blueprint-formv2.md](file:///c:/Users/Pohl/Documents/Github/papierfluss/docs/blueprint-formv2.md) and recorded decisions.
