/**
 * ConfirmDialog Component
 * Modal สำหรับยืนยันการกระทำต่างๆ
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, HelpCircle, X } from 'lucide-react';

// Context สำหรับ Confirm Dialog
const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

// ConfirmDialog Component
const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'warning',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  confirmColor = 'blue'
}) => {
  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle className="w-12 h-12 text-amber-500" />,
    danger: <XCircle className="w-12 h-12 text-red-500" />,
    success: <CheckCircle className="w-12 h-12 text-green-500" />,
    info: <Info className="w-12 h-12 text-blue-500" />,
    question: <HelpCircle className="w-12 h-12 text-purple-500" />,
  };

  const bgColors = {
    warning: 'bg-amber-50',
    danger: 'bg-red-50',
    success: 'bg-green-50',
    info: 'bg-blue-50',
    question: 'bg-purple-50',
  };

  const buttonColors = {
    red: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    green: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Section */}
        <div className={`${bgColors[type]} py-8 flex justify-center`}>
          <div className="animate-bounce-once">
            {icons[type]}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-6 py-2.5 ${buttonColors[confirmColor]} text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Provider Component
export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'ยืนยัน',
    cancelText: 'ยกเลิก',
    confirmColor: 'blue',
    resolve: null,
  });

  const confirm = ({
    title = 'ยืนยันการดำเนินการ',
    message = 'คุณต้องการดำเนินการนี้หรือไม่?',
    type = 'warning',
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    confirmColor = 'blue',
  }) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        confirmColor,
        resolve,
      });
    });
  };

  const handleClose = () => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        confirmColor={dialogState.confirmColor}
      />
    </ConfirmContext.Provider>
  );
};

export default ConfirmDialog;
