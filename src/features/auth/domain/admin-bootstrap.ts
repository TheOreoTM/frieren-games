export function isBootstrapAdmin(
  providerAccountId: string,
  configuredAdminId: string | undefined,
): boolean {
  const trustedId = configuredAdminId?.trim();
  return Boolean(trustedId) && providerAccountId === trustedId;
}
