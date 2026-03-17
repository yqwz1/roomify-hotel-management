/**
 * A wrapper component that forces its content to be displayed Left-to-Right (LTR).
 * Useful for data strings like reservation numbers or phone numbers that should 
 * remain readable regardless of the app's current language direction (RTL/LTR).
 */
export const LtrText = ({ children, className = '' }) => {
  return (
    <span dir="ltr" className={`inline-block font-sans ${className}`}>
      {children}
    </span>
  );
};
