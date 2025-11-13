export function renderTemplate(template, params) {
    return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => {
        const value = params[key];
        return value !== undefined && value !== null ? String(value) : "";
    });
}
