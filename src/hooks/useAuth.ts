// src/hooks/useAuth.ts
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

  // Mapear roles de Supabase a Prisma para compatibilidad
  const mapRoleToPrisma = (role: string): string => {
    if (role === 'ADMIN') return 'ADMIN';
    if (role === 'MODERATOR') return 'MODERATOR';
    return 'USER';
  };

  const hasRole = (role: string) => {
    if (!user?.role) return false;
    return mapRoleToPrisma(user.role) === role || user.role === role;
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isFamiliar = () => user?.role === 'FAMILIAR';
  const isAmigo = () => user?.role === 'AMIGO';
  const isInvitado = () => user?.role === 'INVITADO';

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