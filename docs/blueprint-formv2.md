# Blueprint: Forms V2 (SurveyJS & n8n workflow system)

This document provides a conceptual architecture blueprint for the development of Forms V2 in the Papierfluss platform. It details the design goals, core technologies, and database architecture.

---

## 1. Architectural Overview & Design Goals

Forms V2 is a digital forms and automation system. It bridges the gap between client-side rich form builders (SurveyJS) and backend automation engines (n8n), unified by a database schema managing granular access rules.

### Core Goals:
1.  **Dynamic Form Layouts**: Enable administrators to build custom forms on the fly using SurveyJS Creator, storing schemas in a versioned format.
2.  **Field-Level Protection**: Prevent unauthorized users from modifying specific fields (e.g., signature or internal approvals) both on the client (visual locking) and the server (data validation checks).
3.  **Flexible State Machine (Custom Statuses)**: Replace hardcoded submission statuses with custom workflow states (e.g., Draft -> In Progress -> Manager Approval -> Completed) tailored for each form.
4.  **Custom Actions & Automation**: Allow triggering custom actions (buttons) on active submissions that run specified n8n workflows and/or transition state.
5.  **Full Audit Trail**: Record all saves, status changes, archives, and custom action triggers with user and system metadata.

---

## 2. Main Libraries & Technology Stack

The platform utilizes a type-safe stack:

*   **Next.js (App Router)**: Base web framework & Routing. Handles page layouts, server actions, and search optimization.
*   **SurveyJS**: Form Builder & Form Renderer. Manages schema definitions, designer visual builder, and form presentation.
*   **Mantine**: UI Component Library. Standardizes modal alerts, layout frameworks, input widgets, and notifications.
*   **Zod**: Data Validation. Ensures schema typing and structural validation.
*   **AI SDK**: Smart Onboarding. Translates natural language descriptions into form configurations.
*   **AWS SDK v3**: File & Media Uploads. Manages file attachments inside form fields.
*   **Prisma**: Database ORM. Queries and writes configuration states across database models.
*   **Tabler Icons**: Vector Icons. Standardized visual iconography.
*   **TanStack React Query**: State caching and synchronization.
*   **ORPC**: Server action and API routing layer linking Next.js frontend/backend.
*   **Better Auth**: Authentication management, social SSO integrations, and user session metadata mapping.
*   **json-logic-js**: Permission rule evaluation engine.
*   **react-querybuilder**: Visual rule builder using Mantine theme adaptations.

---

## 3. Database Schema Architecture

The database structures are structured around modular models managing permissions, versions, lifecycles, and actions.

### Core Models:
*   **FormFolderV2**: Represents nested folder structures for organizing forms.
*   **FormV2**: High-level form configuration defining team accessibility rules, global properties, versions, states, custom actions, and automatic submit/archive automation triggers.
*   **FormVersionV2**: Immutable versions preserving form layouts (SurveyJS schemas) and metadata configuration.
*   **FormSubmissionV2**: Stored user responses linked directly to the form version at creation.
*   **FormStatusV2**: Dynamically configured lifecycle state machines for form entries.
*   **FormStatusTransitionV2**: Authorized paths connecting lifecycle states, guarded by logic permissions.
*   **FormActionV2**: Action buttons executed on submissions to collect additional input, advance status, or invoke webhooks.
*   **N8nWorkflowV2**: Registered webhook identifiers mapped to n8n pipelines.
*   **FormSubmissionLogV2**: Audit trail logging historical modifications, transitions, and payload differences.

---

## 4. Field-Level Protection Design

Field-level protection restricts updates to specific form questions using logic constraints.

*   **Client-Side Integration**: Employs global registration of an edit permission logic property. The form builder visualizes this configuration using the permissions builder. Form renderers evaluate this property against active user contexts to disable inputs.
*   **Server-Side Verification**: Runs automated validation checks comparing submitted updates against stored records. Attempts to modify unauthorized questions are blocked.

---

## 5. Lifecycle Automations & Webhooks (n8n)

Automations are triggered asynchronously:
*   **Forms Submit/Archive Webhooks**: Fired upon submission creation or archival operations.
*   **Custom Action Webhooks**: Triggers specific workflow execution pipelines when action buttons are invoked and verified.

---

## 6. Onboarding & AI-Powered Setup

An interactive setup wizard uses language models to draft form configurations:
1.  **Requirement Definition**: User enters process parameters in plain language.
2.  **Configuration Generation**: An LLM maps requirements to SurveyJS questions, statuses, transition paths, and actions.
3.  **Preview and Commit**: The configuration is previewed visually and committed to the database in a transaction.

---

## 7. Developer Reference documentation (LLM)

For detailed documentation when configuring dependencies:
*   **Mantine Docs**: https://mantine.dev/llms-full.txt
*   **Zod Docs**: https://zod.dev/llms-full.txt
*   **Next.js Docs**: https://nextjs.org/docs/llms-full.txt
*   **SurveyJS Docs**: https://surveyjs.io/llms.txt
*   **ORPC Docs**: https://v2.orpc.dev/llms-full.txt
*   **Better Auth Docs**: https://better-auth.com/llms.txt
