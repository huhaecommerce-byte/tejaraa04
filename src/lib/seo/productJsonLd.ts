// Shared JSON-LD builders for product structured data (browser-safe, no server imports).

/** Strip HTML + any contact artifacts (emails, phone numbers) so they never leak into search snippets. */
export function cleanProductText(raw: string | null | undefined): string {
  return (raw ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/gi, ' ')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, ' ')
    .replace(/\+?\d[\d\s().-]{6,}\d/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type SeoReview = {
  rating: number;
  title: string;
  body: string;
  created_at: string;
  author_name: string;
};

/**
 * shippingDetails + hasMerchantReturnPolicy for the product Offer.
 * Rates reflect the site's standard Saudi delivery (first order ships free,
 * standard courier from SAR 20, 1–7 business days) and the 7-day return policy.
 */
export function offerMerchantExtras() {
  return {
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: 'SA',
      },
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '20.00',
        currency: 'SAR',
      },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 7, unitCode: 'DAY' },
      },
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'SA',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 7,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
  };
}

/** aggregateRating + review fields — only real reviews, omitted when none exist. */
export function reviewJsonLd(
  ratingAvg: number | null | undefined,
  reviewCount: number | null | undefined,
  reviews: SeoReview[] | null | undefined,
) {
  if (!reviewCount || reviewCount <= 0 || !ratingAvg) return {};
  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Number(ratingAvg).toFixed(1),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    ...(reviews?.length
      ? {
          review: reviews.slice(0, 5).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.author_name },
            datePublished: r.created_at,
            name: r.title || undefined,
            reviewBody: r.body || undefined,
            reviewRating: {
              '@type': 'Rating',
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
  };
}
