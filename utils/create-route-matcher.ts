export const createRouteMatcher = (protectedPaths: string[]) => {
  return (pathname: string) => {
    return protectedPaths.some((path) => {
      // Remove (.*) from the path and just check if pathname starts with the base path
      const basePath = path.replace(/\(.*\)$/, "");
      return pathname.startsWith(basePath);
    });
  };
};
