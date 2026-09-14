# 7. Stepped AI-Assisted Onboarding

To make form creation robust and prevent LLM generation failures, we decided to implement a step-by-step creation wizard (represented as a Mantine Accordion or Stepper). Each step focuses on a single part of the configuration and provides its own AI generation assistant:
1. **Step 1: General Info & Fields** - Title, description, and SurveyJS schema layout.
2. **Step 2: Lifecycle Statuses** - The statuses (stages) representing the paper route.
3. **Step 3: Status Transitions** - Valid transition paths between statuses.
4. **Step 4: Custom Actions** - Custom buttons for collecting input, transitioning status, and running webhooks.
5. **Step 5: n8n Connection** - Registering and connecting global submit and archive automation workflows.
Each step has access to context from the previous steps to ensure consistency.
