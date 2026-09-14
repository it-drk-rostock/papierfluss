# 1. Field-Level Permissions Embedded in SurveyJS Schema

For Forms V2, we need to enforce field-level read/write rules. We decided to store these rules directly inside the SurveyJS JSON schema under a custom `editPermissionRule` property per question, rather than creating a separate database model. This reduces database complexity and keeps the form layout and its granular rules co-located. The server will parse this schema, detect modified fields by diffing old/new submission payloads, and execute the json-logic rules on the server before applying updates.
