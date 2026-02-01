import PropTypes from 'prop-types';

/**
 * Spinner component for loading states
 * Displays an animated spinning loader
 */
const Spinner = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-3',
        lg: 'h-12 w-12 border-4',
        xl: 'h-16 w-16 border-4'
    };

    const spinnerSize = sizeClasses[size] || sizeClasses.md;

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div
                className={`${spinnerSize} border-blue-600 border-t-transparent rounded-full animate-spin`}
                role="status"
                aria-label="Loading"
            >
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
};

Spinner.propTypes = {
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
    className: PropTypes.string
};

export default Spinner;
