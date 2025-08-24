import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loginUser, registerUser, logoutUser, clearError } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const login = async (credentials: { email: string; password: string }) => {
    return await dispatch(loginUser(credentials));
  };

  const register = async (userData: { name: string; email: string; password: string; role?: string }) => {
    return await dispatch(registerUser(userData));
  };

  const logout = async () => {
    return await dispatch(logoutUser());
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const isAdmin = () => hasRole('ADMIN');
  const isFamiliar = () => hasRole('FAMILIAR');
  const isAmigo = () => hasRole('AMIGO');
  const isInvitado = () => hasRole('INVITADO');

  const canEdit = () => isAdmin() || isFamiliar();
  const canComment = () => isAuthenticated && !isInvitado();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearAuthError,
    hasRole,
    isAdmin,
    isFamiliar,
    isAmigo,
    isInvitado,
    canEdit,
    canComment,
  };
};
