# Field-Level Protection Design & Implementation Guide

This document details how to implement **Field-Level Protection** in the papierfluss application using SurveyJS schemas, your existing visual React QueryBuilder, `json-logic-js`, and Next.js server actions.

---

## 1. Database & Prisma Architecture
No database changes or Prisma migrations are required. 
The custom field-level permissions are stored inline in the SurveyJS schema JSON inside `FormVersionV2.schema` and evaluated on the server side using the submission’s historical values in `FormSubmissionV2.data`.

---

## 2. Client-Side Global Registration
To expose the custom `editPermissions` property in both the SurveyJS Creator (for form builders) and the SurveyJS model (for form fillers), register the property on the global `Serializer`.

Add this code in **`providers/providers.tsx`** (or a client-side layout root):

```typescript
import { Serializer } from "survey-core";

if (typeof window !== "undefined") {
  Serializer.addProperty("question", {
    name: "editPermissions",
    type: "text",
    category: "general",
    displayName: "Edit Permissions (JsonLogic)",
  });
}
```

Once registered, the property:
1. Appears in the **SurveyJS Creator sidebar** for every question.
2. Automatically serializes into the form schema JSON as:
   ```json
   {
     "type": "text",
     "name": "approval_signature",
     "editPermissions": "{\"in\": [\"ceo\", {\"var\": \"user.role\"}]}"
   }
   ```

---

## 3. Integrating the Visual Query Builder (Mantine) inside SurveyJS Creator
To provide a premium editor experience and eliminate the need for administrators to write raw JSONLogic, we can register your existing **`WorkflowPermissionBuilder`** (which uses `@react-querybuilder/mantine`) as a custom property editor in the SurveyJS Creator!

This way, when the designer clicks "Edit Permissions" in the properties sidebar, it displays your beautiful visual rule builder instead of a standard text box.

### A. Register the Property Grid Editor
In the file where SurveyJS Creator is initialized (e.g., **`app/(app)/workflows/[id]/designer/_components/process-designer-form.tsx`**), import the editor registry and map the `editPermissions` property to a custom element type:

```typescript
import { PropertyGridEditorCollection } from "survey-creator-react";

// Register custom editor for editPermissions
PropertyGridEditorCollection.register({
  fit: (prop) => prop.name === "editPermissions",
  
  getJSON: (obj, prop, options) => {
    return {
      type: "permission-builder-editor",
    };
  }
});
```

### B. Register the React Custom Component Wrapper
Next, register the visual wrapper component with SurveyJS's element helper. This maps your QueryBuilder to the SurveyJS property state:

```tsx
import { useState } from "react";
import { ReactElementHelper } from "survey-creator-react";
import { WorkflowPermissionBuilder } from "@/components/workflow-permission-builder";

ReactElementHelper.registerHtmlType("permission-builder-editor", (model) => {
  // Capture current JSONLogic string or default to true (allow all)
  const [currentRule, setCurrentRule] = useState(() => model.value || "true");

  return (
    <div style={{ padding: "8px 0" }}>
      <WorkflowPermissionBuilder
        initialData={currentRule}
        label="Feld-Berechtigungen festlegen"
        permissionType="process"
        
        // We pass custom handlers to bridge react-querybuilder with the SurveyJS model
        formActionName="surveyjs-editor"
        fieldValue="editPermissions"
        onChange={(newJsonLogicString) => {
          setCurrentRule(newJsonLogicString);
          model.value = newJsonLogicString; // Persists change instantly to the SurveyJS question config!
        }}
      />
    </div>
  );
});
```

*(Note: In your `WorkflowPermissionBuilder`, you will add an optional `onChange` prop so that when rules are formatted into JSONLogic, they trigger `onChange?.(jsonLogicString)` in addition to setting the Mantine form action value).*

---

## 4. Frontend Form Rendering & Enforcement
When rendering a form (e.g., inside `app/(app)/runs/[id]/_components/workflow-run-form.tsx` or `form-submission-form.tsx`), parse the rules once upon loading the model to gray out/disable questions.

Update the `useMemo` block that instantiates `Model`:

