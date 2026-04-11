import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export const ConfirmDialog = ({ 
  isOpen, 
  title = 'Confirm Action', 
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-11/12 overflow-hidden">
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-4 border-b ${isDangerous ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
          <AlertCircle size={20} className={isDangerous ? 'text-red-600' : 'text-amber-600'} />
          <h2 className={`text-lg font-semibold ${isDangerous ? 'text-red-900' : 'text-slate-900'}`}>
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-slate-700">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-medium hover:bg-slate-50 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium text-white transition ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-maroon-600 hover:bg-maroon-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
