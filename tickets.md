# Tickets: Forms V2 Implementation

This document lists the actionable tickets required to implement the Forms V2 digital paper route architecture on the Papierfluss platform. Work the **frontier**: any ticket whose blockers are all done.

Reference Specification: [spec-formv2.md](file:///c:/Users/Pohl/Documents/Github/papierfluss/docs/spec-formv2.md)

---

## 0. [PREFACTOR] Setup Vitest Testing Framework

**What to build:**
Configure a lightweight, fast unit and integration testing suite in the repository using Vitest. This enables us to write test-driven features at our defined server-action test seams.

**Blocked by:** None — can start immediately.

- [x] Install `vitest` and dependencies in `devDependencies`.
- [x] Configure `vitest.config.ts` or add a `test` script block in `package.json`.
- [x] Implement a basic sanity test that queries a mocked schema or environment to ensure the test runner passes successfully.

---

## 0.1. [SETUP] Create Forms V2 Page Folder Structure & Base Routing

**What to build:**
Establish the directory structure for Forms V2 pages under `app/(app)/formsv2` with co-located `_components` and `_lib` subfolders. Create protected routing pages using the `authQuery` cache helper. The legacy `/forms` and `/form-submissions` pages must remain completely untouched to keep V1 functioning.

**Blocked by:** None — can start immediately.

- [x] Create folder structure `app/(app)/formsv2/_components` and `app/(app)/formsv2/_lib`.
- [x] Create `app/(app)/formsv2/page.tsx` as a protected list view page of all V2 forms.
- [x] Create `app/(app)/formsv2/[id]/page.tsx` to fill out a brand-new submission for Form V2 `[id]`.
- [x] Create `app/(app)/formsv2/submissions/[id]/page.tsx` to view, edit, or review an existing Submission V2 `[id]`.
- [x] Create `app/(app)/formsv2/create/page.tsx` as a protected onboarding wizard page.
- [x] Add basic shell/layout structure to these pages using Mantine.

---

## 0.2. [SETUP] Standardize Client Server Action Hook

**What to build:**
Refine and standardize the `useServerAction` utility hook in `hooks/use-server-action.ts` to seamlessly integrate with ORPC server actions, ensuring consistent Mantine loading overlays, success/error notifications, modal closings, and redirect transitions.

**Blocked by:** None — can start immediately.

- [x] Inspect and refine `hooks/use-server-action-v2.ts` for clean typescript typings on inputs and outputs (implemented as a V2 hook file to keep existing workflows/V1 untouched).
- [x] Ensure that it maps nested ORPC error structures (e.g. from Zod or validation rules) to friendly user-facing messages.
- [x] Verify that `useOrpcServerAction` works correctly on the client side with custom interceptors and Mantine notifications.

---

## 1. [SCHEMA] Database Schema & Core Models Migration

**What to build:**
Renaming and establishing the new permission fields on the `FormV2` model in the database schema, separating Form definition management from Submission user actions.

**Blocked by:** None — can start immediately.

- [x] Modify `prisma/schema/formv2.prisma` to rename permission fields:
  - Form Configuration: `editFormPermissions`, `deleteFormPermissions`
  - Submission Access: `createSubmissionPermissions`, `readSubmissionPermissions`, `deleteSubmissionPermissions`, `archiveSubmissionPermissions`
- [x] Dont run any prisma migration commands we will manually Verify that the generated Prisma client builds successfully and includes the updated properties.

---

## 2. [BACKEND + TESTS] Dynamic Folder Visibility Filtering

**What to build:**
An action/endpoint that retrieves the navigation folder structure, dynamically hiding any folders or subfolders that contain zero forms (or child folders) accessible to the active user.

**Blocked by:**

- 1. [SCHEMA] Database Schema & Core Models Migration
- 0. [PREFACTOR] Setup Vitest Testing Framework
- 0.1. [SETUP] Create Forms V2 Page Folder Structure & Base Routing

- [x] Implement a function/action `getAccessibleFolderTree` that queries all visible `FormV2` entries using `readSubmissionPermissions`.
- [x] Implement an in-memory loop traversing up the parent folder hierarchy from accessible forms to compile the set of visible folders.
- [x] Hide any empty folder paths from the navigation response.
- [x] Write Vitest integration tests simulating a nested folder structure (e.g. `IT -> Internal -> Junior`) where subfolder elements are shown/hidden correctly based on user roles and teams.

---

## 3. [BACKEND + TESTS] Server-Side Field-Level Masking (Fetch Submission)

**What to build:**
Secure fetching of submission data. Before sending a submission's payload to the client, the server must parse the linked SurveyJS schema, evaluate the `viewPermissionRule` JSON-logic rule for each field, and delete any fields the user has no rights to see.

**Blocked by:**

- 1. [SCHEMA] Database Schema & Core Models Migration
- 0. [PREFACTOR] Setup Vitest Testing Framework

- [ ] Build the retrieve submission action handler.
- [ ] Read the linked `FormVersionV2` SurveyJS schema from the database.
- [ ] Strip (delete) keys from the submission `data` JSON object if they map to a question with a `viewPermissionRule` that evaluates to `false` for the current user session context.
- [ ] Write Vitest tests verifying that a submitter cannot view sensitive internal fields (like `managerNotes`) while an authorized manager can.

---

## 4. [BACKEND + TESTS] Server-Side Field Validation (Save Submission)

**What to build:**
Secure saving of submission updates. When a submission is saved or modified, the server must compute the diff of modified fields and evaluate the `editPermissionRule` JSON-logic property for each changed question, rejecting the save if any protected field is unauthorized.

**Blocked by:**

- 3. [BACKEND + TESTS] Server-Side Field-Level Masking (Fetch Submission)

- [ ] Build the save draft/submission server action.
- [ ] Load the existing submission payload (`oldData`) and compare it to the incoming update (`newData`) to isolate the modified fields.
- [ ] Look up the `editPermissionRule` for all modified fields in the SurveyJS schema.
- [ ] Run `json-logic-js` checks against the user session context and throw an error/abort the transaction if any unauthorized field was changed.
- [ ] Write Vitest tests asserting that attempts by a submitter to overwrite protected columns (like manager signatures) are successfully blocked and logged.

---

## 5. [BACKEND + TESTS] Status Deletion Safety & Submission Migration

**What to build:**
Validation on deleting workflow statuses. An administrator must be blocked from deleting a lifecycle status if active submissions currently reside in it, or be forced to provide a migration target status.

**Blocked by:**

- 1. [SCHEMA] Database Schema & Core Models Migration
- 0. [PREFACTOR] Setup Vitest Testing Framework

- [ ] Build the delete status action endpoint.
- [ ] Query for active (non-archived) submissions currently matching the status being deleted.
- [ ] Reject deletion with an error if active submissions exist and no migration fallback status is supplied.
- [ ] If a fallback status is provided, update all affected submissions in a transaction to point to the fallback status before deleting the status.
- [ ] Write Vitest tests covering both successful migration deletion and blocked deletion scenarios.

---

## 6. [BACKEND + TESTS] Form Versioning, Immutability & Locking

**What to build:**
Automatic versioning constraints on saving form configurations. A version is mutable only while there are zero submissions; once a submission exists, editing layout saves automatically clone the version and increment the version counter.

**Blocked by:**

- 4. [BACKEND + TESTS] Server-Side Field Validation (Save Submission)

- [ ] Implement the save form schema action handler.
- [ ] Query if any `FormSubmissionV2` records link to the current `FormVersionV2`.
- [ ] If submissions exist: clone the `FormVersionV2` records, increment the `version` field, save the updated schema in the new version, and redirect the editor context to it.
- [ ] Verify that existing submissions remain pinned to the older version's layout.
- [ ] Write Vitest tests asserting version freezing on submission creation and auto-increment on subsequent schema edits.

---

## 7. [BACKEND + TESTS] Custom Actions, State Transitions, and Audit Logging

**What to build:**
Executing transitions and custom actions on submissions. Validates execution permissions, updates submission status, fires registered n8n webhooks, and writes standard `'STATUS_TRANSITION'` audit logs.

**Blocked by:**

- 4. [BACKEND + TESTS] Server-Side Field Validation (Save Submission)
- 5. [BACKEND + TESTS] Status Deletion Safety & Submission Migration
- 0.2. [SETUP] Standardize Client Server Action Hook

- [ ] Implement the trigger action action handler.
- [ ] Verify the action permissions against the user context (status constraints are checked inside the action's json-logic `permissions` field).
- [ ] Transition the submission's status to the action's configured `toStatusId` or transition's `toStatusId`.
- [ ] Create a log entry in `FormSubmissionLogV2` with `actionType: 'STATUS_TRANSITION'` and `details: { from, to }`.
- [ ] If n8n webhooks are attached, trigger them asynchronously.
- [ ] Write Vitest tests validating correct status updates, transition permissions checks, and audit logging.

---

## 8. [UI] Stepped Form Creation Wizard (UI & DB Sync)

**What to build:**
A 5-step form creation wizard using Mantine `Accordion` or `Stepper` components, committing progress to the database at the end of each step as an inactive draft form.

**Blocked by:**

- 1. [SCHEMA] Database Schema & Core Models Migration
- 0.1. [SETUP] Create Forms V2 Page Folder Structure & Base Routing
- 0.2. [SETUP] Standardize Client Server Action Hook

- [ ] Build the multi-step frontend configuration form:
  - Step 1: Title, description, and SurveyJS layout.
  - Step 2: Custom Status configuration.
  - Step 3: Status Transition configuration.
  - Step 4: Custom Action configuration.
  - Step 5: n8n Workflow Connections.
- [ ] Save configurations to the database at the conclusion of each step with `isActive: false` (draft).
- [ ] Add a final "Publish" step that sets `isActive: true` on the database.
- [ ] Update form listing queries to filter out forms where `isActive` is false for non-admin views.

---

## 9. [AI SDK] AI Assistant Setup Integration

**What to build:**
Incremental AI assistants in the stepped form wizard, allowing the administrator to use natural language prompts at each step to draft layouts, statuses, transitions, or action sets.

**Blocked by:**

- 8. [UI] Stepped Form Creation Wizard (UI & DB Sync)

- [ ] Setup the server actions calling the AI SDK.
- [ ] Provide active teams and role choices as background context in the LLM system instructions.
- [ ] Feed step-specific instructions and examples to the AI model to guarantee structured JSON output.
- [ ] Build UI buttons on each step (e.g. "Suggest via AI") and render the generated drafts for preview, allowing the admin to inspect and tweak the result before committing to the step database write.
