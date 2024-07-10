import React from 'react';

interface PopupProps {
  message: string;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ message, onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup">
        <div dangerouslySetInnerHTML={{ __html: message }} />
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Popup;