import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, logout } from '../store/slices/authSlice';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const signIn = (username: string, password: string) =>
    dispatch(login({ username, password }));

  const signOut = () => dispatch(logout());

  return { user, isAuthenticated, loading, error, signIn, signOut };
}
