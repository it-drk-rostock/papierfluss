# Store Field-Level Permissions inside the SurveyJS Schema

We need to restrict specific fields/questions in forms so they can only be edited by specific roles or teams (e.g., controlling, ceo, arealeader). We need both client-side read-only rendering and strict server-side validation to prevent unauthorized updates.

We decided to store field-level permission rules directly in the SurveyJS JSON schema as a custom question property (`editPermissions`) holding standard stringified JsonLogic.

We rejected the alternative of storing permissions in a separate database model/relation (`FieldPermission`) because:
1. Keeping rules inside the SurveyJS schema guarantees permissions are natively versioned under `FormVersionV2` without database redundancy.
2. It completely avoids schema drift and desynchronization when fields are renamed or deleted in the form builder.
3. It keeps the form builder UI self-contained, allowing creators to edit permissions directly in the SurveyJS Creator properties sidebar.

## Consequences
- The client-side SurveyJS model must register the custom `editPermissions` property globally on the Serializer.
- Form submissions saved via server actions must perform a server-side Data Comparison Check against the database state (`oldData`) to reject any changes to fields where `editPermissions` evaluates to `false` for the current user session.
