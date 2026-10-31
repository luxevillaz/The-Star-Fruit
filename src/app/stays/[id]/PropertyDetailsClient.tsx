"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star, MapPin, Share, Heart, Users, BedDouble, Bath,
  ChevronRight, CheckCircle2, ShieldCheck, Calendar,
  Wifi, UtensilsCrossed, Wind, Tv2, Waves, Umbrella,
  ChefHat, Dumbbell, Flame, Loader2, ArrowLeft, User,
  X, ChevronLeft, Monitor, Sparkles, Coffee, Car,
  Shield, Thermometer, Laptop, Briefcase, Zap,
  Sun, Moon, Accessibility, ParkingCircle,
  HeartPulse, BellElectric, Trophy, WashingMachine,
  Refrigerator, Microwave, Shovel, Trees, Home, Music,
  UserCheck, Baby, Ghost, Layout, Smartphone, Book,
  Gamepad2, GraduationCap, Beer, Wine, CupSoda, Shirt,
  DoorOpen, Lock, Fan, Speaker, CalendarDays, Boxes,
  ShowerHead, Soup, AlertCircle, ConciergeBell, Sprout, Bed,
  Download
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { slugify } from "@/utils/seo";
import CustomDatePicker from "@/components/CustomDatePicker";
import Footer from "@/components/Footer";
import ReviewForm from "@/components/ReviewForm";
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { getTrackingSettings } from "@/lib/tracking-settings";
import { generateBrochure } from "@/utils/generateBrochure";
import { formatPropertyTitle } from "@/utils/formatPropertyTitle";

export interface Property {
  id: string;
  listing_title: string;
  listing_description?: string;
  street_address?: string;
  city: string;
  state: string;
  pincode?: string;
  category: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  beds: number;
  images: string[];
  description: string;
  host_name?: string;
  host_description?: string;
  amenities?: string[];
  house_rules?: Record<string, boolean>;
  custom_rules?: string[];
  latitude?: number;
  longitude?: number;
  ls_id?: string;
}

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// DEMO/TEST REVIEWS ONLY
// These are intentionally labeled as demo data and should not be presented as real guest reviews.
const DEMO_REVIEWS: Review[] = [
  {
    id: "demo-review-1",
    user_name: "Rahul Mehta",
    rating: 5,
    comment: "Beautiful villa with spacious rooms and a very comfortable stay. Great property for a relaxing Goa trip.",
    created_at: "2026-08-20T10:00:00Z",
  },
  {
    id: "demo-review-2",
    user_name: "Priya Nair",
    rating: 5,
    comment: "Amazing property and lovely ambience. The villa was clean, peaceful and perfect for our family stay.",
    created_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "demo-review-3",
    user_name: "Arjun Malhotra",
    rating: 4,
    comment: "Really nice villa with good interiors and a great overall experience. We enjoyed our stay.",
    created_at: "2026-08-10T10:00:00Z",
  },
  {
    id: "demo-review-4",
    user_name: "Neha Kapoor",
    rating: 5,
    comment: "Very comfortable property with plenty of space. The location was convenient and the stay was enjoyable.",
    created_at: "2026-08-05T10:00:00Z",
  },
  {
    id: "demo-review-5",
    user_name: "Amit Verma",
    rating: 4,
    comment: "Lovely place for a group trip. The rooms were comfortable and the property had everything we needed.",
    created_at: "2026-07-28T10:00:00Z",
  },
  {
    id: "demo-review-6",
    user_name: "Kavya Sharma",
    rating: 5,
    comment: "Fantastic stay for testing the property experience. Spacious, comfortable and nicely maintained.",
    created_at: "2026-07-20T10:00:00Z",
  },
];


