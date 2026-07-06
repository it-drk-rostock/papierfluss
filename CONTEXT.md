# Papierfluss

A document management and digital forms workflow application designed for secure, permissioned business process automation.

## Language

**Field-Level Protection**:
Enforcement of edit restrictions on specific questions/fields in a form. Protected fields are rendered as read-only on the frontend and validated on the backend.

**editPermissions**:
A custom SurveyJS Question property containing a stringified JsonLogic rule that determines if the current user is authorized to edit the field.

**Data Comparison Check**:
The server-side validation process that compares the saved database state (`oldData`) against the incoming request payload (`newData`) for all fields where the user lacks `editPermissions`, ensuring no unauthorized modifications occurred.

**FormSubmissionLogV2**:
The database model that represents a single audit trail entry for a versioned form submission (`FormSubmissionV2`).

**Audit Trail (V2)**:
The chronological log system that records historical events—specifically archiving, saving (with field-level diffs), and triggering custom actions—on a versioned form submission.

## Example Dialogue

**Developer**: I want to make sure the controlling department can't edit the CEO's release signature field on this form.
**Domain Expert**: We can use **Field-Level Protection** for that! Just add the **editPermissions** rule on the signature field in the form editor to only allow the CEO role.
**Developer**: Got it. And on the backend, when saving the form submission, the server will run the **Data Comparison Check** using the database's `oldData` to make sure the controller didn't modify that field, even if they bypass the UI lock.
**Developer**: Also, we need an **Audit Trail (V2)** to trace who made changes. Each save, archive, or custom action trigger will create a **FormSubmissionLogV2** entry, storing key changes and action metadata.
