export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export interface RefreshRequest {
  refreshToken: string;
}
