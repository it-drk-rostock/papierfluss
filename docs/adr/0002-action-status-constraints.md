# 2. Action Status Constraints Evaluated via JSON-Logic

Custom actions (`FormActionV2`) must only be visible and triggerable in specific submission statuses. We decided to evaluate these status constraints dynamically using the json-logic `permissions` field on the action, rather than introducing a database relationship (like a many-to-many join table between `FormActionV2` and `FormStatusV2`). This keeps the schema simpler and allows for highly dynamic, context-aware rule evaluation at the cost of slight evaluation overhead on the client and server.
