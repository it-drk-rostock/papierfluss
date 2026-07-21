# Forms V2

A digital forms and automation system that mimics a circulating physical paper sheet (a "paper route") moving through an organization, supporting protected fields, custom workflows, and status transitions.

## Language

**Form**:
A high-level configuration defining the layout, access rules, status lifecycles, and automation workflows for a type of document.
_Avoid_: Questionnaire, survey template

**Form Version**:
An immutable, versioned snapshot of a Form's schema (SurveyJS layout) and metadata configuration.
_Avoid_: Form snapshot

**Form Submission**:
A filled-out instance of a Form Version containing the response data, its current status, and history.
_Avoid_: Response, record, entry

**Form Status**:
A configured state in the lifecycle of a Form Submission representing a station in its paper route (e.g., "Draft", "In Review", "Approved").
_Avoid_: State, stage

**Form Status Transition**:
A direct path connecting two Form Statuses, allowing the submission to advance or roll back, guarded by logic rules.
_Avoid_: Status change

**Form Action**:
An interactive button on a Form Submission that can collect additional input (via a schema), run an automation workflow (n8n), and optionally transition the status.
_Avoid_: Webhook trigger, button

**Protected Field**:
A field/question in a Form Version whose edit rights are restricted by a logic rule (evaluated on both client and server).
_Avoid_: Locked field, read-only question

**Form Folder**:
A nested hierarchical folder structure used to organize Forms in the navigation tree.
_Avoid_: Category, directory, area
