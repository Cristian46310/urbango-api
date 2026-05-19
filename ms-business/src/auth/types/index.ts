export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  roles: string[];
  createdAt: number;
  enterpriseId?: string;
}
