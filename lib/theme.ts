import { createTheme, Textarea } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "red",
  components: {
    Textarea: Textarea.extend({
      defaultProps: { autosize: true, maxRows: 999, minRows: 2 },
    }),
  },
});
