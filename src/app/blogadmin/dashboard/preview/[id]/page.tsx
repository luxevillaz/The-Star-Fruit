"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import { blogService } from "@/services/blogService";
import { calculateReadingTime } from "@/utils/seo";
import { Blog } from "@/types/blog";

export default function AdminBlogPreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadBlog(id as string);
    }
  }, [id]);

  const loadBlog = async (blogId: string) => {
    try {
      const data = await blogService.getBlogById(blogId);
      if (!data) throw new Error("Blog not found");
      setBlog(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load blog preview");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EC5B13]"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Preview</h1>
        <p className="text-red-500 mb-4">{error || "Blog not found"}</p>
        <button onClick={() => router.back()} className="text-[#EC5B13] font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  const readingTime = calculateReadingTime(blog.content);

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Preview Banner */}
      <div className="bg-orange-100 text-orange-800 text-center py-2 font-bold text-sm">
        Admin Preview Mode — {blog.status === 'draft' ? 'This blog is currently a DRAFT' : 'This blog is PUBLISHED'}
      </div>

      <article className="pb-24">
        {/* Article Header */}
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-12">
          <button onClick={() => router.back()} className="inline-flex items-center text-sm font-bold text-[#EC5B13] hover:gap-2 transition-all mb-8">
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
          </button>
          


          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 mb-6 leading-tight">
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

        {/* Article Content */}
        <div className="max-w-3xl mx-auto px-4 flex flex-col md:flex-row gap-12">
          <div className="flex-1 w-full">
            <div 
               className="prose prose-base max-w-none prose-p:text-gray-700 prose-p:font-medium prose-p:leading-[1.6] prose-headings:font-serif prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-a:text-[#EC5B13] prose-img:rounded-2xl"
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

            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-2">
                <span className="text-sm font-bold text-gray-900 mr-2 self-center">Tags:</span>
                {blog.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
