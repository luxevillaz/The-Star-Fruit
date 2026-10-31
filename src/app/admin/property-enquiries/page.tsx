"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, Phone, Clock, Search, RefreshCcw, User, X, Calendar, Trash2, Home, CheckCircle2, AlertCircle, MessageSquare, CreditCard, Copy, ExternalLink } from "lucide-react";
import { logActivity } from "@/lib/logger";
import PropertyDetailsModal from "@/components/admin/PropertyDetailsModal";

interface PropertyEnquiry {
  id: string;
  user_id: string | null;
  property_id: string;
  full_name: string;
  email: string;
  phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  purpose: string;
  is_paid: boolean;
  status: string;
  created_at: string;
  properties?: {
    listing_title: string;
  };
}

export default function AdminPropertyEnquiries() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<PropertyEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<PropertyEnquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Property details modal state
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [isPropModalOpen, setIsPropModalOpen] = useState(false);
  const [fetchingProperty, setFetchingProperty] = useState(false);

  // Razorpay payment-link form state
  const [bookingAmount, setBookingAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"advance_20" | "advance_30" | "full" | "custom">("advance_20");
  const [customAmount, setCustomAmount] = useState("");
  const [creatingPaymentLink, setCreatingPaymentLink] = useState(false);
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState<string | null>(null);
  const [generatedPaymentAmount, setGeneratedPaymentAmount] = useState<number | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) throw new Error("Supabase is not configured.");

      // Confirm the signed-in user is an Admin before loading enquiry data.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session) {
        router.replace('/admin/login');
        return;
      }

      if (session.user.user_metadata?.role !== 'admin') {
        router.replace('/');
        return;
      }

      // Admin view: fetch enquiries across ALL properties, not only one host's listings.
      const { data, error: fetchError } = await supabase
        .from('property_enquiries')
        .select('*, properties(listing_title)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEnquiries(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [router]);

  const handleViewProperty = async (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    if (fetchingProperty) return;

    setFetchingProperty(true);
    try {
      if (!supabase) throw new Error("Supabase is not configured.");

      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (fetchError) throw fetchError;
      
      setSelectedProperty(data);
      setIsPropModalOpen(true);
    } catch (err: any) {
      alert("Error fetching property details: " + err.message);
    } finally {
      setFetchingProperty(false);
    }
  };

  const handleTogglePaid = async (e: React.MouseEvent, enquiry: PropertyEnquiry) => {
    e.stopPropagation();
    try {
      if (!supabase) return;

      const newPaidStatus = !enquiry.is_paid;
      const { error: updateError } = await supabase
        .from('property_enquiries')
        .update({ is_paid: newPaidStatus })
        .eq('id', enquiry.id);

      if (updateError) throw updateError;

      setEnquiries(current => current.map(enq =>
        enq.id === enquiry.id ? { ...enq, is_paid: newPaidStatus } : enq
      ));
      setSelectedEnquiry(current =>
        current?.id === enquiry.id ? { ...current, is_paid: newPaidStatus } : current
      );

      await logActivity("Toggled payment status for property enquiry", {
        enquiry_id: enquiry.id,
        new_status: newPaidStatus ? "PAID" : "UNPAID",
        guest: enquiry.full_name
      });
    } catch (err: any) {
      alert("Error updating payment status: " + err.message);
    }
  };

  const handleCreatePaymentLink = async () => {
    if (!supabase || !selectedEnquiry) return;

    const total = Number(bookingAmount);
    const custom = Number(customAmount);

    if (!Number.isFinite(total) || total <= 0) {
      alert("Please enter a valid total booking amount.");
      return;
    }

    if (paymentType === "custom" && (!Number.isFinite(custom) || custom <= 0 || custom > total)) {
      alert("Please enter a valid custom amount that does not exceed the total booking amount.");
      return;
    }

    setCreatingPaymentLink(true);
    setGeneratedPaymentLink(null);

    try {
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: {
          enquiry_id: selectedEnquiry.id,
          total_booking_amount: total,
          payment_type: paymentType,
          custom_amount: paymentType === "custom" ? custom : undefined,
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.payment_link) {
        throw new Error(data?.error || "Unable to create payment link.");
      }

      const paidAmount = Number(data.amount_paise) / 100;
      setGeneratedPaymentLink(data.payment_link);
      setGeneratedPaymentAmount(paidAmount);
      await logActivity("Created Razorpay payment link for property enquiry", {
        enquiry_id: selectedEnquiry.id,
        payment_link_id: data.payment_link_id,
        amount_paise: data.amount_paise,
        guest: selectedEnquiry.full_name,
      });
    } catch (err: any) {
      console.error("Payment link generation failed:", err);
      alert(err?.message || "Unable to create payment link. Please try again.");
    } finally {
      setCreatingPaymentLink(false);
    }
  };

  const handleCopyPaymentLink = async () => {
    if (!generatedPaymentLink) return;
    try {
      await navigator.clipboard.writeText(generatedPaymentLink);
      alert("Payment link copied.");
    } catch {
      alert("Could not copy automatically. Please copy the link manually.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this enquiry?")) return;

    try {
      if (!supabase) throw new Error("Supabase is not configured.");

      const { error } = await supabase
        .from('property_enquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEnquiries(enquiries.filter(enq => enq.id !== id));
      alert("Enquiry deleted successfully.");
    } catch (err: any) {
      alert("Error deleting enquiry: " + err.message);
    }
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const searchString = `${enq.full_name} ${enq.email} ${enq.properties?.listing_title || ""}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Property Enquiries</h2>
          <p className="text-gray-500 font-medium mt-1">View and manage enquiries across all property listings. Payment status changes here are manual admin updates.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EC5B13]/10 focus:border-[#EC5B13] transition-all"
            />
          </div>
          <button
            onClick={fetchEnquiries}
            className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#EC5B13] hover:border-[#EC5B13]/30 transition-all shadow-sm"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Guest & Property</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Inquired On</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stay Dates</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payment Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td className="px-8 py-6"><div className="h-12 bg-gray-100 rounded-xl w-64" /></td>
                  <td className="px-8 py-6"><div className="h-6 bg-gray-100 rounded-lg w-32" /></td>
                  <td className="px-8 py-6"><div className="h-6 bg-gray-100 rounded-lg w-40" /></td>
                  <td className="px-8 py-6"><div className="h-10 bg-gray-100 rounded-xl w-32" /></td>
                  <td className="px-8 py-6"><div className="h-10 bg-gray-100 rounded-xl w-20" /></td>
                </tr>
              ))
            ) : filteredEnquiries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium">
                  No property enquiries found.
                </td>
              </tr>
            ) : (
              filteredEnquiries.map((enquiry) => (
                <tr
                  key={enquiry.id}
                  className="hover:bg-gray-50/50 transition-all group cursor-pointer"
                  onClick={() => { setSelectedEnquiry(enquiry); setIsModalOpen(true); setGeneratedPaymentLink(null); setGeneratedPaymentAmount(null); setBookingAmount(""); setCustomAmount(""); setPaymentType("advance_20"); }}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#FFF0E8] flex items-center justify-center text-[#EC5B13] font-black text-xl">
                        {enquiry.full_name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{enquiry.full_name}</p>
                        <button 
                          onClick={(e) => handleViewProperty(e, enquiry.property_id)}
                          className="text-xs text-gray-400 hover:text-[#EC5B13] transition-colors flex items-center gap-1 group/prop"
                          title="View property details"
                        >
                          <Home size={12} className={fetchingProperty && selectedProperty?.id === enquiry.property_id ? "animate-spin" : "text-[#EC5B13]"} /> 
                          <span className="group-hover/prop:underline">
                            {fetchingProperty && selectedProperty?.id === enquiry.property_id ? "Loading..." : enquiry.properties?.listing_title}
                          </span>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                        <Clock size={14} className="text-[#EC5B13]" />
                        {new Date(enquiry.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-5 mt-0.5">
                        {new Date(enquiry.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <Calendar size={14} className="text-[#EC5B13]" />
                        {new Date(enquiry.check_in).toLocaleDateString()} - {new Date(enquiry.check_out).toLocaleDateString()}
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">{enquiry.guests} Guests</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button
                      onClick={(e) => handleTogglePaid(e, enquiry)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${enquiry.is_paid
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100"
                        }`}
                    >
                      {enquiry.is_paid ? (
                        <><CheckCircle2 size={14} /> Payment Received</>
                      ) : (
                        <><AlertCircle size={14} /> Mark as Paid</>
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (enquiry.user_id) {
                            router.push(`/admin/messages?userId=${enquiry.user_id}`);
                          } else {
                            alert("This enquiry is not linked to a registered user account.");
                          }
                        }}
                        className={`p-2 bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all border border-gray-100 ${!enquiry.user_id ? "opacity-50" : ""}`}
                        title="Chat with traveler"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, enquiry.id)}
                        className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-gray-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] sm:rounded-[32px] w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="shrink-0 p-5 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#EC5B13] font-black text-2xl border border-gray-100">
                  {selectedEnquiry.full_name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">{selectedEnquiry.full_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-blue-500 flex items-center gap-1.5">
                      <Mail size={12} /> {selectedEnquiry.email}
                    </span>
                    {selectedEnquiry.phone && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                        <span className="text-gray-300 mr-1">•</span>
                        <Phone size={12} /> {selectedEnquiry.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200/50 rounded-xl transition-colors text-gray-400">
                <X size={24} />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-8 space-y-6">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                <Clock className="text-[#EC5B13]" size={20} />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Enquiry Date & Time</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(selectedEnquiry.created_at).toLocaleString(undefined, {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-in</p>
                  <p className="font-bold text-gray-900">{new Date(selectedEnquiry.check_in).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Checkout</p>
                  <p className="font-bold text-gray-900">{new Date(selectedEnquiry.check_out).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Home size={16} className="text-[#EC5B13]" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enquiry for Property</span>
                </div>
                <h4 className="text-lg font-black text-gray-900 mb-1">{selectedEnquiry.properties?.listing_title}</h4>
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Purpose</p>
                    <p className="font-bold text-gray-700">{selectedEnquiry.purpose || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Guests</p>
                    <p className="font-bold text-gray-700">{selectedEnquiry.guests} people</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF0E8]/30 border border-[#EC5B13]/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedEnquiry.is_paid ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {selectedEnquiry.is_paid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900">Payment Status</p>
                    <p className={`text-xs font-bold ${selectedEnquiry.is_paid ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedEnquiry.is_paid ? 'Money Received - Host Unlocked' : 'Awaiting Payment - Host Locked'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleTogglePaid(e, selectedEnquiry)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${selectedEnquiry.is_paid
                      ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      : "bg-[#EC5B13] text-white hover:bg-[#d44f0f] shadow-lg shadow-[#EC5B13]/20"
                    }`}
                >
                  {selectedEnquiry.is_paid ? "Mark Unpaid" : "Verify Payment"}
                </button>
              </div>

              {/* Razorpay Payment Link Generator */}
              <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-[#EC5B13]" />
                  <h4 className="font-black text-gray-900">Generate Razorpay Payment Link</h4>
                </div>
                <p className="text-xs text-gray-500">Enter the agreed total booking amount. The payment link will be created in the currently configured Razorpay mode.</p>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Total Booking Amount (INR)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={bookingAmount}
                    onChange={(e) => { setBookingAmount(e.target.value); setGeneratedPaymentLink(null); }}
                    placeholder="e.g. 50000"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#EC5B13] focus:ring-2 focus:ring-[#EC5B13]/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Payment Type</label>
                  <select
                    value={paymentType}
                    onChange={(e) => { setPaymentType(e.target.value as "advance_20" | "advance_30" | "full" | "custom"); setGeneratedPaymentLink(null); }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#EC5B13]"
                  >
                    <option value="advance_20">20% Advance</option>
                    <option value="advance_30">30% Advance</option>
                    <option value="full">Full Payment</option>
                    <option value="custom">Custom Amount</option>
                  </select>
                </div>

                {paymentType === "custom" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Custom Payment Amount (INR)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setGeneratedPaymentLink(null); }}
                      placeholder="Enter custom amount"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#EC5B13] focus:ring-2 focus:ring-[#EC5B13]/10"
                    />
                  </div>
                )}

                {bookingAmount && Number(bookingAmount) > 0 && (
                  <div className="rounded-xl bg-gray-50 p-3 text-sm flex items-center justify-between">
                    <span className="text-gray-500">Payment amount</span>
                    <strong className="text-gray-900">
                      ₹{(paymentType === "advance_20" ? Number(bookingAmount) * 0.2 : paymentType === "advance_30" ? Number(bookingAmount) * 0.3 : paymentType === "full" ? Number(bookingAmount) : Number(customAmount || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCreatePaymentLink}
                  disabled={creatingPaymentLink || !bookingAmount || Number(bookingAmount) <= 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#EC5B13] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-[#d44f0f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CreditCard size={16} />
                  {creatingPaymentLink ? "Creating Payment Link..." : "Generate Payment Link"}
                </button>

                {generatedPaymentLink && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-emerald-800">Payment link created</p>
                        <p className="text-xs text-emerald-700">Amount: ₹{(generatedPaymentAmount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                      </div>
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    </div>
                    <input readOnly value={generatedPaymentLink} className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-gray-700" />
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={handleCopyPaymentLink} className="inline-flex items-center gap-2 rounded-lg bg-white border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
                        <Copy size={14} /> Copy Link
                      </button>
                      <a href={generatedPaymentLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
                        <ExternalLink size={14} /> Open Link
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailsModal 
          property={selectedProperty}
          isOpen={isPropModalOpen}
          onClose={() => setIsPropModalOpen(false)}
        />
      )}
    </div>
  );
}
