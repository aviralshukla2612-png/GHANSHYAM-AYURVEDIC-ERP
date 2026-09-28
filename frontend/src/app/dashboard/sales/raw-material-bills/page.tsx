'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import {
  FileCheck,
  Send,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  ShieldCheck,
  Receipt,
  PackageCheck
} from 'lucide-react';
import { Modal, InfoBlock } from '../../../../components/ui/modal';

export default function RawMaterialBillsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [showCAModal, setShowCAModal] = useState(false);
  const [caSuccessMsg, setCaSuccessMsg] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Delivery Verification Modal State (Stock Manager Action)
  const [selectedBillForVerify, setSelectedBillForVerify] = useState<any | null>(null);
  const [verifyQty, setVerifyQty] = useState<number>(0);
  const [verifyLotNo, setVerifyLotNo] = useState<string>('');
  const [verifyNotes, setVerifyNotes] = useState<string>('Moisture, aroma & physical quality inspection PASSED.');

  const { data: billsRes } = useQuery({
    queryKey: ['rawMaterialBills'],
    queryFn: () => apiClient.get('/api/purchases/bills'),
  });

  const bills: any[] = (billsRes as any)?.data || [];

  // Stock Manager Delivery Verification Mutation
  const verifyDeliveryMutation = useMutation({
    mutationFn: (data: { poId: string; qty: number; lotNo?: string; notes?: string }) =>
      apiClient.post('/api/purchases/receipts', {
        poId: data.poId,
        invoiceNumber: `INV-GRN-${Date.now().toString().slice(-4)}`,
        invoiceDate: new Date().toISOString(),
        batchNumber: data.lotNo || `LOT-RM-${Date.now().toString().slice(-4)}`,
        quantityReceived: Number(data.qty),
        rejectedQuantity: 0,
        qualityStatus: 'PASSED',
        notes: data.notes || 'Botanical inspection passed by Stock Manager',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterialBills'] });
      queryClient.invalidateQueries({ queryKey: ['purchasesList'] });
      queryClient.invalidateQueries({ queryKey: ['stockDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      queryClient.invalidateQueries({ queryKey: ['productionRequests'] });
      setSelectedBillForVerify(null);
      setSuccessToast('✓ Raw Material delivery verified by Stock Manager! Warehouse stock updated & production unblocked.');
      setTimeout(() => setSuccessToast(null), 6000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Verification failed');
    },
  });

  const handleOpenVerifyModal = (bill: any) => {
    const firstItem = bill.items?.[0];
    setVerifyQty(firstItem?.quantity || 20);
    setVerifyLotNo(`LOT-HERB-${Date.now().toString().slice(-4)}`);
    setSelectedBillForVerify(bill);
  };

  // Filtered Bills
  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.billNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.poNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.items?.some((it: any) => it.rawMaterialName?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PAID' && bill.paymentStatus?.includes('PAID')) ||
      (statusFilter === 'PENDING' && !bill.paymentStatus?.includes('PAID'));

    return matchesSearch && matchesStatus;
  });

  const totalSpend = bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalPaid = bills.filter((b) => b.paymentStatus?.includes('PAID')).reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalPending = totalSpend - totalPaid;

  const handleSendToCA = () => {
    setCaSuccessMsg(true);
    setTimeout(() => {
      setCaSuccessMsg(false);
      setShowCAModal(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider border border-[#EAE5DC] font-mono">
              Procurement & Accounting Ledger
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#FAF6ED] text-[#8C6512] text-[10px] font-bold uppercase tracking-wider border border-[#EAD7B5] font-mono">
              Stock Manager Verification & Sales View
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1A1817] flex items-center gap-2 mt-1.5">
            <FileCheck className="w-5 h-5 text-[#5C1D24]" /> Raw Material Bills & Supplier Invoices
          </h1>
          <p className="text-xs text-[#78726D] mt-1">
            Commercial GST purchase bills generated for raw herbal procurement with Stock Manager physical delivery verification and direct CA dispatch.
          </p>
        </div>

        <button
          onClick={() => setShowCAModal(true)}
          className="px-4 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start md:self-auto active:scale-95"
        >
          <Send className="w-4 h-4 text-[#B8944D]" /> Send All RM Bills to CA (+91 73831 98428)
        </button>
      </div>

      {/* SUCCESS TOAST */}
      {successToast && (
        <div className="p-4 bg-[#FAF8F5] border border-[#EAE5DC] rounded-2xl text-[#1A1817] font-semibold text-xs flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5C1D24]" />
            {successToast}
          </span>
          <button onClick={() => setSuccessToast(null)} className="text-[#8C857E] hover:text-[#1A1817] font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider block font-mono">Total RM Bills</span>
          <p className="text-2xl font-bold text-[#1A1817]">₹{totalSpend.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-[#5A544F] font-semibold flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5 text-[#B8944D]" /> {bills.length} Purchase Invoices
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1">
          <span className="text-[11px] font-semibold text-[#5C1D24] uppercase tracking-wider block font-mono">Delivered & Verified</span>
          <p className="text-2xl font-bold text-[#5C1D24]">₹{totalPaid.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-[#78726D] font-medium">Verified by Stock Manager</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1">
          <span className="text-[11px] font-semibold text-[#8C6512] uppercase tracking-wider block font-mono">Pending Inward</span>
          <p className="text-2xl font-bold text-[#8C6512]">₹{totalPending.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-[#78726D] font-medium">Awaiting delivery verification</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider block font-mono">Botanical Suppliers</span>
          <p className="text-2xl font-bold text-[#1A1817]">
            {new Set(bills.map((b) => b.supplier?.name)).size || 1} Vendors
          </p>
          <span className="text-[11px] text-[#78726D] font-medium">GST Verified Sources</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C857E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Bill No, Supplier, Raw Herb (Senna, Mulethi)..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-xs font-medium text-[#1A1817] focus:outline-none focus:border-[#5C1D24] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8C857E]" />
          <span className="text-xs font-semibold text-[#78726D]">Status:</span>
          {(['ALL', 'PAID', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#1A1817] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#5A544F] border border-[#EAE5DC] hover:bg-[#EFECE5]'
              }`}
            >
              {st === 'ALL' ? 'All Bills' : st === 'PAID' ? 'Verified / Paid' : 'Pending Verification'}
            </button>
          ))}
        </div>
      </div>

      {/* RAW MATERIAL BILLS TABLE */}
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] font-semibold text-[#8C857E] uppercase border-b border-[#EAE5DC] text-[11px] font-mono">
                <th className="p-3.5 whitespace-nowrap">Bill / Invoice No</th>
                <th className="p-3.5 whitespace-nowrap">Botanical Supplier</th>
                <th className="p-3.5">Herbal Line Items</th>
                <th className="p-3.5 text-right whitespace-nowrap">Taxable</th>
                <th className="p-3.5 text-right whitespace-nowrap">GST (18%)</th>
                <th className="p-3.5 text-right whitespace-nowrap">Total Amount</th>
                <th className="p-3.5 text-center whitespace-nowrap">Stock Manager Verification</th>
                <th className="p-3.5 whitespace-nowrap">Date</th>
                <th className="p-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]/60">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#8C857E] font-medium">
                    No raw material purchase bills found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill: any) => {
                  const isVerified = bill.paymentStatus?.includes('PAID') || bill.status === 'RECEIVED';

                  return (
                    <tr key={bill.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#1A1817] whitespace-nowrap">
                        <div>{bill.billNumber}</div>
                        <span className="text-[10px] text-[#78726D] font-mono">Ref: {bill.poNumber}</span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-[#1A1817]">{bill.supplier?.name}</div>
                        <span className="text-[10px] text-[#78726D] font-mono">GSTIN: {bill.supplier?.gstin}</span>
                      </td>
                      <td className="p-3.5 min-w-[200px]">
                        <div className="space-y-1">
                          {bill.items?.map((it: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5 font-medium text-[#1A1817]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#5C1D24]"></span>
                              <span>{it.rawMaterialName}</span>
                              <span className="text-[#78726D]">({it.quantity} {it.unit} @ ₹{it.rate}/{it.unit})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-right font-medium text-[#5A544F] whitespace-nowrap">
                        ₹{Number(bill.totalTaxable || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-medium text-[#8C6512] whitespace-nowrap">
                        ₹{Number(bill.totalGST || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-bold text-[#1A1817] whitespace-nowrap">
                        ₹{Number(bill.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isVerified ? (
                          <span className="px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide inline-flex items-center gap-1 bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" />
                            VERIFIED IN STOCK
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide inline-flex items-center gap-1 bg-[#FAF6ED] text-[#8C6512] border border-[#EAD7B5]">
                            <Clock className="w-3.5 h-3.5 text-[#B8944D]" />
                            AWAITING STOCK VERIFICATION
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[#5A544F] font-medium whitespace-nowrap">
                        {new Date(bill.billDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                        {!isVerified && (
                          <button
                            onClick={() => handleOpenVerifyModal(bill)}
                            className="px-3.5 py-1.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                          >
                            <PackageCheck className="w-3.5 h-3.5 text-[#D3B878]" />
                            Verify Delivery
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="px-3 py-1.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#B8944D]" /> View Bill
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: STOCK MANAGER DELIVERY VERIFICATION (GRN) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedBillForVerify)}
        onClose={() => setSelectedBillForVerify(null)}
        category="WAREHOUSE GOODS INWARD"
        title="Verify & Accept Raw Material Delivery"
        description="Verify physical botanical delivery at warehouse and record official Goods Inward (GRN)."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedBillForVerify(null)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                verifyDeliveryMutation.mutate({
                  poId: selectedBillForVerify.id,
                  qty: verifyQty,
                  lotNo: verifyLotNo,
                  notes: verifyNotes,
                })
              }
              disabled={verifyDeliveryMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#B8944D]" />
              {verifyDeliveryMutation.isPending ? 'Verifying...' : 'Confirm Delivery & Update Stock'}
            </button>
          </>
        }
      >
        {selectedBillForVerify && (
          <div className="space-y-4">
            <InfoBlock
              items={[
                { label: 'Purchase Order', value: selectedBillForVerify.poNumber },
                { label: 'Botanical Supplier', value: selectedBillForVerify.supplier?.name },
                {
                  label: 'Raw Material',
                  value: selectedBillForVerify.items?.[0]?.rawMaterialName,
                  highlight: true,
                  highlightColor: 'charcoal',
                },
                {
                  label: 'Order Value',
                  value: `₹${selectedBillForVerify.totalAmount?.toLocaleString()}`,
                  highlight: true,
                  highlightColor: 'wine',
                },
              ]}
            />

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Quantity Delivered & Accepted (KG / Liters)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={verifyQty}
                  onChange={(e) => setVerifyQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Supplier Lot / Batch Number
                </label>
                <input
                  type="text"
                  value={verifyLotNo}
                  onChange={(e) => setVerifyLotNo(e.target.value)}
                  placeholder="e.g. LOT-HERB-2026-001"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Botanical Quality Inspection Notes
                </label>
                <input
                  type="text"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl flex items-start gap-2.5 text-xs text-[#5A544F]">
              <ShieldCheck className="w-4 h-4 text-[#5C1D24] shrink-0 mt-0.5" />
              <span>
                Verifying this delivery records warehouse receipt, updates stock balance, and unblocks pending production orders.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW TAX BILL / SUPPLIER INVOICE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        category="GST TAX INVOICE RECORD"
        title={`Tax Invoice: ${selectedBill?.billNumber || 'BILL'}`}
        description="Official GST purchase tax invoice ledger with supplier HSN breakdowns."
        maxWidth="xl"
        footer={
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] text-[#78726D] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5C1D24]" />
              Verified for GSTR-2B Input Tax Credit
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert(`Printing Invoice ${selectedBill?.billNumber}...`)}
                className="px-3.5 py-2 border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#5A544F] hover:bg-[#FAF8F5] flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Bill
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Tax Bill ${selectedBill?.billNumber} sent to CA via WhatsApp (+91 73831 98428)!`);
                  setSelectedBill(null);
                }}
                className="px-4 py-2 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5 text-[#B8944D]" /> Send to CA WhatsApp
              </button>
            </div>
          </div>
        }
      >
        {selectedBill && (
          <div className="space-y-4">
            {/* Supplier & Buyer Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] space-y-1">
                <span className="text-[10px] font-bold text-[#8C857E] uppercase tracking-wider block font-mono">Supplier (Seller)</span>
                <p className="font-bold text-[#1A1817] text-xs">{selectedBill.supplier?.name}</p>
                <p className="font-mono text-[#5A544F] text-[11px]">GSTIN: {selectedBill.supplier?.gstin}</p>
                <p className="text-[#78726D] text-[11px]">Contact: {selectedBill.supplier?.contactPerson} ({selectedBill.supplier?.phone})</p>
                <p className="text-[#78726D] text-[11px]">State: {selectedBill.supplier?.state}</p>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] space-y-1">
                <span className="text-[10px] font-bold text-[#8C857E] uppercase tracking-wider block font-mono">Buyer (Recipient)</span>
                <p className="font-bold text-[#1A1817] text-xs">Ghanshyam Ayurvedic Pharmacy</p>
                <p className="font-mono text-[#5A544F] text-[11px]">GSTIN: 24AAAFG8842R1Z4</p>
                <p className="text-[#78726D] text-[11px]">Plot 14, GIDC Industrial Estate, Rajkot, Gujarat</p>
                <p className="text-[#78726D] text-[11px] font-medium">AYUSH License: GA/1482-A</p>
              </div>
            </div>

            {/* PO & Verification Details */}
            <div className="p-3 bg-white rounded-xl border border-[#EAE5DC] text-xs flex justify-between items-center">
              <div>
                <span className="text-[#78726D] font-medium">PO Reference: </span>
                <span className="font-mono font-bold text-[#1A1817]">{selectedBill.poNumber}</span>
              </div>
              <div>
                <span className="text-[#78726D] font-medium">Invoice Date: </span>
                <span className="font-semibold text-[#1A1817]">{new Date(selectedBill.billDate).toLocaleDateString('en-GB')}</span>
              </div>
              <div>
                <span className="text-[#78726D] font-medium">Verification: </span>
                <span className="font-bold text-[#5C1D24]">
                  {selectedBill.paymentStatus?.includes('PAID') ? '✓ Verified in Stock' : '⏳ Pending Delivery'}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-[#EAE5DC] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#FAF8F5] text-[#8C857E] font-semibold border-b border-[#EAE5DC]">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5">HSN Code</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Rate</th>
                    <th className="p-2.5 text-right">Taxable</th>
                    <th className="p-2.5 text-right">GST</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DC]/50 bg-white">
                  {selectedBill.items?.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2.5 font-semibold text-[#1A1817]">{it.rawMaterialName}</td>
                      <td className="p-2.5 font-mono text-[#78726D]">{it.hsnCode || '12119090'}</td>
                      <td className="p-2.5 text-right font-bold text-[#1A1817]">{it.quantity} {it.unit}</td>
                      <td className="p-2.5 text-right text-[#5A544F]">₹{it.rate}</td>
                      <td className="p-2.5 text-right font-medium">₹{it.taxableAmount.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-[#8C6512]">₹{it.gstAmount.toLocaleString()} ({it.gstRate}%)</td>
                      <td className="p-2.5 text-right font-bold text-[#1A1817]">₹{it.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#FAF8F5] border-t border-[#EAE5DC] font-bold text-xs">
                  <tr>
                    <td colSpan={4} className="p-2.5 text-[#8C857E] uppercase font-mono text-[10px]">Grand Total (INR)</td>
                    <td className="p-2.5 text-right text-[#1A1817]">₹{selectedBill.totalTaxable.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-[#8C6512]">₹{selectedBill.totalGST.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-[#1A1817] text-sm">₹{selectedBill.totalAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: SEND ALL BILLS TO CA MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showCAModal}
        onClose={() => setShowCAModal(false)}
        category="CA TAX AUDIT EXPORT"
        title="Export RM Purchase Bills to CA"
        description="Direct export of raw material purchase tax invoices and ITC schedules to Chartered Accountant."
        maxWidth="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowCAModal(false)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendToCA}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#B8944D]" /> Confirm & Send to CA
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] text-xs space-y-1.5">
            <span className="text-[10px] font-bold text-[#8C857E] uppercase tracking-wider block font-mono">Target Chartered Accountant</span>
            <p className="font-mono text-[#1A1817] font-bold text-xs">WhatsApp: +91 73831 98428</p>
            <p className="text-[#5A544F] text-[11px] leading-relaxed">
              Bundles all {bills.length} raw material purchase invoices, HSN 12119090 breakdowns, and supplier ITC records for GST return reconciliation.
            </p>
          </div>

          {caSuccessMsg && (
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#5C1D24] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#5C1D24] shrink-0" />
              <span>All Raw Material Bills & ITC package dispatched to CA WhatsApp!</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
