import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import PropTypes from 'prop-types';
import Spinner from './Spinner';

/**
 * PrivateRoute component
 * Protects routes by checking authentication status and optionally role permissions
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} props.allowedRoles - Optional array of allowed roles (e.g., ['ROLE_MANAGER'])
 */
const PrivateRoute = ({ children, allowedRoles = null }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication status
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access if allowedRoles is specified
    if (allowedRoles && allowedRoles.length > 0) {
        const hasRequiredRole = user?.roles?.some(role => allowedRoles.includes(role));

        if (!hasRequiredRole) {
            // Redirect to unauthorized page instead of guessing a dashboard
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // User is authenticated and has required role (if specified)
    return children;
};

PrivateRoute.propTypes = {
    children: PropTypes.node.isRequired,
    allowedRoles: PropTypes.arrayOf(PropTypes.string)
};

export default PrivateRoute;
