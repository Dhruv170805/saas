'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
}

const SeoHead = ({ title, description, image, article }: SeoProps) => {
  const pathname = usePathname();
  const siteName = 'NEXUS POS';
  const defaultTitle = 'NEXUS | Next-Gen Restaurant OS';
  const defaultDescription = 'The ultimate command center for modern restaurant management. Zero-latency, multi-tenant, and AI-powered.';
  const url = `https://nexuspos.local${pathname}`;

  const seoTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const seoDescription = description || defaultDescription;

  return (
    <>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Open Graph */}
      <meta property="og:url" content={url} />
      {article && <meta property="og:type" content="article" />}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      {image && <meta name="twitter:image" content={image} />}
      
      <link rel="canonical" href={url} />
    </>
  );
};

export default SeoHead;
