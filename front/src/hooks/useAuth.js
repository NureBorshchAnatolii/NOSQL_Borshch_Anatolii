import { useContext } from 'react';
import { AuthContext } from '../context-helper/AuthContext';

export const useAuth = () => useContext(AuthContext);