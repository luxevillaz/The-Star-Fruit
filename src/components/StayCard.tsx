"use client";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { slugify } from "@/utils/seo";

interface StayCardProps {
  id: string;
  title: string;
  location: string;
  category: string;
  bedrooms?: number;
  rating?: number;
  image: string;
  trending?: boolean;
}

const generateRating = (id: string) => {
  if (!id) return 4.8;
  const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Number((4.5 + (sum % 6) / 10).toFixed(1));
};

export default function StayCard({ 
  id, 
  title, 
  location, 
  category, 
  bedrooms, 
  rating, 
  image, 
  trending 
}: StayCardProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const displayRating = rating ?? generateRating(id);

  useEffect(() => {
    async function checkSavedStatus() {
      if (!supabase) return;
      const { data: { session: curSession } } = await supabase.auth.getSession();
      if (!curSession) return;
      setSession(curSession);

      const { data } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('user_id', curSession.user.id)
        .eq('property_id', id)
        .maybeSingle();

      if (data) setIsSaved(true);
    }
    checkSavedStatus();
  }, [id]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push("/login");
      return;
    }

    const newSaveState = !isSaved;
    setIsSaved(newSaveState);

    try {
      if (!supabase) return;
      if (!newSaveState) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', session.user.id)
          .eq('property_id', id);
      } else {
        await supabase
          .from('saved_properties')
          .insert({ user_id: session.user.id, property_id: id });
      }
    } catch (err) {
      console.error("Error toggling save:", err);
      setIsSaved(!newSaveState);
    }
  };

  // const stayUrl = `/stays/${slugify(title)}-${id}`;
  const stayUrl = `/stays/${slug}`;

  return (
    <div className="w-full group cursor-pointer">
      <Link href={stayUrl}>
        <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
          <Image
            src={image || "/images/stays/pool_villa.webp"}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-1000"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
           unoptimized/>
          <button 
            onClick={handleToggleSave}
            className={`absolute top-4 right-4 p-2.5 backdrop-blur-xl rounded-full transition-all shadow-lg duration-300 ${
              isSaved 
                ? "bg-white text-red-500 opacity-100" 
                : "bg-white/20 text-white hover:bg-white hover:text-black opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
            }`}
          >
            <Heart size={18} className={isSaved ? "fill-red-500" : "hover:fill-current"} />
          </button>
          {trending && (
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-[#FF5A5F] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
              Trending
            </div>
          )}
        </div>
      </Link>
      
      <div className="flex justify-between items-center mb-1 px-1">
        <Link href={stayUrl} className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-black transition-colors truncate pr-2 tracking-tight">{title}</h3>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <Star size={13} className="fill-[#FFB400] text-[#FFB400]" />
          <span className="text-[13px] font-bold text-gray-800">{displayRating.toFixed(1)}</span>
        </div>
      </div>
      
      <p className="text-[12px] text-gray-500 font-medium px-1 mb-4 truncate">
        {bedrooms ? `${bedrooms} BHK ` : ""}{category} • {location}
      </p>
      
      <div className="px-1">
        <Link href={stayUrl}>
          <button className="px-5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-900 text-[11px] font-bold rounded-full transition-all border border-gray-100 hover:border-gray-200 shadow-sm">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}
