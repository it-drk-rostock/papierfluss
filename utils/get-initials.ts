// Helper function to extract initials from "Lastname, Firstname" format
export const getInitials = (name: string): string => {
  if (!name) return "";

  // Split by comma and space
  const parts = name.split(", ");

  if (parts.length >= 2) {
    // Get first letter of lastname and firstname
    const lastname = parts[0].trim();
    const firstname = parts[1].trim();

    const lastInitial = lastname.charAt(0).toUpperCase();
    const firstInitial = firstname.charAt(0).toUpperCase();

    return `${lastInitial}${firstInitial}`;
  }

  // Fallback: just get first letter of the name
  return name.charAt(0).toUpperCase();
};
