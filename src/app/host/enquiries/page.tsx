
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  Phone,
  Search,
  RefreshCcw,
  X,
  Calendar,
  Lock,
  Unlock,
  MessageSquare,
  AlertCircle,
  CreditCard,
  Copy,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PropertyEnquiry {
  id: string;
  user_id: string | null;
  property_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  purpose: string;
  is_paid: boolean;
  status: string;
  created_at: string;
  properties?: {
    listing_title: string;
    host_id?: string;
  };
}

type PaymentType = "advance_20" | "advance_30" | "full" | "custom";

export default function HostPropertyEnquiries() {
  const router = useRouter();

  const [enquiries, setEnquiries] = useState<PropertyEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] =
    useState<PropertyEnquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Payment states
  const [bookingAmount, setBookingAmount] = useState("");
  const [paymentType, setPaymentType] =
    useState<PaymentType>("advance_30");
  const [customAmount, setCustomAmount] = useState("");
  const [generatingPayment, setGeneratingPayment] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchEnquiries = async () => {
    setLoading(true);

    try {
      if (!supabase) throw new Error("Supabase is not configured.");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth");
        return;
      }

      const user = session.user;

      const { data, error: fetchError } = await supabase
        .from("property_enquiries")
        .select("*, properties!inner(listing_title, host_id)")
        .eq("properties.host_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setEnquiries(data || []);
    } catch (err: unknown) {
      console.error(
        err instanceof Error ? err.message : "Unable to fetch enquiries."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const maskEmail = (email: string) => {
    if (!email) return "Not available";
    const [name, domain] = email.split("@");
    if (!domain) return "***";
    return `${name[0]}***@${domain}`;
  };

  const maskPhone = (phone: string | null) => {
    if (!phone) return "Not available";
    return `${phone.slice(0, 3)}*******`;
  };

  const resetPaymentForm = () => {
    setBookingAmount("");
    setPaymentType("advance_30");
    setCustomAmount("");
    setPaymentLink("");
    setPaymentMessage("");
    setPaymentError("");
    setCopied(false);
  };

  const openEnquiry = (enquiry: PropertyEnquiry) => {
    setSelectedEnquiry(enquiry);
    resetPaymentForm();
    setIsModalOpen(true);
  };

  const calculatePaymentAmount = () => {
    const total = Number(bookingAmount);

    if (!Number.isFinite(total) || total <= 0) return 0;

    if (paymentType === "advance_20") return total * 0.2;
    if (paymentType === "advance_30") return total * 0.3;
    if (paymentType === "full") return total;
    if (paymentType === "custom") return Number(customAmount);

    return 0;
  };

  const generatePaymentLink = async () => {
    if (!supabase || !selectedEnquiry) return;

    setPaymentError("");
    setPaymentMessage("");
    setPaymentLink("");

    const total = Number(bookingAmount);
    const payable = calculatePaymentAmount();

    if (!Number.isFinite(total) || total <= 0) {
      setPaymentError("Please enter a valid total booking amount.");
      return;
    }

    if (!Number.isFinite(payable) || payable < 1) {
      setPaymentError("Payment amount must be at least ₹1.");
      return;
    }

    if (payable > total) {
      setPaymentError(
        "Payment amount cannot exceed the total booking amount."
      );
      return;
    }

    setGeneratingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            enquiry_id: selectedEnquiry.id,
            total_booking_amount: total,
            payment_type: paymentType,
            custom_amount:
              paymentType === "custom" ? Number(customAmount) : undefined,
          },
        }
      );

      if (error) {
        let message = error.message || "Unable to generate payment link.";

        try {
          const response = await error.context?.json();
          if (response?.error) message = response.error;
        } catch {
          // Keep the original error message.
        }

        throw new Error(message);
      }

      if (!data?.success || !data?.payment_link) {
        throw new Error(data?.error || "Payment link was not generated.");
      }

      setPaymentLink(data.payment_link);
      setPaymentMessage("Payment link generated successfully.");
    } catch (err: unknown) {
      console.error("Payment link error:", err);

      setPaymentError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the payment link."
      );
    } finally {
      setGeneratingPayment(false);
    }
  };

  const copyPaymentLink = async () => {
    if (!paymentLink) return;

    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setPaymentError("Unable to copy link. Please copy it manually.");
    }
  };

  const filteredEnquiries = enquiries.filter((enq) => {
    const searchString =
      `${enq.full_name} ${enq.properties?.listing_title || ""}`.toLowerCase();

    return searchString.includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A24] tracking-tight">
            Stay Enquiries
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage all booking requests for your properties.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by name or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EC5B13]/10 focus:border-[#EC5B13] transition-all"
            />
          </div>

          <button
            onClick={fetchEnquiries}
            className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-[#EC5B13] transition-all shadow-sm"
            title="Refresh enquiries"
          >
            <RefreshCcw
              size={20}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 font-bold text-[11px] text-gray-400 uppercase tracking-widest">
              <th className="px-8 py-6">Guest Info</th>
              <th className="px-8 py-6">Property</th>
              <th className="px-8 py-6">Stay Duration</th>
              <th className="px-8 py-6">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-8 py-6">
                    <div className="h-10 bg-gray-100 rounded-lg w-40" />
                  </td>
                  <td className="px-8 py-6">
                    <div className="h-6 bg-gray-100 rounded-lg w-48" />
                  </td>
                  <td className="px-8 py-6">
                    <div className="h-6 bg-gray-100 rounded-lg w-32" />
                  </td>
                  <td className="px-8 py-6">
                    <div className="h-8 bg-gray-100 rounded-xl w-24" />
                  </td>
                </tr>
              ))
            ) : filteredEnquiries.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-8 py-20 text-center text-gray-400 font-medium"
                >
                  No enquiries found for your properties yet.
                </td>
              </tr>
            ) : (
              filteredEnquiries.map((enquiry) => (
                <tr
                  key={enquiry.id}
                  className="hover:bg-gray-50/50 transition-all group cursor-pointer"
                  onClick={() => openEnquiry(enquiry)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1A1A24] flex items-center justify-center text-white font-bold">
                        {enquiry.full_name?.[0]?.toUpperCase() || "G"}
                      </div>

                      <div>
                        <p className="font-black text-[#1A1A24]">
                          {enquiry.full_name}
                        </p>
                        <p className="text-xs text-gray-400 font-bold">
                          {enquiry.is_paid
                            ? enquiry.email
                            : maskEmail(enquiry.email)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-6 font-bold text-[#1A1A24]">
                    {enquiry.properties?.listing_title}
                  </td>

                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-600">
                      {new Date(enquiry.check_in).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" }
                      )}{" "}
                      -{" "}
                      {new Date(enquiry.check_out).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" }
                      )}
                    </p>
                    <p className="text-[10px] font-black text-gray-400 uppercase mt-0.5">
                      {enquiry.guests} Guests
                    </p>
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex items-center justify-between gap-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          enquiry.is_paid
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {enquiry.is_paid ? (
                          <Unlock size={10} />
                        ) : (
                          <Lock size={10} />
                        )}
                        {enquiry.is_paid
                          ? "Details Unlocked"
                          : "Awaiting Paid"}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/host/messages?userId=${enquiry.user_id || ""}&propertyId=${enquiry.property_id}`
                          );
                        }}
                        className="p-2 bg-gray-50 text-gray-400 hover:text-[#EC5B13] hover:bg-[#FFF0E8] rounded-xl transition-all border border-gray-100"
                        title="Chat with guest"
                      >
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Enquiry Detail Modal */}
      {isModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1A1A24] text-white flex items-center justify-center font-black text-2xl">
                  {selectedEnquiry.full_name?.[0]?.toUpperCase() || "G"}
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#1A1A24]">
                    {selectedEnquiry.full_name}
                  </h3>
                  <p className="text-xs text-gray-500 font-bold">
                    Inquiry for {selectedEnquiry.properties?.listing_title}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-7">
              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Guest Contact Details
                  </h4>

                  {!selectedEnquiry.is_paid && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase">
                      <Lock size={10} /> Locked until payment
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-2xl border ${
                      selectedEnquiry.is_paid
                        ? "bg-white border-emerald-100"
                        : "bg-gray-50/50 border-gray-100 opacity-60"
                    }`}
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1.5">
                      <Mail size={12} /> Email Address
                    </p>
                    <p className="text-sm font-bold text-[#1A1A24] break-all">
                      {selectedEnquiry.is_paid
                        ? selectedEnquiry.email
                        : maskEmail(selectedEnquiry.email)}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      selectedEnquiry.is_paid
                        ? "bg-white border-emerald-100"
                        : "bg-gray-50/50 border-gray-100 opacity-60"
                    }`}
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1.5">
                      <Phone size={12} /> Phone Number
                    </p>
                    <p className="text-sm font-bold text-[#1A1A24]">
                      {selectedEnquiry.is_paid
                        ? selectedEnquiry.phone || "Not available"
                        : maskPhone(selectedEnquiry.phone)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stay Details */}
              <div className="bg-gray-50 rounded-[28px] p-6 border border-gray-100">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={14} className="text-[#EC5B13]" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Arrival
                      </span>
                    </div>
                    <p className="text-lg font-black text-[#1A1A24]">
                      {new Date(
                        selectedEnquiry.check_in
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={14} className="text-[#EC5B13]" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Departure
                      </span>
                    </div>
                    <p className="text-lg font-black text-[#1A1A24]">
                      {new Date(
                        selectedEnquiry.check_out
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                      Guests
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                      {selectedEnquiry.guests} People
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                      Purpose of Stay
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                      {selectedEnquiry.purpose || "Vacation/Other"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Link Generator */}
              {!selectedEnquiry.is_paid && (
                <div className="border border-orange-100 rounded-[28px] p-5 md:p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#FFF0E8] text-[#EC5B13] flex items-center justify-center">
                      <CreditCard size={22} />
                    </div>

                    <div>
                      <h4 className="font-black text-[#1A1A24]">
                        Generate Payment Link
                      </h4>
                      <p className="text-xs text-gray-500">
                        Create a Razorpay booking payment link.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">
                      Total Booking Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Enter total booking amount"
                      value={bookingAmount}
                      onChange={(e) => setBookingAmount(e.target.value)}
                      disabled={generatingPayment}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#EC5B13] focus:ring-2 focus:ring-[#EC5B13]/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">
                      Payment Type
                    </label>

                    <select
                      value={paymentType}
                      onChange={(e) =>
                        setPaymentType(e.target.value as PaymentType)
                      }
                      disabled={generatingPayment}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold bg-white focus:outline-none focus:border-[#EC5B13]"
                    >
                      <option value="advance_20">20% Advance</option>
                      <option value="advance_30">30% Advance</option>
                      <option value="full">Full Payment (100%)</option>
                      <option value="custom">Custom Amount</option>
                    </select>
                  </div>

                  {paymentType === "custom" && (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">
                        Custom Payment Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Enter custom amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        disabled={generatingPayment}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#EC5B13]"
                      />
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-gray-500">
                      Amount to Collect
                    </span>
                    <span className="text-xl font-black text-[#1A1A24]">
                      ₹
                      {calculatePaymentAmount().toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {paymentError && (
                    <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 flex gap-2 items-start">
                      <AlertCircle size={17} className="shrink-0 mt-0.5" />
                      <p className="text-xs font-bold">{paymentError}</p>
                    </div>
                  )}

                  {paymentMessage && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-3 flex gap-2 items-center">
                      <CheckCircle size={17} className="shrink-0" />
                      <p className="text-xs font-bold">{paymentMessage}</p>
                    </div>
                  )}

                  {paymentLink ? (
                    <div className="space-y-3">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <p className="text-xs font-bold text-emerald-700 mb-2">
                          Razorpay Payment Link
                        </p>
                        <p className="text-sm text-emerald-800 break-all font-medium">
                          {paymentLink}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={copyPaymentLink}
                          className="py-3 bg-[#1A1A24] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all"
                        >
                          {copied ? (
                            <CheckCircle size={17} />
                          ) : (
                            <Copy size={17} />
                          )}
                          {copied ? "Copied" : "Copy Link"}
                        </button>

                        <a
                          href={paymentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-3 bg-[#FFF0E8] text-[#EC5B13] rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-100 transition-all"
                        >
                          <ExternalLink size={17} />
                          Open Link
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={generatePaymentLink}
                      disabled={generatingPayment}
                      className="w-full py-4 bg-[#EC5B13] text-white rounded-xl font-black text-sm shadow-lg shadow-[#EC5B13]/20 hover:bg-[#D44D0F] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {generatingPayment ? (
                        <>
                          <RefreshCcw size={18} className="animate-spin" />
                          Generating Payment Link...
                        </>
                      ) : (
                        <>
                          <CreditCard size={18} />
                          Generate Payment Link
                        </>
                      )}
                    </button>
                  )}

                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Payment links are currently configured with Razorpay Test
                    Mode credentials. Do not share test links with real
                    customers.
                  </p>
                </div>
              )}

              {selectedEnquiry.is_paid && (
                <div className="bg-emerald-50 rounded-2xl p-4 flex items-start gap-3 border border-emerald-100">
                  <CheckCircle
                    size={20}
                    className="text-emerald-600 shrink-0 mt-0.5"
                  />
                  <p className="text-xs font-bold text-emerald-700">
                    This enquiry is marked as paid. Guest contact details are
                    unlocked.
                  </p>
                </div>
              )}

              {!selectedEnquiry.is_paid && (
                <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-3 border border-amber-100">
                  <AlertCircle
                    size={20}
                    className="text-amber-500 shrink-0 mt-0.5"
                  />
                  <p className="text-xs font-bold text-amber-700 leading-relaxed">
                    Contact details are hidden to protect privacy before
                    payment. They will be revealed after payment is verified
                    and the enquiry is marked as paid.
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    router.push(
                      `/host/messages?userId=${selectedEnquiry.user_id || ""}&propertyId=${selectedEnquiry.property_id}`
                    );
                  }}
                  className="flex-1 py-4 bg-[#EC5B13] text-white rounded-2xl font-black text-base shadow-lg shadow-[#EC5B13]/20 hover:bg-[#D44D0F] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <MessageSquare size={20} />
                  Chat with Guest
                </button>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-base hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