const AMENITY_ICONS: Record<string, any> = {
  // Essentials
  wifi: <Wifi size={18} />,
  ac: <Wind size={18} />,
  tv: <Tv2 size={18} />,
  workspace: <Monitor size={18} />,
  washer: <WashingMachine size={18} />,
  dryer: <Wind size={18} />,
  ethernet: <Zap size={18} />,
  housekeeping: <UserCheck size={18} />,

  // Luxury
  private_pool: <Waves size={18} />,
  hot_tub: <Bath size={18} />,
  beachfront: <Umbrella size={18} />,
  private_chef: <ChefHat size={18} />,
  private_gym: <Dumbbell size={18} />,
  gym: <Dumbbell size={18} />,
  bbq_grill: <Flame size={18} />,
  sound_system: <Music size={18} />,
  game_console: <Gamepad2 size={18} />,
  barbecue: <Flame size={18} />,
  shared_pool: <Waves size={18} />,
  chef_on_request: <ChefHat size={18} />,
  room_service: <ConciergeBell size={18} />,
  massage: <Sprout size={18} />,

  // Bathroom & Bedroom
  hair_dryer: <Wind size={18} />,
  shampoo: <CupSoda size={18} />,
  hot_water: <Thermometer size={18} />,
  hangers: <Shirt size={18} />,
  iron: <Shirt size={18} />,
  safe: <Lock size={18} />,
  bed_linens: <Home size={18} />,
  mosquito_net: <Shield size={18} />,
  shower_head: <ShowerHead size={18} />,
  towels: <Home size={18} />,
  extra_pillows: <Bed size={18} />,
  darkening_blinds: <Moon size={18} />,

  // Kitchen & Dining
  kitchen: <UtensilsCrossed size={18} />,
  refrigerator: <Refrigerator size={18} />,
  microwave: <Microwave size={18} />,
  coffee_maker: <Coffee size={18} />,
  kettle: <Coffee size={18} />,
  cooking_basics: <UtensilsCrossed size={18} />,
  dishwasher: <WashingMachine size={18} />,
  stove: <Layout size={18} />,
  wine_glasses: <Wine size={18} />,
  dining_table: <Layout size={18} />,

  // Family & Fun
  crib: <Baby size={18} />,
  high_chair: <Baby size={18} />,
  board_games: <Ghost size={18} />,
  books: <Book size={18} />,
  pool_table: <Monitor size={18} />,

  // Parking & Facilities
  free_parking: <Car size={18} />,
  parking: <Car size={18} />,
  ev_charger: <Zap size={18} />,
  garden: <Trees size={18} />,
  elevator: <Home size={18} />,
  single_level: <Home size={18} />,

  // Outdoor
  patio: <Layout size={18} />,
  backyard: <Trees size={18} />,
  entrance: <Home size={18} />,
  outdoor_dining: <UtensilsCrossed size={18} />,
  hammock: <Umbrella size={18} />,
  terrace: <Layout size={18} />,
  sun_deck: <Sun size={18} />,

  // Safety & Services
  first_aid: <HeartPulse size={18} />,
  extinguisher: <Flame size={18} />,
  smoke_alarm: <BellElectric size={18} />,
  carbon_alarm: <BellElectric size={18} />,
  security_cam: <Shield size={18} />,
  luggage_drop: <Briefcase size={18} />,
  long_term: <CalendarDays size={18} />,

  // Fallbacks/Extras
  breakfast: <Coffee size={18} />,
  laptop_friendly: <Laptop size={18} />,
  office: <Briefcase size={18} />,
  essentials: <CheckCircle2 size={18} />,
};

