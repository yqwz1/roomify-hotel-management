import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>;
    }

    if (!isAuthenticated) {
        // Redirect to login page with the return url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        // Check if user has at least one of the allowed roles
        // We use user.roles which is now guaranteed to be populated from the JWT in AuthProvider
        const userRoles = user?.roles || [];
        const hasPermission = userRoles.some(role => allowedRoles.includes(role));

        if (!hasPermission) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    allowedRoles: PropTypes.arrayOf(PropTypes.string)
};

export default ProtectedRoute;
