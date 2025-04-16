export const formatError = (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new Error(`${errorMessage}`);
};
