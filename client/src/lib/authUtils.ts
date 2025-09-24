// Auth utilities for both local auth and SSO - referenced from blueprint integration
export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}