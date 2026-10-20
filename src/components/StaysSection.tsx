"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import StayCard from "./StayCard";
import CategoryFilters from "./CategoryFilters";
import { ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, MapPin, Loader2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPropertyTitle } from "@/utils/formatPropertyTitle";

interface Property {
  id: string;
  slug?: string;
  listing_title: string;
  city: string;
  category: string;
  bedrooms?: number;
  images: string[];
  status: string;
  // Metadata for filtering
  amenities?: string[];
  house_rules?: any; 
  // Mocking rating for now as it's not in DB
  rating?: number;
  description?: string;
  is_trending?: boolean;
  max_guests: number;
  ls_id?: string;
}

const generateRating = (id: string) => {
  const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Number((4.5 + (sum % 6) / 10).toFixed(1));
};

const StayCarousel = ({ title, stays }: { title: string, stays: Property[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const displayStays = stays.filter(stay => stay.is_trending).slice(0, 7);

  if (displayStays.length === 0) return null;

  return (
    <div className="mb-16 last:mb-0">
      <div className="flex justify-between items-end mb-8">
        <h2 className="text-[32px] md:text-[48px] font-serif text-gray-900 tracking-tight leading-tight max-w-2xl">
          {title}
        </h2>
        <div className="hidden md:flex gap-3 mb-2">
          <button
            onClick={() => scroll("left")}
            className="p-4 bg-white hover:bg-gray-50 rounded-full border border-gray-100 transition-all text-gray-400 hover:text-black shadow-sm hover:shadow-md active:scale-95"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-4 bg-white hover:bg-gray-50 rounded-full border border-gray-100 transition-all text-gray-400 hover:text-black shadow-sm hover:shadow-md active:scale-95"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto no-scrollbar pb-10 -mx-4 px-4 md:-mx-0 md:px-0 scroll-smooth snap-x snap-mandatory"
      >
        {displayStays.map((property: Property) => (
          <div key={property.id} className="flex-shrink-0 w-[80vw] sm:w-[280px] lg:w-[calc((100%-96px)/5)] snap-center">
            <StayCard
              id={property.id}
              slug={property.slug}
              title={formatPropertyTitle(property.listing_title, property.ls_id)}
              location={property.city}
              category={property.category}
              bedrooms={property.bedrooms}
              image={property.images?.[0]}
              rating={generateRating(property.id)}
              trending={property.is_trending}
            />
          </div>
        ))}

        {/* Explore More Stays Card */}
        <div className="flex-shrink-0 w-[80vw] sm:w-[280px] lg:w-[calc((100%-96px)/5)] snap-center relative rounded-3xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all min-h-[380px]">
          <Link href="/stays" className="block w-full h-full min-h-[380px]">
            <Image
              src="https://images.unsplash.com/photo-1678889284769-b7dcbec1f082?q=80&w=2070&auto=format&fit=crop"
              alt="Luxury Villa"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
             unoptimized/>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all group-hover:bg-black/50 group-hover:backdrop-blur-sm" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <h3 className="text-white text-[28px] font-serif mb-6 leading-tight drop-shadow-md">Explore<br />More Stays</h3>
              <div className="px-6 py-3 bg-white text-black text-[11px] font-black uppercase tracking-[0.15em] rounded-full group-hover:scale-105 group-active:scale-95 transition-all shadow-lg">
                View All
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

import FilterModal, { AdvancedFilters } from "./FilterModal";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface StaysSectionProps {
  viewMode?: "carousel" | "grid";
  title?: string;
  listingTitle?: string;
  listingDescription?: string;
}

export default function StaysSection({
  viewMode = "carousel",
  title,
  listingTitle,
  listingDescription
}: StaysSectionProps) {
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    propertyType: "",
    amenities: [],
    bookingOptions: { selfCheckIn: false, allowsPets: false },
    standoutStays: "",
  });
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>({
    propertyType: "",
    amenities: [],
    bookingOptions: { selfCheckIn: false, allowsPets: false },
    standoutStays: "",
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState({
    location: "",
    guests: 0,
    checkIn: "",
    checkOut: ""
  });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Initialize filters from URL on mount
  useEffect(() => {
    const type = searchParams.get('type');
    const amenitiesArr = searchParams.get('amenities')?.split(',').filter(Boolean) || [];
    const pets = searchParams.get('pets') === 'true';
    const selfCheckin = searchParams.get('self') === 'true';
    const standout = searchParams.get('standout');
    const catsArr = searchParams.get('cats')?.split(',').filter(Boolean) || [];

    const searchLocation = searchParams.get('location');
    const searchGuests = searchParams.get('guests');
    const searchCheckIn = searchParams.get('checkin');
    const searchCheckOut = searchParams.get('checkout');

    setSearchQuery({
      location: searchLocation || "",
      guests: searchGuests ? parseInt(searchGuests) : 0,
      checkIn: searchCheckIn || "",
      checkOut: searchCheckOut || ""
    });

    if (type || amenitiesArr.length > 0 || pets || selfCheckin || standout || catsArr.length > 0 || searchLocation || searchGuests) {
      const filters: AdvancedFilters = {
        propertyType: type || "",
        amenities: amenitiesArr,
        bookingOptions: { selfCheckIn: selfCheckin, allowsPets: pets },
        standoutStays: standout || "",
      };
      setAdvancedFilters(filters);
      setDraftFilters(filters);
      if (catsArr.length > 0) setActiveCategories(catsArr);
    }
  }, [searchParams]);

  // 2. Fetch properties
  useEffect(() => {
    async function fetchProperties() {
      try {
        if (!supabase) return;
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProperties(data || []);
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  const applyFiltersWithNav = (filters: AdvancedFilters) => {
    setAdvancedFilters(filters);
    setIsFilterModalOpen(false);

    // Build URL query params
    const params = new URLSearchParams();
    if (filters.propertyType) params.set('type', filters.propertyType);
    if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
    if (filters.bookingOptions.allowsPets) params.set('pets', 'true');
    if (filters.bookingOptions.selfCheckIn) params.set('self', 'true');
    if (filters.standoutStays) params.set('standout', filters.standoutStays);
    if (activeCategories.length > 0) params.set('cats', activeCategories.join(','));

    const queryString = params.toString();
    const newUrl = `/stays${queryString ? `?${queryString}` : ''}`;

    if (pathname !== '/stays') {
      router.push(newUrl);
    } else {
      // If already on /stays, just update URL for shareability without refresh
      router.replace(newUrl, { scroll: false });
    }
  };

  const getFilteredProperties = (advFilters: AdvancedFilters) => properties.filter((prop) => {
    // 1. Advanced Filters from FilterModal
    if (advFilters.propertyType) {
      const selectedTypes = advFilters.propertyType.toLowerCase().split(',').map(t => t.trim());
      const propCategory = prop.category?.toLowerCase() || "";
      const propTitle = prop.listing_title?.toLowerCase() || "";

      const matchesType = selectedTypes.some(type =>
        propCategory === type || propTitle.includes(type)
      );

      if (!matchesType) return false;
    }



    if (advFilters.amenities.length > 0) {
      const hasAllAmenities = advFilters.amenities.every(amenity => {
        const search = amenity.toLowerCase().replace(/_/g, ' ');
        return prop.amenities?.some((a: string) => {
          const stored = a.toLowerCase().replace(/_/g, ' ');
          return stored === search || stored.includes(search);
        });
      });
      if (!hasAllAmenities) return false;
    }

    if (advFilters.bookingOptions.selfCheckIn) {
      // Mock search or look for self check-in in rules/amenities if boolean doesn't exist
      const hasSelfCheckin = prop.amenities?.some((a: string) => a.toLowerCase().includes("self check-in") || a.toLowerCase().includes("lockbox"));
      if (!hasSelfCheckin) return false;
    }

    if (advFilters.bookingOptions.allowsPets) {
      const houseRules = prop.house_rules || {};
      const isAllowed =
        houseRules.pets === true ||
        houseRules.pets_allowed === true ||
        houseRules.no_pets === false ||
        prop.amenities?.some((a: string) => a.toLowerCase().includes("pet"));
      if (!isAllowed) return false;
    }

    if (advFilters.standoutStays === "Guest favourite") {
      // Mock logic: e.g. rating > 4.8 or something similar if metadata allows, otherwise hardcode true for now
      if (prop.rating && prop.rating < 4.8) return false;
    } else if (advFilters.standoutStays === "Luxe") {
      const isLuxe =
        prop.category?.toLowerCase().includes("luxe") ||
        prop.listing_title?.toLowerCase().includes("luxe") ||
        prop.amenities?.some((a: string) => a.toLowerCase().includes("luxe"));
      if (!isLuxe) return false;
    }

    // 2. Category Icons Filter (OR logic between selected categories)
    if (activeCategories.length > 0) {
      const matchesCategory = activeCategories.some(cat => {
        if (cat === "private_pool") return prop.amenities?.some((a: string) => a.toLowerCase().includes("private_pool") || a.toLowerCase().includes("private pool"));
        if (cat === "shared_pool") return prop.amenities?.some((a: string) => a.toLowerCase().includes("shared_pool") || a.toLowerCase().includes("shared pool"));
        if (cat === "beach") return prop.amenities?.some((a: string) => a.toLowerCase().includes("beach"));
        if (cat === "pet") {
          const houseRules = prop.house_rules || {};
          return (
            houseRules.pets === true ||
            houseRules.pets_allowed === true ||
            houseRules.no_pets === false ||
            !!prop.amenities?.some((a: string) => a.toLowerCase().includes("pet"))
          );
        }
        if (cat === "party") {
          const houseRules = prop.house_rules || {};
          return houseRules.parties === true || houseRules.events_allowed === true;
        }
        if (cat === "work") return prop.amenities?.some((a: string) => a.toLowerCase().includes("wifi") || a.toLowerCase().includes("workspace") || a.toLowerCase().includes("internet"));
        if (cat === "heritage") return prop.category?.toLowerCase().includes("heritage") || prop.category?.toLowerCase().includes("castle") || prop.listing_title?.toLowerCase().includes("heritage");
        if (cat === "nature") return prop.amenities?.some((a: string) => a.toLowerCase().includes("garden") || a.toLowerCase().includes("backyard") || a.toLowerCase().includes("nature") || a.toLowerCase().includes("farm"));
        return false;
      });
      if (!matchesCategory) return false;
    }

    // 3. Search Bar Filters
    if (searchQuery.location) {
      const search = searchQuery.location.toLowerCase();
      const cityMatch = prop.city?.toLowerCase().includes(search);
      const titleMatch = prop.listing_title?.toLowerCase().includes(search);
      if (!cityMatch && !titleMatch) return false;
    }

    if (searchQuery.guests > 0) {
      if ((prop.max_guests || 0) < searchQuery.guests) return false;
    }

    return true;
  });

  const filteredProperties = getFilteredProperties(advancedFilters);

  // For Home page carousel: combine all stays into "Top Rated Stays in Goa"
  // For Listing page: show all stays grouped or in a single grid
  const groupedProperties = properties.reduce((acc: Record<string, Property[]>, prop) => {
    const city = prop.city || "Goa";
    if (!acc[city]) acc[city] = [];
    acc[city].push(prop);
    return acc;
  }, {});

  const activeFiltersCount = [
    advancedFilters.propertyType ? 1 : 0,
    advancedFilters.amenities.length,
    advancedFilters.bookingOptions.selfCheckIn ? 1 : 0,
    advancedFilters.bookingOptions.allowsPets ? 1 : 0,
    advancedFilters.standoutStays ? 1 : 0,
  ].reduce((acc, current) => acc + current, 0);

  return (
    <section className={`pb-24 bg-white overflow-hidden ${viewMode === 'carousel' ? 'pt-20 md:pt-32' : 'pt-10'}`}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        {/* Category Icons & Filters Button */}
        <CategoryFilters
          activeCategories={activeCategories}
          activeFiltersCount={activeFiltersCount}
          onCategoryChange={(id) => {
            const newCategories = activeCategories.includes(id)
              ? activeCategories.filter(c => c !== id)
              : [...activeCategories, id];

            setActiveCategories(newCategories);

            // Build current filters into query params
            const params = new URLSearchParams();
            if (advancedFilters.propertyType) params.set('type', advancedFilters.propertyType);
            if (advancedFilters.amenities.length > 0) params.set('amenities', advancedFilters.amenities.join(','));
            if (advancedFilters.bookingOptions.allowsPets) params.set('pets', 'true');
            if (advancedFilters.bookingOptions.selfCheckIn) params.set('self', 'true');
            if (advancedFilters.standoutStays) params.set('standout', advancedFilters.standoutStays);
            if (newCategories.length > 0) params.set('cats', newCategories.join(','));

            const queryString = params.toString();
            const newUrl = `/stays${queryString ? `?${queryString}` : ''}`;

            if (pathname !== '/stays') {
              router.push(newUrl);
            } else {
              router.replace(newUrl, { scroll: false });
            }
          }}
          onFiltersClick={() => setIsFilterModalOpen(true)}
        />

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          initialFilters={advancedFilters}
          draftFilters={draftFilters}
          onDraftFiltersChange={setDraftFilters}
          onApply={applyFiltersWithNav}
          resultCount={getFilteredProperties(draftFilters).length}
        />


        {/* Search Results Header */}
        {(searchQuery.location || searchQuery.guests > 0) && (
          <div className="mb-8 flex items-center justify-between bg-orange-50/50 px-6 py-4 rounded-2xl border border-orange-100/50 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Search size={18} className="text-[#EC5B13]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#EC5B13] mb-0.5">Search Results</p>
                <h3 className="text-sm md:text-base font-bold text-gray-900">
                  Showing stays {searchQuery.guests > 0 ? `for ${searchQuery.guests} ${searchQuery.guests === 1 ? 'guest' : 'guests'}` : ''}
                  {searchQuery.location ? ` in ${searchQuery.location}` : ''}
                </h3>
              </div>
            </div>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('location');
                params.delete('guests');
                params.delete('checkin');
                params.delete('checkout');
                router.push(`/stays?${params.toString()}`);
              }}
              className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors underline underline-offset-4"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Existing Content */}
        {listingTitle && (
          <div className="mb-12 md:mb-16">
            <h1 className="text-[32px] md:text-[64px] font-serif text-gray-900 tracking-tight leading-tight text-center md:text-left">
              {listingTitle}
            </h1>
            {listingDescription && (
              <p className="text-gray-500 mt-4 text-lg md:text-2xl max-w-2xl md:max-w-none font-medium text-center md:text-left">
                {listingDescription}
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-[#EC5B13] mb-4" />
            <p className="text-gray-500 font-medium">Discovering best stays for you...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-serif text-gray-900 mb-2">No properties match your filters</h3>
            <p className="text-gray-500">Try adjusting your categories or facilities.</p>
          </div>
        ) : viewMode === "carousel" ? (
          <div>
            <StayCarousel
              title={title || "Top Rated Stays in Goa"}
              stays={filteredProperties}
            />
            <div className="flex justify-center mt-8">
              <Link
                href="/stays"
                className="px-12 py-4 bg-black text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-gray-900 transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                View More Stays
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredProperties.map((property: Property) => (
              <StayCard
                key={property.id}
                id={property.id}
                slug={property.slug}
                title={formatPropertyTitle(property.listing_title, property.ls_id)}
                location={property.city}
                category={property.category}
                bedrooms={property.bedrooms}
                image={property.images?.[0]}
                rating={generateRating(property.id)}
                trending={property.is_trending}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