export default function PropertyDetailsClient({ initialProperty }: { initialProperty: Property }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['places'] as any
  });
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const match = rawId.match(uuidRegex);
  const id = match ? match[0] : rawId;
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(initialProperty);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  const scrollToMap = () => {
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDownloadBrochure = async () => {
    if (!property) return;
    setIsGeneratingPdf(true);
    setPdfProgress(0);
    try {
      const pageUrl = window.location.href;
      await generateBrochure({
        property,
        pageUrl,
        onProgress: (p) => setPdfProgress(p),
      });
    } catch (err) {
      console.error("Error generating brochure PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(0);
    }
  };

  const hasParking = property?.amenities?.some(a => {
    const normalized = a.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ');
    return normalized.includes('parking') || normalized.includes('free parking');
  });

  const allowsSmoking = property?.house_rules?.smoking === true || property?.amenities?.some(a => {
    const normalized = a.toLowerCase().replace(/_/g, ' ');
    return normalized.includes('smoking allowed') || normalized.includes('smoking');
  });

  const allowsPets = property?.house_rules?.pets === true ||
    property?.house_rules?.pets_allowed === true ||
    property?.house_rules?.no_pets === false ||
    property?.amenities?.some(a => {
      const normalized = a.toLowerCase().replace(/_/g, ' ');
      return normalized.includes('pets allowed') || normalized.includes('pet friendly') || normalized.includes('pets welcome');
    }) || false;

  const formattedAmenities = property?.amenities && property.amenities.length > 0
    ? property.amenities.slice(0, 8).map(a => a.replace(/_/g, ' ')).join(', ') + (property.amenities.length > 8 ? ', and more' : '')
    : 'essential luxury facilities';

  const faqList = property ? [
    {
      question: `Where is ${property.listing_title} located?`,
      answer: `${property.listing_title} is located in ${property.street_address ? property.street_address + ', ' : ''}${property.city}, ${property.state}, India. Guests can enjoy easy access to popular attractions, restaurants, shopping areas, and local experiences nearby.`
    },
    {
      question: `What amenities are available at ${property.listing_title}?`,
      answer: `${property.listing_title} offers amenities such as ${formattedAmenities}, ensuring a comfortable and memorable stay for all guests.`
    },
    {
      question: `Is parking available at ${property.listing_title}?`,
      answer: hasParking
        ? `Yes, parking is available at ${property.listing_title}. Guests can conveniently park their vehicles during their stay. Parking availability may be subject to the property's guidelines and capacity.`
        : `No, parking is not available at ${property.listing_title}. Guests are advised to use nearby public parking facilities or alternative transportation options during their stay.`
    },
    {
      question: `Is smoking allowed at ${property.listing_title}?`,
      answer: allowsSmoking
        ? `Yes, smoking is allowed at ${property.listing_title}. Guests are requested to smoke only in designated smoking areas and follow the property's guidelines to ensure a comfortable environment for all guests.`
        : `No, smoking is not allowed at ${property.listing_title}. Smoking inside the property is strictly prohibited to maintain a clean and comfortable environment for all guests. Additional charges may apply for violations of this policy.`
    },
    {
      question: `How far is ${property.listing_title} from major attractions?`,
      answer: `${property.listing_title} is conveniently located near popular attractions in ${property.city}, making it an ideal choice for travelers.`
    },
    {
      question: `What is the cancellation policy for ${property.listing_title}?`,
      answer: `The cancellation policy varies based on the booking plan selected. Please review the cancellation terms before confirming your reservation.`
    },
    {
      question: `How can I book ${property.listing_title}?`,
      answer: `You can book ${property.listing_title} directly through Luxevillaz for the best available rates and exclusive offers.`
    },
    {
      question: `Are pets allowed at ${property.listing_title}?`,
      answer: allowsPets
        ? `Yes, pets are allowed at ${property.listing_title}. Guests are welcome to bring their pets, subject to the property's guidelines and house rules.`
        : `No, pets are not allowed at ${property.listing_title}.`
    }
  ] : [];

  // Enquiry Form State
  const [enquiryData, setEnquiryData] = useState({
    fullName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: "1",
    purpose: ""
  });
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryStatus, setEnquiryStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [enquiryError, setEnquiryError] = useState("");

  const handleEnquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEnquiryData(prev => ({ ...prev, [name]: value }));
  };

  const submitEnquiry = async () => {
    if (!supabase || !property) return;

    // Basic validation
    if (!enquiryData.fullName || !enquiryData.email || !enquiryData.phone || !enquiryData.checkIn || !enquiryData.checkOut) {
      setEnquiryError("Please fill in all required fields.");
      setEnquiryStatus('error');
      return;
    }

    setEnquiryLoading(true);
    setEnquiryStatus('idle');
    setEnquiryError("");

    try {
      const { error } = await supabase.from('property_enquiries').insert([
        {
          property_id: property.id,
          user_id: session?.user?.id || null,
          full_name: enquiryData.fullName,
          email: enquiryData.email,
          phone: enquiryData.phone,
          check_in: enquiryData.checkIn,
          check_out: enquiryData.checkOut,
          guests: parseInt(enquiryData.guests),
          purpose: enquiryData.purpose,
          status: 'pending'
        }
      ]);

      if (error) throw error;

      // Facebook Pixel & Conversion API dual tracking for Lead
      const eventId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const runTracking = async () => {
        try {
          const settings = await getTrackingSettings();

          // 1. Client-side Pixel trigger
          if (settings.pixel_enabled && typeof window !== "undefined") {
            const w = window as unknown as { fbq?: (...args: unknown[]) => void };
            if (w.fbq) {
              w.fbq('track', 'Lead', {
                content_name: property.listing_title,
                content_category: property.category,
                content_ids: [property.id],
                value: 0,
                currency: 'INR'
              }, { eventID: eventId });
            }
          }

          // 2. Server-side CAPI trigger via local API route
          if (settings.capi_enabled) {
            fetch('/api/facebook-capi', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventName: 'Lead',
                eventId: eventId,
                userData: {
                  email: enquiryData.email,
                  phone: enquiryData.phone,
                },
                customData: {
                  content_name: property.listing_title,
                  content_category: property.category,
                  content_ids: [property.id],
                  value: 0,
                  currency: 'INR'
                }
              })
            }).catch(err => console.error("CAPI dispatch failed:", err));
          }
        } catch (err) {
          console.error("Facebook tracking load settings error:", err);
        }
      };
      runTracking();

      setEnquiryStatus('success');
      // Reset non-user fields
      setEnquiryData(prev => ({
        ...prev,
        checkIn: "",
        checkOut: "",
        guests: "1",
        purpose: ""
      }));
      
      // Redirect to thank you page with stay details
      router.push(`/thankyou?property_name=${encodeURIComponent(property.listing_title)}&property_slug=${encodeURIComponent(rawId)}`);
    } catch (err: any) {
      console.error("Enquiry submission error:", err);
      setEnquiryError(err.message || "Failed to submit enquiry. Please try again.");
      setEnquiryStatus('error');
    } finally {
      setEnquiryLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('property_id', property?.id || initialProperty.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // TESTING MODE:
      // Use clearly labeled demo reviews instead of database reviews.
      setReviews(DEMO_REVIEWS);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        if (!supabase) return;

        const { data: { session: curSession } } = await supabase.auth.getSession();
        setSession(curSession);

        if (curSession) {
          const { data: savedData } = await supabase
            .from('saved_properties')
            .select('id')
            .eq('user_id', curSession.user.id)
            .eq('property_id', initialProperty.id)
            .maybeSingle();

          if (savedData) setIsSaved(true);

          // Pre-fill enquiry form
          setEnquiryData(prev => ({
            ...prev,
            fullName: curSession.user?.user_metadata?.full_name || "",
            email: curSession.user?.email || "",
            phone: curSession.user?.user_metadata?.phone || ""
          }));
        }

        await fetchReviews();
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id]);

  // Thumbnail Auto-Scroll Sync
  useEffect(() => {
    if (showAllPhotos && thumbnailRefs.current[activePhotoIndex]) {
      thumbnailRefs.current[activePhotoIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activePhotoIndex, showAllPhotos]);


  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showAllPhotos || !property?.images) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') setShowAllPhotos(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAllPhotos, activePhotoIndex, property]);

  // Hero Image Infinite Slideshow
  useEffect(() => {
    if (!property?.images || property.images.length <= 1 || showAllPhotos) return;
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % property.images!.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [property?.images, showAllPhotos]);

  const handleToggleSave = async () => {
    if (!supabase || !property) return;
    if (!session) {
      router.push("/login?redirect=/stays/" + id);
      return;
    }

    // Optimistic UI Update
    const newSaveState = !isSaved;
    setIsSaved(newSaveState);

    try {
      if (!newSaveState) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', session.user.id)
          .eq('property_id', property.id);
      } else {
        await supabase
          .from('saved_properties')
          .insert({ user_id: session.user.id, property_id: property.id });
      }
    } catch (err) {
      console.error("Error toggling save:", err);
      setIsSaved(!newSaveState); // Revert on failure
    }
  };

  // Prevent background scroll when any modal is open
  useEffect(() => {
    if (showAllPhotos || showAmenitiesModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAllPhotos, showAmenitiesModal]);

  const openGallery = (index: number) => {
    setActivePhotoIndex(index);
    setShowAllPhotos(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: property?.listing_title || "Premium Stay",
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const nextPhoto = () => {
    if (!property?.images) return;
    setActivePhotoIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevPhoto = () => {
    if (!property?.images) return;
    setActivePhotoIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Property not found</h1>
        <Link href="/stays" className="text-[#EC5B13] font-bold hover:underline">
          Back to all stays
        </Link>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(2)
    : "New";

  const mainImage = property.images?.[0] || "/images/stays/pool_villa.webp";
  const galleryImages = property.images?.slice(1, 4) || [];
  const lastImage = property.images?.[4];

  const ratingCount = reviews.length;
  const ratingValue = avgRating !== "New" ? parseFloat(avgRating) : null;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      {/* Rich Results Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://www.luxevillaz.com/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Stays",
                  "item": "https://www.luxevillaz.com/stays"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": property.listing_title,
                  "item": `https://www.luxevillaz.com/stays/${slugify(property.listing_title)}-${id}`
                }
              ]
            },
            {
              "@context": "https://schema.org",
              "@type": "House",
              "name": property.listing_title,
              "description": property.listing_description || property.description || "",
              "image": property.images || [],
              "address": {
                "@type": "PostalAddress",
                "streetAddress": property.street_address || "",
                "addressLocality": property.city,
                "addressRegion": property.state,
                "addressCountry": "IN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": property.latitude || 15.2993,
                "longitude": property.longitude || 74.1240
              },
              ...(ratingValue ? {
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": ratingValue,
                  "reviewCount": ratingCount,
                  "bestRating": "5",
                  "worstRating": "1"
                }
              } : {}),
              ...(reviews.length > 0 ? {
                "review": reviews.map(rev => ({
                  "@type": "Review",
                  "author": {
                    "@type": "Person",
                    "name": rev.user_name
                  },
                  "datePublished": rev.created_at.split('T')[0],
                  "reviewBody": rev.comment,
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": rev.rating,
                    "bestRating": "5",
                    "worstRating": "1"
                  }
                }))
              } : {})
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqList.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            }
          ])
        }}
      />

      {/* Premium Full Screen Photo Gallery Modal */}
      {showAllPhotos && property?.images && (
        <div className="fixed inset-0 z-[100] bg-black animate-in fade-in zoom-in duration-300">
          
          {/* Main Stage (Image Area) */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
            <div
              className="relative w-full h-full flex items-center justify-center cursor-pointer"
              onClick={nextPhoto}
              title="Next photo"
            >
              <div className="relative w-full h-full md:p-10">
                <Image
                  src={property.images[activePhotoIndex]}
                  alt={`${property.listing_title}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Top Bar: Counter and Close */}
          <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center text-white z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <span className="text-xs md:text-sm font-bold tracking-widest uppercase opacity-80 drop-shadow-md">
                Photo {activePhotoIndex + 1} of {property.images.length}
              </span>
            </div>
            <button
              onClick={() => setShowAllPhotos(false)}
              className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all group active:scale-90 pointer-events-auto backdrop-blur-sm"
            >
              <X size={20} className="md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute inset-y-0 left-2 md:left-10 flex items-center z-10 pointer-events-none">
            <button
              onClick={prevPhoto}
              className="p-2 md:p-4 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all border border-white/20 active:scale-95 pointer-events-auto backdrop-blur-sm"
            >
              <ChevronLeft size={24} className="md:w-8 md:h-8" />
            </button>
          </div>

          <div className="absolute inset-y-0 right-2 md:right-10 flex items-center z-10 pointer-events-none">
            <button
              onClick={nextPhoto}
              className="p-2 md:p-4 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all border border-white/20 active:scale-95 pointer-events-auto backdrop-blur-sm"
            >
              <ChevronRight size={24} className="md:w-8 md:h-8" />
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div className="absolute bottom-0 left-0 right-0 pb-4 md:pb-10 pt-10 flex flex-col items-center w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto py-2 scrollbar-hide max-w-full px-4 md:px-10 no-scrollbar pointer-events-auto">
              {property.images.map((img, i) => (
                <button
                  key={i}
                  ref={(el) => { thumbnailRefs.current[i] = el; }}
                  onClick={() => setActivePhotoIndex(i)}
                  className={`relative w-12 h-12 md:w-20 md:h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 ${activePhotoIndex === i
                    ? "scale-110 ring-2 md:ring-4 ring-orange-500 shadow-2xl z-10"
                    : "opacity-40 hover:opacity-100"
                    }`}
                >
                  <Image src={img} alt={`Thumb ${i + 1}`} fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Amenities Modal */}
      {showAmenitiesModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">What this place offers</h2>
              <button
                onClick={() => setShowAmenitiesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-900" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-y-6 gap-x-4">
                {property.amenities?.map((id) => {
                  const normalizedId = id.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <div key={id} className="flex items-center gap-4 text-gray-700 pb-6 border-b border-gray-50 last:border-0 sm:[&:nth-last-child(-n+2)]:border-0">
                      <span className="text-gray-500">
                        {AMENITY_ICONS[normalizedId] || <CheckCircle2 size={24} strokeWidth={1.5} />}
                      </span>
                      <span className="font-medium text-[15px] capitalize">
                        {id.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-4 md:px-10 pt-6 pb-20">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 md:gap-2 text-gray-600 hover:text-black transition-colors font-medium text-xs md:text-sm shrink-0"
          >
            <ArrowLeft size={16} className="md:w-[18px] md:h-[18px]" />
            Back
          </button>
          <div className="flex items-center gap-1 md:gap-4">
            <button
              onClick={handleDownloadBrochure}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1 md:gap-2 text-gray-800 hover:bg-gray-100 px-2 md:px-3 py-1.5 rounded-lg transition-all text-xs md:text-sm font-semibold underline disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#EC5B13] md:w-4 md:h-4" />
                  <span>Generating {pdfProgress > 0 ? `(${pdfProgress}%)` : ""}</span>
                </>
              ) : (
                <>
                  <Download size={14} className="md:w-4 md:h-4" />
                  <span>Brochure</span>
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 md:gap-2 text-gray-800 hover:bg-gray-100 px-2 md:px-3 py-1.5 rounded-lg transition-all text-xs md:text-sm font-semibold underline whitespace-nowrap"
            >
              {isCopied ? <CheckCircle2 size={14} className="text-emerald-600 md:w-4 md:h-4" /> : <Share size={14} className="md:w-4 md:h-4" />}
              {isCopied ? "Copied!" : "Share"}
            </button>
            <button
              onClick={handleToggleSave}
              className="flex items-center gap-1 md:gap-2 text-gray-800 hover:bg-gray-100 px-2 md:px-3 py-1.5 rounded-lg transition-all text-xs md:text-sm font-semibold underline whitespace-nowrap"
            >
              <Heart size={14} className={`md:w-4 md:h-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* Title & Top Info Row */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4 mb-2">
            <h1 className="text-[26px] md:text-[32px] font-serif text-gray-900 tracking-tight leading-tight">
              {formatPropertyTitle(property.listing_title, property.ls_id)}
            </h1>
            
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-400 font-medium whitespace-nowrap overflow-x-auto py-1">
              <Link href="/" className="hover:text-[#EC5B13] transition-colors">Home</Link>
              <span className="text-gray-300">&gt;</span>
              <Link href="/stays" className="hover:text-[#EC5B13] transition-colors">Stays</Link>
              <span className="text-gray-300">&gt;</span>
              <span className="text-[#EC5B13] font-semibold truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]" title={formatPropertyTitle(property.listing_title, property.ls_id)}>
                {formatPropertyTitle(property.listing_title, property.ls_id)}
              </span>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] font-medium text-gray-700">
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-black" />
              <span>{avgRating}</span>
              {reviews.length > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="underline cursor-pointer">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 border-l border-gray-300 pl-4 h-4 my-auto">
              <ShieldCheck size={14} className="text-[#EC5B13]" />
              <span>Superhost</span>
            </div>
            <div 
              onClick={scrollToMap}
              className="flex items-center gap-1 underline cursor-pointer border-l border-gray-300 pl-4 h-4 my-auto"
            >
              <MapPin size={14} />
              <span>
                {[
                  property.street_address,
                  property.city,
                  `${property.state} ${property.pincode || ""}`.trim(),
                  "India"
                ].filter(Boolean).join(", ")}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 rounded-[20px] overflow-hidden aspect-[4/3] md:aspect-[2/1] relative group mb-10 bg-gray-100">
          {/* Main Large Image Slider */}
          <div className="md:col-span-2 md:row-span-2 relative h-full overflow-hidden">
            {property.images && property.images.length > 0 ? (
              property.images.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  alt={`${property.listing_title} - Photo ${i + 1}`}
                  fill
                  className={`object-cover transition-opacity duration-1000 absolute inset-0 ${i === heroImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  priority={i === 0}
                  unoptimized
                />
              ))
            ) : (
              <Image
                src="/images/stays/pool_villa.webp"
                alt={property.listing_title}
                fill
                className="object-cover"                unoptimized/>
            )}

            {/* Interactive Overlay Layer */}
            <div
              className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 z-20 cursor-pointer"
              onClick={() => openGallery(heroImageIndex)}
            />
          </div>
          {/* Smaller Images Integration */}
          {galleryImages.map((img, i) => (
            <div key={i} className="hidden md:block relative h-full overflow-hidden">
              <Image
                src={img}
                alt={`${property.listing_title} ${i + 2}`}
                fill
                className="object-cover hover:brightness-90 hover:scale-[1.05] transition-all duration-700 cursor-pointer"
                unoptimized
                onClick={() => openGallery(i + 1)}
              />
            </div>
          ))}
          {lastImage && (
            <div className="hidden md:block relative h-full overflow-hidden">
              <Image
                src={lastImage}
                alt={`${property.listing_title} last`}
                fill
                className="object-cover hover:brightness-90 hover:scale-[1.05] transition-all duration-700 cursor-pointer"
                unoptimized
                onClick={() => openGallery(4)}
              />
            </div>
          )}
          {/* Show all photos button */}
          <button
            onClick={() => openGallery(0)}
            className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md border border-gray-900/10 rounded-xl px-5 py-2.5 text-[13px] font-bold shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2)] hover:bg-white hover:border-[#EC5B13] hover:text-[#EC5B13] flex items-center gap-2.5 z-10 transition-all duration-300 active:scale-95 group/btn"
          >
            <Layout size={16} className="rotate-0 group-hover/btn:scale-110 transition-transform" />
            Show all photos
          </button>
        </div>

        {/* Content Layout: Main Info | Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative">

          {/* Left Column: Details */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-start pb-8 border-b border-gray-100">
              <div>
                <h2 className="text-[22px] font-bold text-gray-900 mb-1">
                  Entire {property.category} hosted by {property.host_name || "Maria"}
                </h2>
                <p className="text-gray-600 font-medium tracking-tight">
                  {property.max_guests} {property.max_guests === 1 ? 'guest' : 'guests'} • {property.bedrooms} {property.bedrooms === 1 ? 'bedroom' : 'bedrooms'} • {property.beds} {property.beds === 1 ? 'bed' : 'beds'} • {property.bathrooms} {property.bathrooms === 1 ? 'bathroom' : 'bathrooms'}
                </p>
              </div>
              <div className="relative w-14 h-14 rounded-full overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center">
                <User size={30} className="text-gray-300" />
              </div>
            </div>

            {/* Highlights Section */}
            <div className="py-8 space-y-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <ChefHat className="mt-1 text-gray-500 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight mb-0.5">{property.host_name || "Maria"} is a Superhost</h4>
                  <p className="text-gray-500 text-sm">
                    {property.host_description || "Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 text-gray-500 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight mb-0.5">Great location</h4>
                  <p className="text-gray-500 text-sm">95% of recent guests gave the location a 5-star rating.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Calendar className="mt-1 text-gray-500 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight mb-0.5">Free cancellation for 48 hours</h4>
                  <p className="text-gray-500 text-sm">Get a full refund if you change your mind.</p>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="py-8 border-b border-gray-100">
              <div className="relative">
                <p
                  ref={descriptionRef}
                  className={`text-gray-700 leading-[1.6] whitespace-pre-line font-medium transition-all duration-300 ${isExpanded ? "" : "line-clamp-4"}`}
                >
                  {property.listing_description || property.description || "Welcome to our stunning property. This luxury space offers an unparalleled blend of modern architecture and tropical charm..."}
                </p>

                {(property.listing_description?.length || property.description?.length || 0) > 250 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 font-bold underline text-gray-900 mt-4 hover:text-[#EC5B13] transition-colors"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                    <ChevronRight size={18} className={`transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Amenities Section */}
            <div className="py-8 border-b border-gray-100">
              <h3 className="text-[22px] font-bold text-gray-900 mb-6">What this place offers</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {property.amenities?.slice(0, 10).map((id) => {
                  const normalizedId = id.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <div key={id} className="flex items-center gap-4 text-gray-700">
                      <span className="text-gray-500">{AMENITY_ICONS[normalizedId] || <CheckCircle2 size={18} />}</span>
                      <span className="font-medium capitalize">{id.replace(/_/g, ' ')}</span>
                    </div>
                  );
                }) || (
                    ["Private infinity pool", "Chef on call", "Gourmet kitchen", "Fast wifi - 500 Mbps", "Central air conditioning", "Free parking on premises", "Smart TV", "Washing machine", "Dedicated workspace", "BBQ grill"].map(item => (
                      <div key={item} className="flex items-center gap-4 text-gray-700">
                        <span className="text-gray-500"><CheckCircle2 size={18} /></span>
                        <span className="font-medium">{item}</span>
                      </div>
                    ))
                  )}
              </div>
              <button
                onClick={() => setShowAmenitiesModal(true)}
                className="px-6 py-3 border border-black rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Show all {property.amenities?.length || 45} amenities
              </button>
            </div>

            {/* House Rules Section */}
            {(property.house_rules || (property.custom_rules && property.custom_rules.length > 0)) && (
              <div className="py-8 border-b border-gray-100">
                <h3 className="text-[22px] font-bold text-gray-900 mb-6">House rules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                  {/* Standard Rules */}
                  {property.house_rules && Object.keys(property.house_rules).map(key => {
                    const isAllowed = property.house_rules![key];
                    const label = key.charAt(0).toUpperCase() + key.slice(1);
                    return (
                      <div key={key} className="flex items-center gap-3 text-gray-700">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isAllowed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="font-medium text-[15.5px]">
                          {isAllowed ? `${label} Allowed` : `No ${label}`}
                        </span>
                      </div>
                    );
                  })}

                  {/* Custom Rules */}
                  {property.custom_rules?.map((rule, i) => (
                    <div key={i} className="flex items-start gap-3 text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 shrink-0" />
                      <span className="font-medium text-[15.5px] leading-snug">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Inquiry Card */}
          <div className="lg:block">
            <div className="sticky top-28 p-6 bg-white rounded-[24px] shadow-[0_12px_45px_-10px_rgba(0,0,0,0.15)] border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-2xl font-bold text-gray-900">Inquiry</span>
                </div>
              </div>

              {enquiryStatus === 'success' ? (
                <div className="bg-emerald-50 rounded-[24px] p-8 text-center border border-emerald-100 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                    <CheckCircle2 size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">Enquiry Sent!</h3>
                  <p className="text-emerald-700 text-sm font-medium leading-relaxed">
                    Our team will contact you shortly regarding your stay at {property.listing_title}.
                  </p>
                  <button
                    onClick={() => setEnquiryStatus('idle')}
                    className="mt-6 text-emerald-600 font-bold text-sm underline hover:text-emerald-800 transition-colors"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {/* User Info Section (Only if not pre-filled/logged in or needs edit) */}
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={enquiryData.fullName}
                        onChange={handleEnquiryChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EC5B13]/10 focus:border-[#EC5B13] transition-all"
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={enquiryData.email}
                        onChange={handleEnquiryChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EC5B13]/10 focus:border-[#EC5B13] transition-all"
                      />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={enquiryData.phone}
                        onChange={handleEnquiryChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EC5B13]/10 focus:border-[#EC5B13] transition-all"
                      />
                    </div>

                    <div className="border border-gray-300 rounded-[14px]">
                      <div className="grid grid-cols-2 border-b border-gray-300">
                        <div className="p-3 border-r border-gray-300 hover:bg-gray-50 transition-colors relative rounded-tl-[14px]">
                          <p className="text-[10px] font-black uppercase text-gray-900 mb-1">Check-in</p>
                          <CustomDatePicker
                            id="checkin"
                            value={enquiryData.checkIn}
                            onChange={(val) => setEnquiryData(prev => ({ ...prev, checkIn: val }))}
                            placeholder="dd/mm/yyyy"
                            className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer"
                          />
                        </div>
                        <div className="p-3 hover:bg-gray-50 transition-colors relative rounded-tr-[14px]">
                          <p className="text-[10px] font-black uppercase text-gray-900 mb-1">Checkout</p>
                          <CustomDatePicker
                            id="checkout"
                            value={enquiryData.checkOut}
                            min={enquiryData.checkIn || undefined}
                            onChange={(val) => setEnquiryData(prev => ({ ...prev, checkOut: val }))}
                            placeholder="dd/mm/yyyy"
                            className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="p-3 border-b border-gray-300 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="w-full">
                            <label htmlFor="inquiry-guests" className="block text-[10px] font-black uppercase text-gray-900 mb-1 cursor-pointer">Guests</label>
                            <input
                              type="number"
                              id="inquiry-guests"
                              name="guests"
                              min="1"
                              placeholder="Add guests"
                              value={enquiryData.guests}
                              onChange={handleEnquiryChange}
                              className="w-full text-sm font-medium text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-400 placeholder:font-normal appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="p-3 hover:bg-gray-50 transition-colors rounded-b-[14px]">
                        <div className="flex justify-between items-center">
                          <div className="w-full">
                            <p className="text-[10px] font-black uppercase text-gray-900 mb-1">Purpose</p>
                            <select
                              name="purpose"
                              value={enquiryData.purpose}
                              onChange={handleEnquiryChange}
                              className={`w-full text-sm font-medium bg-transparent focus:outline-none cursor-pointer appearance-none ${!enquiryData.purpose ? 'text-gray-400' : 'text-gray-900'}`}
                            >
                              <option value="" disabled>Select...</option>
                              <option value="Vacation">Vacation</option>
                              <option value="Business">Business</option>
                              <option value="Event">Event / Celebration</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <ChevronRight className="rotate-90 text-gray-400 pointer-events-none" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {enquiryStatus === 'error' && (
                    <p className="text-red-500 text-xs font-bold mb-4 flex items-center gap-1">
                      <AlertCircle size={14} /> {enquiryError}
                    </p>
                  )}

                  <button
                    onClick={submitEnquiry}
                    disabled={enquiryLoading}
                    className="w-full py-4 bg-[#EC5B13] hover:bg-[#d44f0f] text-white rounded-xl font-bold text-lg transition-all shadow-lg active:scale-[0.98] mb-4 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {enquiryLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                      </>
                    ) : "Inquire Now"}
                  </button>

                  <p className="text-center text-gray-500 text-xs font-semibold mb-6">You won't be charged yet</p>

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-500 hover:text-black transition-colors cursor-pointer text-xs font-bold underline uppercase tracking-widest">
                    <MapPin size={14} />
                    Report this listing
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Real Reviews Section */}
        <div className="mt-20 pt-16 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-12">
            <Star size={24} className="fill-black" />
            <h2 className="text-3xl font-serif text-gray-900">
              {avgRating} {reviews.length > 0 && `• ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16 mb-20">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review.id} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <User size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 capitalize">{review.user_name}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={i < review.rating ? "fill-black" : "text-gray-200"} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium italic">No reviews yet. Be the first to share your experience!</p>
              </div>
            )}
          </div>

          {/*
          // REVIEW SUBMISSION FORM DISABLED FOR TESTING
          <div className="max-w-2xl">
            {session ? (
              <ReviewForm propertyId={property.id} onReviewSubmitted={fetchReviews} />
            ) : (
              <div className="bg-gray-50 rounded-[32px] p-8 text-center border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Want to share your experience?</h3>
                <p className="text-gray-500 font-medium mb-6">Log in to leave a star rating and comment on this property.</p>
                <Link
                  href="/login"
                  className="inline-block px-8 py-3 bg-[#1A1A24] text-white font-bold rounded-xl hover:bg-black transition-all shadow-md"
                >
                  Log In to Review
                </Link>
              </div>
            )}
          </div>
          */}
        </div>

        {/* Where you'll be Section */}
        <div ref={mapSectionRef} className="mt-20 pt-16 border-t border-gray-100">
          <div className="mb-1">
            <h2 className="text-2xl font-serif text-gray-900 leading-tight">Where you'll be</h2>
          </div>
          <p className="text-gray-500 font-medium mb-8 text-sm">
            {property.city}, {property.state}, India
          </p>

          <div className="h-[480px] w-full bg-gray-100 rounded-[32px] overflow-hidden border border-gray-100 shadow-inner relative">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{
                  lat: property.latitude || 15.2993,
                  lng: property.longitude || 74.1240
                }}
                zoom={14}
                options={{
                  disableDefaultUI: false,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: true,
                  gestureHandling: 'cooperative',
                }}
              >
                <Marker
                  position={{
                    lat: property.latitude || 15.2993,
                    lng: property.longitude || 74.1240
                  }}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#EC5B13" stroke="#EC5B13" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="white"/></svg>')
                  }}
                />
              </GoogleMap>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#EC5B13] border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        {property && (
          <div className="mt-20 pt-16 border-t border-gray-100">
            <div className="mb-10 text-center">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="max-w-4xl mx-auto">
              {faqList.map((faq, index) => (
                <PropertyFAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

function PropertyFAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`bg-white rounded-2xl mb-4 overflow-hidden border transition-all duration-300 ${isOpen ? 'border-black' : 'border-gray-100 hover:border-gray-200'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left group"
      >
        <span className="text-gray-900 font-bold text-base md:text-lg group-hover:text-black transition-colors">
          {question}
        </span>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-black flex items-center justify-center transition-all duration-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <div className="relative w-3 h-3">
            {/* Horizontal line (Minus) */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white -translate-y-1/2" />
            {/* Vertical line (Plus component) */}
            <div
              className={`absolute top-0 left-1/2 w-[2px] h-full bg-white -translate-x-1/2 transition-all duration-500 ${isOpen ? 'rotate-90 scale-y-0 opacity-0' : 'rotate-0 scale-y-100 opacity-100'}`}
            />
          </div>
        </div>
      </button>
      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden px-6">
          <p className="text-gray-600 font-medium text-sm md:text-base leading-relaxed max-w-3xl">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
