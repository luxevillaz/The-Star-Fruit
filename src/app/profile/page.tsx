"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StayCard from "@/components/StayCard";
import { User, LogOut, Settings, Heart, CalendarDays, Home, MapPin, Calendar, CheckCircle2, AlertCircle, Clock, Users, UserCheck, Lock } from "lucide-react";
import { slugify } from "@/utils/seo";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"saved" | "account" | "bookings">("saved");
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [fetchingBookings, setFetchingBookings] = useState(false);

  // Handle tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'bookings') setActiveTab('bookings');
    else if (tab === 'account') setActiveTab('account');
    else if (tab === 'saved') setActiveTab('saved');
  }, [searchParams]);

  useEffect(() => {
    async function fetchUser() {
      if (!supabase) return;
      
      const { data: { session: curSession }, error } = await supabase.auth.getSession();
      
      if (error || !curSession) {
        router.push("/login?redirect=/profile"); // Redirect if not logged in
        return;
      }
      
      setSession(curSession);
      fetchSavedProperties(curSession.user.id);
      fetchBookings(curSession.user.id);
    }
    
    fetchUser();
  }, [router]);

  async function fetchBookings(userId: string) {
    if (!supabase) return;
    setFetchingBookings(true);
    try {
      const { data, error } = await supabase
        .from('property_enquiries')
        .select(`
          *,
          properties (
            listing_title,
            street_address,
            city,
            state,
            pincode,
            images,
            category
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setFetchingBookings(false);
    }
  }

  async function fetchSavedProperties(userId: string) {
    if (!supabase) return;
    try {
      // We join the properties table to get the actual property details
      const { data, error } = await supabase
        .from('saved_properties')
        .select(`
          id,
          properties!inner (
            id,
            slug,
            listing_title,
            city,
            state,
            category,
            bedrooms,
            images
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // If the table doesn't exist yet (SQL script not run), just fail gracefully
        console.error("Error fetching saved properties:", error.message);
        setSavedProperties([]);
      } else if (data) {
        // Extract properties from the join
        const mappedProperties = data
          .map((item: any) => item.properties)
          .filter(Boolean); // remove nulls just in case
        setSavedProperties(mappedProperties);
      }
    } catch (err) {
      console.error("Error fetching saved:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  const userFullName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "Guest";

  if (!session && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#EC5B13] animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-20 px-4 sm:px-6 md:px-10 max-w-[1400px] w-full mx-auto">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 w-full mt-4">
          
          {/* Sidebar / User Card */}
          <div className="w-full md:w-72 lg:w-80 shrink-0">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden sticky top-32">
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner mb-4">
                  <User size={40} className="text-gray-400" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 capitalize mb-1">{userFullName}</h1>
                <p className="text-sm font-semibold text-gray-500 mb-6">{session?.user?.email}</p>
                <div className="w-full h-px bg-gray-100 mb-6"></div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-600 hover:bg-red-50 py-3 rounded-xl transition-colors"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-grow">
            <h2 className="text-[32px] md:text-[40px] font-serif tracking-tight text-gray-900 mb-8">My Profile</h2>
            
            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-10 pb-2">
              <button 
                onClick={() => setActiveTab("saved")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  activeTab === "saved" 
                    ? "bg-black text-white shadow-md shadow-black/10" 
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Heart size={16} className={activeTab === "saved" ? "fill-white" : ""} /> Saved Properties
              </button>
              
              <button 
                onClick={() => setActiveTab("bookings")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  activeTab === "bookings" 
                    ? "bg-black text-white shadow-md shadow-black/10" 
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <CalendarDays size={16} /> My Bookings
              </button>

              <button 
                onClick={() => setActiveTab("account")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  activeTab === "account" 
                    ? "bg-black text-white shadow-md shadow-black/10" 
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Settings size={16} /> Account Settings
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <span className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#EC5B13] animate-spin"></span>
                </div>
              ) : (
                <>
                  {activeTab === "saved" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {savedProperties.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                          {savedProperties.map((prop) => (
                            <StayCard 
                              key={prop.id}
                              id={prop.id}
                              slug={prop.slug}
                              title={prop.listing_title}
                              location={`${prop.city || ""}${prop.state ? `, ${prop.state}` : ""}`}
                              category={prop.category || "Entire Home"}
                              bedrooms={prop.bedrooms}
                              image={prop.images?.[0] || "/images/stays/pool_villa.webp"}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
                          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
                          <h3 className="text-lg font-bold text-gray-900 mb-2">No saved properties yet</h3>
                          <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">Hit the heart icon on any property that catches your eye to save it here for later.</p>
                          <button 
                            onClick={() => router.push("/stays")}
                            className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
                          >
                            Explore Stays
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "bookings" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {fetchingBookings ? (
                        <div className="flex justify-center items-center h-48">
                          <span className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#EC5B13] animate-spin"></span>
                        </div>
                      ) : bookings.length > 0 ? (
                        <div className="flex flex-col gap-4">
                          {bookings.map((booking) => (
                            <div 
                              key={booking.id} 
                              onClick={() => router.push(`/stays/${slugify(booking.properties?.listing_title || "stay")}-${booking.property_id}`)}
                              className="bg-white border border-gray-100 rounded-[32px] p-4 md:p-6 flex flex-col md:flex-row gap-6 hover:shadow-xl hover:shadow-black/5 transition-all group cursor-pointer active:scale-[0.99]"
                            >
                              {/* Property Image */}
                              <div className="w-full md:w-48 h-32 md:h-32 relative rounded-2xl overflow-hidden shrink-0">
                                <img 
                                  src={booking.properties?.images?.[0] || "/images/stays/pool_villa.webp"} 
                                  alt={booking.properties?.listing_title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute top-3 left-3">
                                  <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-black">
                                    {booking.properties?.category || "Stay"}
                                  </span>
                                </div>
                              </div>

                              {/* Info */}
                              <div className="flex-grow flex flex-col justify-between py-1">
                                <div>
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                                    <div>
                                      <h4 className="text-lg font-black text-gray-900 leading-tight">
                                        {booking.properties?.listing_title}
                                      </h4>
                                      <p className="text-[13px] font-bold text-gray-500 flex items-start gap-2 mt-2 leading-relaxed">
                                        <MapPin size={16} className="text-[#EC5B13] shrink-0 mt-0.5" />
                                        <span>
                                          {booking.properties?.street_address && `${booking.properties.street_address}, `}
                                          {booking.properties?.city}, {booking.properties?.state}
                                          {booking.properties?.pincode && ` - ${booking.properties.pincode}`}
                                        </span>
                                      </p>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                      {booking.is_paid ? (
                                        <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                                          <CheckCircle2 size={14} /> Confirmed Booking
                                        </span>
                                      ) : (
                                        <span className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-amber-100">
                                          <Clock size={14} /> Enquiry Pending
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div className="flex items-center gap-2">
                                      <Calendar size={16} className="text-[#EC5B13]" />
                                      <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-in</p>
                                        <p className="text-sm font-bold text-gray-700">{new Date(booking.check_in).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar size={16} className="text-[#EC5B13]" />
                                      <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Checkout</p>
                                        <p className="text-sm font-bold text-gray-700">{new Date(booking.check_out).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users size={16} className="text-[#EC5B13]" />
                                      <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Guests</p>
                                        <p className="text-sm font-bold text-gray-700">{booking.guests} People</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Home size={16} className="text-[#EC5B13]" />
                                      <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inquiry Date</p>
                                        <p className="text-sm font-bold text-gray-700">{new Date(booking.created_at).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Chat Actions */}
                                  <div className="mt-8 pt-6 border-t border-gray-50 flex flex-wrap gap-4">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push('/messages?type=admin');
                                      }}
                                      className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                                    >
                                      <UserCheck size={16} className="text-orange-500" /> Chat with Admin
                                    </button>
                                    
                                    <button
                                      disabled={!booking.is_paid}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (booking.is_paid) router.push(`/messages?type=host&id=${booking.property_id}`);
                                      }}
                                      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                        booking.is_paid 
                                          ? "bg-blue-50 hover:bg-blue-100 text-blue-700 active:scale-95" 
                                          : "bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                                      }`}
                                    >
                                      {booking.is_paid ? (
                                        <>
                                          <Users size={16} className="text-blue-500" /> Chat with Host
                                        </>
                                      ) : (
                                        <>
                                          <Lock size={16} className="text-gray-400" /> Host Chat Locked
                                        </>
                                      )}
                                    </button>

                                    {!booking.is_paid && (
                                      <p className="w-full text-[10px] font-bold text-amber-500 flex items-center gap-1.5 mt-1 -mb-2">
                                        <AlertCircle size={12} /> Chat with host unlocks automatically after payment verification
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-24 bg-white border border-dashed border-gray-200 rounded-[40px]">
                          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CalendarDays size={40} className="text-gray-200" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings found</h3>
                          <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">Your property enquiries and confirmed bookings will appear here once you make them.</p>
                          <button 
                            onClick={() => router.push("/stays")}
                            className="bg-black text-white px-8 py-4 rounded-2xl font-bold text-sm hover:translate-y-[-2px] hover:shadow-lg transition-all active:scale-95"
                          >
                            Find your next stay
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "account" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-white border border-gray-100 rounded-3xl p-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Personal details</h3>
                      <div className="grid gap-6 max-w-2xl">
                        <div className="flex flex-col gap-2 border-b border-gray-100 pb-5">
                          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Full Name</span>
                          <span className="text-gray-900 font-medium capitalize">{userFullName}</span>
                        </div>
                        <div className="flex flex-col gap-2 pb-5">
                          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
                          <span className="text-gray-900 font-medium">{session?.user?.email}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#EC5B13] animate-spin"></span>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
