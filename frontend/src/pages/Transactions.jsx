import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transResponse, summaryResponse] = await Promise.all([
        transactionAPI.getAll(),
        transactionAPI.getSummary(),
      ]);
      setTransactions(transResponse.data.data);
      setSummary(summaryResponse.data.data);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  return (
    <div>
      <h1>Financial Transactions</h1>

      {summary && (
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <h3>Total Income</h3>
              <p className="stat-value" style={{ color: '#059669' }}>
                EGP {summary.totalIncome.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💸</div>
            <div className="stat-content">
              <h3>Total Expenses</h3>
              <p className="stat-value" style={{ color: '#dc2626' }}>
                EGP {summary.totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Balance</h3>
              <p className="stat-value" style={{ color: '#2563eb' }}>
                EGP {summary.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th>Patient</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn._id}>
                <td>{format(new Date(txn.transactionDate), 'MMM dd, yyyy')}</td>
                <td>
                  <span className={`badge ${txn.type === 'income' ? 'badge-success' : 'badge-warning'}`}>
                    {txn.type}
                  </span>
                </td>
                <td>{txn.category}</td>
                <td>{txn.description}</td>
                <td>
                  {txn.patient 
                    ? `${txn.patient.firstName} ${txn.patient.lastName}`
                    : '-'}
                </td>
                <td style={{ color: txn.type === 'income' ? '#059669' : '#dc2626', fontWeight: '600' }}>
                  {txn.type === 'income' ? '+' : '-'}EGP {txn.amount.toFixed(2)}
                </td>
                <td>
                  <span className={`badge badge-${txn.status === 'completed' ? 'success' : 'warning'}`}>
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
