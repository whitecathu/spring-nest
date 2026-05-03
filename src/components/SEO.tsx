import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  type?: string;
}

const SITE_URL = 'https://master.spring-nest.pages.dev';

const DEFAULTS = {
  title: 'Spring Nest - 春日小筑 | 实用工具与休闲小游戏',
  description:
    'Spring Nest 春日小筑提供轻量实用的在线工具和休闲小游戏，支持收藏、搜索与 PWA 离线体验。',
  ogImage: '/og-image.png',
  type: 'website',
};

function setMetaByName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function SEO({
  title,
  description,
  ogImage,
  canonical,
  type,
}: SEOProps) {
  useEffect(() => {
    const t = title ?? DEFAULTS.title;
    const d = description ?? DEFAULTS.description;
    const img = ogImage ?? DEFAULTS.ogImage;
    const ogType = type ?? DEFAULTS.type;
    const url = canonical ?? `${SITE_URL}${window.location.pathname}`;

    // Document title
    document.title = t;

    // Standard meta
    setMetaByName('description', d);

    // Open Graph
    setMetaByProperty('og:title', t);
    setMetaByProperty('og:description', d);
    setMetaByProperty('og:type', ogType);
    setMetaByProperty('og:url', url);
    setMetaByProperty('og:image', img.startsWith('http') ? img : `${SITE_URL}${img}`);

    // Twitter Card
    setMetaByName('twitter:card', 'summary_large_image');
    setMetaByName('twitter:title', t);
    setMetaByName('twitter:description', d);
    setMetaByName(
      'twitter:image',
      img.startsWith('http') ? img : `${SITE_URL}${img}`,
    );

    // Canonical
    setCanonical(url);
  }, [title, description, ogImage, canonical, type]);

  return null;
}
