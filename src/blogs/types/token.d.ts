export interface TokenInfo {
  exp: number;
  iat: number;
  id: string;
  username: string;
  role: number;
  type: 'access' | 'refresh';
}
