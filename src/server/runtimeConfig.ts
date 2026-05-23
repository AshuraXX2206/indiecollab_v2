export function readRequiredSetting(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} must be configured on the hosting provider.`);
  }
  return value.trim();
}

export function readOptionalSetting(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

export function readCommaSeparatedSetting(name: string): Set<string> {
  const raw = readOptionalSetting(name) || "";
  return new Set(raw.split(",").map((item) => item.trim()).filter(Boolean));
}

export function userIsInAllowlist(userId: string, settingName: string): boolean {
  if (!userId) return false;
  return readCommaSeparatedSetting(settingName).has(userId);
}
