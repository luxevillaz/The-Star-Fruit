
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PropertyDetailsClient from "./PropertyDetailsClient";
import { slugify } from "@/utils/seo";

type Params = Promise<{ id: string }>;

const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getRealId = (id: string): string => {
  const match = id.match(UUID_REGEX);
  return match ? match[0] : id;
};

const isLegacyUrl = (id: string): boolean =>
  UUID_REGEX.test(id);

const getCanonicalSlug = (property: {
  slug?: string | null;
  listing_title?: string | null;
}) => {
  return property.slug || slugify(property.listing_title || "");
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;

  if (!supabase) {
    return { title: "Property Details | LuxeVillaz" };
  }

  const realId = getRealId(id);

  const { data: property, error } = isLegacyUrl(id)
    ? await supabase
        .from("properties")
        .select(
          "id, slug, listing_title, listing_description, city, state, category, images"
        )
        .eq("id", realId)
        .single()
    : await supabase
        .from("properties")
        .select(
          "id, slug, listing_title, listing_description, city, state, category, images"
        )
        .eq("slug", id)
        .single();

  if (error || !property) {
    return { title: "Property Not Found | LuxeVillaz" };
  }

  const title = property.listing_title || "Property Details";
  const city = property.city || "";
  const category = property.category || "";
  const desc = property.listing_description || "";
  const shortDesc =
    desc.length > 100 ? desc.slice(0, 100) + "..." : desc;

  const metaDescription =
    `Book ${title} from Luxevillaz, the best property in ` +
    `${property.state || ""}, ${city}.\n${shortDesc}`;

  const canonicalSlug = getCanonicalSlug(property);
  const canonicalUrl =
    `https://www.luxevillaz.com/stays/${canonicalSlug}`;

  const keywords = [
    title,
    city ? `${title} ${city}` : "",
    city ? `${title}, ${city}` : "",
    `${title} Booking`,
    `${title} Deals`,
    `${title} Reviews`,
    `${title} Photos`,
    `Book ${title}`,
    category ? `${category} Deals` : "",
    category ? `${category} Booking` : "",
    category && city ? `Luxury ${category} in ${city}` : "",
    category && city ? `Best ${category} in ${city}` : "",
  ].filter(Boolean);

  const firstImage =
    property.images && property.images.length > 0
      ? property.images[0]
      : null;

  return {
    title: `${title} | LuxeVillaz`,
    description: metaDescription,
    keywords,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | LuxeVillaz`,
      description: metaDescription,
      url: canonicalUrl,
      type: "website",
      images: firstImage ? [{ url: firstImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | LuxeVillaz`,
      description: metaDescription,
      images: firstImage ? [firstImage] : [],
    },
  };
}

export default async function PropertyDetailsPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  if (!supabase) {
    notFound();
  }

  const realId = getRealId(id);

  const { data: property, error } = isLegacyUrl(id)
    ? await supabase
        .from("properties")
        .select("*")
        .eq("id", realId)
        .single()
    : await supabase
        .from("properties")
        .select("*")
        .eq("slug", id)
        .single();

  if (error || !property) {
    notFound();
  }

  const canonicalSlug = getCanonicalSlug(property);

  // Redirect old UUID URLs to the clean property URL.
  if (isLegacyUrl(id)) {
    permanentRedirect(`/stays/${canonicalSlug}`);
  }

  // Prevent duplicate URLs if a property has an outdated slug.
  if (id !== canonicalSlug) {
    permanentRedirect(`/stays/${canonicalSlug}`);
  }

  return <PropertyDetailsClient initialProperty={property} />;
}
