import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/utils/seo';

export const revalidate = 86400; // Cache for 24 hours (ISR)

export async function GET() {
  try {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { data: properties, error } = await supabase
      .from('properties')
      // .select('id, listing_title, updated_at, status')
      .select('id, slug, listing_title, updated_at, status')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${(properties || []).map(prop => {
    // const slug = `${slugify(prop.listing_title)}-${prop.id}`;
    const slug = prop.slug || slugify(prop.listing_title || "");
    const lastmod = prop.updated_at 
      ? new Date(prop.updated_at).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];
    return `
  <url>
    <loc>https://www.luxevillaz.com/stays/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('').trim()}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600'
      }
    });
  } catch (error) {
    console.error('Error generating properties sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
