export function renderTemplate(
  template: string,
  params: Record<string, string | number | boolean>
): string {
  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => {
    const value = params[key];
    return value !== undefined && value !== null ? String(value) : "";
  });
}