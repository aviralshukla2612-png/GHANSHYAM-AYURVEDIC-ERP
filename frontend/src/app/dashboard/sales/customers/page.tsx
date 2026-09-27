'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import { Users, Plus, Building, Phone, Mail, MapPin } from 'lucide-react';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerType, setCustomerType] = useState('B2B');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const { data: custRes } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiClient.get('/api/customers'),
  });

  const customers = (custRes as any)?.data || [];

  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowModal(false);
    },
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomerMutation.mutate({
      name,
      companyName,
      customerType,
      gstin,
      phone,
      email,
      billingAddress: address || 'Rajkot Industrial Zone',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-ayurveda-700" /> Customer Management Master
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            B2B, B2C, Distributors, Retailers, credit limits, outstanding balances, and GSTIN information.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-ayurveda-700 hover:bg-ayurveda-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {customers.map((c: any) => (
          <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                  {c.customerType}
                </span>
                <h3 className="text-base font-extrabold text-gray-900 mt-1">{c.name}</h3>
                <p className="text-xs text-gray-500">{c.companyName || 'Individual'}</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Active
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone}</div>
              {c.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {c.email}</div>}
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {c.city || 'Rajkot'}, {c.state || 'Gujarat'}</div>
              <div className="font-mono text-gray-500 pt-1">GSTIN: <span className="font-bold text-gray-800">{c.gstin || 'N/A'}</span></div>
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-xs">
              <span className="text-gray-500 font-semibold">Credit Limit: ₹{c.creditLimit?.toLocaleString('en-IN')}</span>
              <span className="font-bold text-ayurveda-900">Terms: {c.paymentTerms}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Customer */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Add New Customer</h3>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Customer / Contact Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Shree Traders"
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Shree Traders Pvt Ltd"
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Customer Type</label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    {['B2B', 'B2C', 'DISTRIBUTOR', 'RETAILER', 'WHOLESALER', 'INSTITUTION'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="24AAACG8899K1Z4"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98250 12345"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="orders@customer.com"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Billing Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="GIDC Sector 3, Rajkot"
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                  className="flex-1 py-2.5 bg-ayurveda-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  {createCustomerMutation.isPending ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
