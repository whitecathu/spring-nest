import type { AppItem } from '../types/app';
import { absoluteUrl } from './site';

export function websiteJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Spring Nest - 春日小筑',
      url: absoluteUrl('/'),
      inLanguage: ['zh-CN', 'en'],
      potentialAction: {
        '@type': 'SearchAction',
        target: `${absoluteUrl('/search')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Spring Nest - 春日小筑',
      url: absoluteUrl('/'),
      logo: absoluteUrl('/pwa-512x512.png'),
    },
  ];
}

export function collectionJsonLd(name: string, description: string, route: string, items: AppItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: absoluteUrl(route),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(item.route),
        name: item.title,
      })),
    },
  };
}

export function itemJsonLd(item: AppItem) {
  return {
    '@context': 'https://schema.org',
    '@type': item.type === 'game' ? 'VideoGame' : 'WebApplication',
    name: `${item.title} ${item.titleEn}`,
    description: item.description,
    url: absoluteUrl(item.route),
    applicationCategory: item.type === 'game' ? 'GameApplication' : 'UtilitiesApplication',
    operatingSystem: 'Any',
    inLanguage: ['zh-CN', 'en'],
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function faqJsonLd(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

