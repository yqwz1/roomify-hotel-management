export const LtrText = ({ children, className = '', as: Component = 'span' }) => {
  return (
    <Component
      dir="ltr"
      className={`inline-block max-w-full break-words text-left font-sans [overflow-wrap:anywhere] ${className}`}
      style={{ unicodeBidi: 'isolate' }}
    >
      {children}
    </Component>
  );
};
