import React from 'react';
import './BillingModal.css';

interface BillItem {
  frame_id: string;
  frame_name: string;
  quantity_sold: number;
  total_cost: number;
}

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName?: string;
  month?: string;
  items?: BillItem[];
  totalAmountDue?: number;
}

const BillingModal: React.FC<BillingModalProps> = ({ 
  isOpen, 
  onClose, 
  shopName, 
  month, 
  items = [], 
  totalAmountDue = 0 
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Billing Report</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        <div className="modal-body">
          <div className="bill-summary">
            <p><strong>Shop:</strong> {shopName}</p>
            <p><strong>Period:</strong> {month}</p>
          </div>
          
          <div className="bill-items-table">
            <table>
              <thead>
                <tr>
                  <th>Frame ID</th>
                  <th>Frame Name</th>
                  <th>Quantity Sold</th>
                  <th>Amount Due</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.frame_id}</td>
                    <td>{item.frame_name}</td>
                    <td>{item.quantity_sold}</td>
                    <td>${item.total_cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bill-total">
            <h3>Total Amount Due: ${totalAmountDue.toFixed(2)}</h3>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="button-secondary">Close</button>
          <button onClick={() => window.print()} className="button-primary">Print Bill</button>
        </div>
      </div>
    </div>
  );
};

export default BillingModal; 