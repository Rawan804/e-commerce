// Public hook that feature components use to access auth state and actions.
// Keeps the context implementation detail hidden behind a stable API.
export { useAuthContext as useAuth } from '../context/AuthContext'
