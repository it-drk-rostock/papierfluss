import { createTheme, Menu, Textarea } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "red",
  components: {
    Textarea: Textarea.extend({
      defaultProps: { autosize: true, maxRows: 999, minRows: 2 },
    }),
    Menu: Menu.extend({
      defaultProps: { zIndex: 1 },
    }),
  },
});
