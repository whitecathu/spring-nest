export interface UserAccount {
  id: string;
  email: string;
  username: string;
  password: string;
  bio: string;
  createdAt: string;
}

export type LoginResult = {
  success: boolean;
  user?: Omit<UserAccount, 'password'>;
  error?: string;
};

export type RegisterResult = {
  success: boolean;
  user?: Omit<UserAccount, 'password'>;
  error?: string;
};
