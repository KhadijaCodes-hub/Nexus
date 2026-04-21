import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Wallet, ArrowUpRight, ArrowDownLeft, Send, Search } from 'lucide-react';
import api from '../../services/api';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed';
  description: string;
  createdAt: string;
  user?: { name: string, email: string };
  recipient?: { name: string, email: string };
}

export const PaymentsPage: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // States for actions
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);
  const [amount, setAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/payments/transactions');
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionType || !amount || Number(amount) <= 0) return;

    setIsProcessing(true);
    try {
      let endpoint = `/payments/${actionType}`;
      let payload: any = { amount: Number(amount) };

      if (actionType === 'deposit') {
        payload.paymentMethod = 'Credit Card';
      } else if (actionType === 'withdraw') {
        payload.bankAccountInfo = 'Primary Checking Account ***123';
      } else if (actionType === 'transfer') {
        if (!recipientId) throw new Error('Recipient ID is required');
        payload.recipientId = recipientId;
      }

      await api.post(endpoint, payload);
      await fetchTransactions(); // Refresh
      setActionType(null);
      setAmount('');
      setRecipientId('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading wallet...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet & Payments</h1>
          <p className="text-gray-600">Manage your funds and review transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setActionType('deposit')} className="bg-primary-600 text-white">
            <ArrowDownLeft size={18} className="mr-2" />
            Deposit
          </Button>
          <Button onClick={() => setActionType('withdraw')} variant="outline">
            <ArrowUpRight size={18} className="mr-2" />
            Withdraw
          </Button>
          <Button onClick={() => setActionType('transfer')} variant="outline">
            <Send size={18} className="mr-2" />
            Transfer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance Card */}
        <Card className="bg-gradient-to-br from-primary-600 to-indigo-800 text-white md:col-span-1">
          <CardBody className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-md">Active</Badge>
            </div>
            <div className="mt-6">
              <p className="text-sm font-medium text-primary-100 uppercase tracking-wider">Total Balance</p>
              <h2 className="text-4xl font-bold mt-1">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
          </CardBody>
        </Card>

        {/* Action Form Card (Shows conditionally) */}
        {actionType && (
          <Card className="md:col-span-2 border-primary-200 shadow-lg shadow-primary-100/50">
            <CardHeader className="bg-primary-50 border-b border-primary-100">
              <h3 className="font-semibold text-primary-800 capitalize">{actionType} Funds</h3>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleTransaction} className="space-y-4">
                <Input
                  label="Amount (USD)"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
                
                {actionType === 'transfer' && (
                  <Input
                    label="Recipient ID"
                    type="text"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    placeholder="Enter User ID"
                    required
                  />
                )}
                
                {actionType === 'deposit' && (
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                    <p>Amount will be processed via Mock Stripe Payment Gateway.</p>
                  </div>
                )}
                {actionType === 'withdraw' && (
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                    <p>Funds will be credited to primary linked bank account.</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Confirm'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length > 0 ? transactions.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      t.type === 'deposit' ? 'bg-green-100 text-green-800' :
                      t.type === 'withdraw' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {t.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        t.status === 'Completed' ? 'bg-green-400' :
                        t.status === 'Pending' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <span className="text-sm text-gray-700">{t.status}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                    t.type === 'deposit' ? 'text-green-600' : 
                    t.type === 'withdraw' ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {t.type === 'deposit' ? '+' : t.type === 'withdraw' ? '-' : ''}${t.amount.toFixed(2)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No transactions found. Make a deposit to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
