export interface AuthUser {
  sub: string;
  username?: string;
  email?: string;
  groups: string[];
}
