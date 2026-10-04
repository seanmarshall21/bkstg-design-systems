// Join class names, skipping empty ones.
export function cx(...names) {
  return names.filter(Boolean).join(" ");
}
