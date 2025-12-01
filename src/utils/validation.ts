export const isValidUrl = (value: string) => {
  if (!value) {
    return false;
  }
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

