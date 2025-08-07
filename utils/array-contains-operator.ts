export const arrayContainsOperator = (field: string, value: any[]) => {
  if (!value || value.length === 0) return { in: ["", { var: field }] };
  // support multi-select arrays: OR over each selected team
  if (Array.isArray(value)) {
    return {
      or: value.map((v) => ({ in: [v, { var: field }] })),
    };
  }
  return { in: [value, { var: field }] };
};
