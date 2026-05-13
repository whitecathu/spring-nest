export interface UserAccount {
  id: string;
  email: string;
  username: string;
  password?: string;
  passwordHash?: string;
  bio: string;
  createdAt: string;
}

export type PublicUserAccount = Omit<UserAccount, 'password' | 'passwordHash'>;

export type LoginResult = {
  success: boolean;
  user?: PublicUserAccount;
  error?: string;
};

export type RegisterResult = {
  success: boolean;
  user?: PublicUserAccount;
  error?: string;
};
