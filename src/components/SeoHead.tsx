import { Helmet } from "react-helmet-async";

interface Props {
  title: string;
  description?: string;
  path?: string; // relative path, e.g. "/chat" — used for canonical/og:url
  noIndex?: boolean;
}

const SITE = "https://ledion.life";

/**
 * Per-route head tags. Sets title, description, canonical and og:* values.
 * Pairs with the sitewide fallback in index.html for non-JS crawlers.
 */
export default function SeoHead({ title, description, path, noIndex }: Props) {
  const rel = path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const absolute = rel.startsWith("http") ? rel : `${SITE}${rel.startsWith("/") ? rel : `/${rel}`}`;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={absolute} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={absolute} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
}