```typescript
import { useMemo } from "react";
import { Model } from "survey-core";
import jsonLogic from "json-logic-js";

// ... inside your component
const model = useMemo(() => {
  const surveyModel = new Model(submission.form.schema);
  surveyModel.locale = "de";
  surveyModel.data = submission.data;
  surveyModel.showCompleteButton = false;
  surveyModel.readOnly = submission.status === "completed";

  // Evaluate field-level permissions if the form isn't already completed
  if (submission.status !== "completed" && session?.user) {
    const userContext = {
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        teams: session.user.teams?.map((t: any) => t.name) ?? [],
      },
      data: submission.data || {},
    };

    surveyModel.getAllQuestions().forEach((question) => {
      const rulesStr = question.getPropertyValue("editPermissions");
      if (rulesStr) {
        try {
          const rules = JSON.parse(rulesStr);
          const hasPermission = jsonLogic.apply(rules, userContext);
          if (hasPermission !== true) {
            // Disables the field and grays it out in the UI
            question.readOnly = true; 
          }
        } catch (e) {
          console.error(`Invalid editPermissions JSON on field ${question.name}:`, e);
        }
      }
    });
  }

  return surveyModel;
}, [submission, session]);
```

---

## 5. Backend Action Validation (Server Actions)
To ensure users cannot bypass the frontend by sending crafted payloads directly to the Server Actions, run a **Data Comparison Check** in your update and submit actions (e.g., `saveProcessRun` in `_actions.ts`).

### Reusable Validator Helper
Create this helper function inside a new utility file `utils/validate-field-permissions.ts`:

```typescript
import { Model as SurveyModel } from "survey-core";
import jsonLogic from "json-logic-js";

interface SessionUser {
  id: string;
  email: string;
  role: string;
  teams: { name: string }[];
}

/**
 * Normalizes values and compares them deeply.
 * Empty string, null, and undefined are treated as equal.
 */
const isValueEqual = (val1: any, val2: any): boolean => {
  const isVal1Empty = val1 === undefined || val1 === null || val1 === "";
  const isVal2Empty = val2 === undefined || val2 === null || val2 === "";
  if (isVal1Empty && isVal2Empty) return true;
  if (isVal1Empty !== isVal2Empty) return false;
  return JSON.stringify(val1) === JSON.stringify(val2);
};

export function validateFieldPermissions(
  schema: any,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  user: SessionUser
): { isValid: boolean; errorField?: string } {
  if (!schema) return { isValid: true };

  const survey = new SurveyModel(schema);
  const allQuestions = survey.getAllQuestions();

  const userContext = {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      teams: user.teams?.map((t) => t.name) ?? [],
    },
    data: oldData, // Securely use DB state as evaluation context
  };

  for (const question of allQuestions) {
    const editPermissions = question.getPropertyValue("editPermissions");
    if (editPermissions) {
      try {
        const rules = JSON.parse(editPermissions);
        const hasPermission = jsonLogic.apply(rules, userContext);

        if (hasPermission !== true) {
          const oldValue = oldData[question.name];
          const newValue = newData[question.name];

          // If the user does not have permission, value MUST not have changed
          if (!isValueEqual(oldValue, newValue)) {
            return {
              isValid: false,
              errorField: (question as any).title || question.name,
            };
          }
        }
      } catch (error) {
        console.error(`Error validating permissions on field ${question.name}:`, error);
        // Fail open or closed depending on security posture (Recommended: fail closed)
        return { isValid: false, errorField: question.name };
      }
    }
  }

  return { isValid: true };
}
```

### Integration in Server Actions
In `app/(app)/runs/[id]/_actions.ts`, import and call the validator inside your update action (`saveProcessRun`):

```typescript
import { validateFieldPermissions } from "@/utils/validate-field-permissions";

// ... inside saveProcessRun action body:
const currentProcessRun = await prisma.processRun.findUnique({
  // ... select schemas, data, teams, etc.
});

// Run the Data Comparison Check
const permissionCheck = validateFieldPermissions(
  currentProcessRun.process.schema,
  (currentProcessRun.data as Record<string, any>) || {},
  data || {}, // client payload
  ctx.session.user
);

if (!permissionCheck.isValid) {
  throw new Error(
    `Keine Berechtigung zur Änderung des geschützten Feldes "${permissionCheck.errorField}"`
  );
}
```

---

## 6. System Bypass & n8n Workflows
Because system-triggered workflows (n8n API requests, scheduled cron actions) run in a system context, they do **not** route through the standard client-facing user server actions. 
Instead, they invoke system webhooks or direct prisma updates (e.g., `prisma.processRun.update`). 
This means n8n automation naturally bypasses user-level field restrictions, requiring no changes to your workflow orchestration layer.
