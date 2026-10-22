import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import { blogService } from "@/services/blogService";
import { calculateReadingTime } from "@/utils/seo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Next.js 15+ requires params to be a Promise
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const resolvedParams = await params;
  const blog = await blogService.getBlogBySlug(resolvedParams.slug);

  if (!blog) return { title: "Blog Not Found" };

  return {
    title: blog.seo_title || blog.title,
    description: blog.seo_description || blog.excerpt,
    openGraph: {
      title: blog.seo_title || blog.title,
      description: blog.seo_description || blog.excerpt,
      type: "article",
      publishedTime: blog.published_at || blog.created_at,
      authors: [],
      images: blog.featured_image ? [{ url: blog.featured_image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.seo_title || blog.title,
      description: blog.seo_description || blog.excerpt,
      images: blog.featured_image ? [blog.featured_image] : [],
    },
    robots: {
      index: blog.is_indexable ?? true,
      follow: blog.is_indexable ?? true,
    }
  };
}

export default async function BlogDynamicPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const blog = await blogService.getBlogBySlug(resolvedParams.slug);

  if (!blog) {
    notFound();
  }

  const readingTime = calculateReadingTime(blog.content);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <article className="pt-16">
        {/* Article Header */}
        <div className="max-w-4xl mx-auto px-4 pt-0 pb-12">
          <Link href="/blogs" className="inline-flex items-center text-sm font-bold text-[#EC5B13] hover:gap-2 transition-all mb-8">
            <ArrowLeft size={16} className="mr-1" /> Back to Journal
          </Link>          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-100 pb-8">
            {blog.category && (
              <div className="flex items-center">
                <Tag size={16} className="mr-2" />
                <span className="font-medium text-gray-900">{blog.category}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              <span>{format(new Date(blog.published_at || blog.created_at), 'MMMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span>{readingTime} min read</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {blog.featured_image && (
          <div className="max-w-5xl mx-auto px-4 mb-16">
            <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-xl">
              <Image
                src={blog.featured_image}
                alt={blog.title}
                fill
                className="object-cover"                unoptimized/>
            </div>
          </div>
        )}

        {/* Article Content & Sidebar */}
        <div className="max-w-4xl mx-auto px-4 pb-24 flex flex-col md:flex-row gap-12">


          {/* Content */}
          {/* <div className="flex-1 max-w-prose w-full mx-auto"> */}
          <div className="flex-1 w-full mx-auto">
            {/* Prose renders the HTML from our rich text editor */}
            <div
              className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-a:text-[#EC5B13] prose-img:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* FAQs */}
            {blog.faqs && blog.faqs.length > 0 && (
              <div className="mt-16 border-t border-gray-100 pt-12">
                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  {blog.faqs.map((faq, index) => (
                    <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{faq.question}</h3>
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-2">
                <span className="text-sm font-bold text-gray-900 mr-2 self-center">Tags:</span>
                {blog.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-gray-100 transition-colors cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}


          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
}
