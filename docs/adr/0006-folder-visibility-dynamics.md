# 6. Folder Visibility and Access Control

To organize forms without introducing complex permission inheritance, we decided against adding explicit permission fields (e.g. `readFolderPermissions`) to `FormFolderV2`.
Instead, folder visibility is derived dynamically based on the forms the user has access to:
1. The system fetches all `FormV2` records the user is authorized to read based on `readFormPermissions`.
2. The folder structure is built in-memory. A folder is visible if and only if it contains at least one visible form, or contains a subfolder that is visible.
3. This is calculated by traversing up the `parentId` hierarchy starting from the accessible forms.
This avoids duplicating access rules and prevents "orphan" folders or navigation blockages.
