# 4. Form Versioning and Immutability

To prevent layout changes from breaking active submissions, we decided on a strict form versioning strategy:
1. **Pinned Submission Version**: Each `FormSubmissionV2` remains permanently linked to the specific `FormVersionV2` it was created under. Submissions are never migrated to newer versions.
2. **Conditional Version Mutability**: A `FormVersionV2` can be updated in-place during design time if and only if there are zero `FormSubmissionV2` entries linked to it.
3. **Automatic Version Increment**: Once a `FormVersionV2` has one or more linked submissions, it becomes immutable. Any subsequent layout changes in the designer will automatically trigger the creation of a new `FormVersionV2` with an incremented version number.
