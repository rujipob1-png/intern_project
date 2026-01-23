import React from 'react';

export const Input = ({ 
  label, 
  error, 
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          input-field
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
