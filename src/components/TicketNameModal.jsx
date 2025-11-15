// components/TicketNameModal.jsx
import { useState } from 'react';

export default function TicketNameModal({ open, onClose, onConfirm }) {
  const [name, setName] = useState('');

  return (
    <div className={`fixed inset-0 bg-black/30 flex items-center justify-center ${open ? '' : 'hidden'}`}>
      <div className="bg-white p-6 rounded-lg max-w-sm w-full">
        <h3 className="font-medium text-lg mb-3">Ticket Name</h3>
        <input
          type="text"
          className="w-full border p-2 mb-4 rounded"
          placeholder="Optional name for ticket"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button 
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            onClick={() => onClose()}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              onConfirm(name);
              onClose();
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}