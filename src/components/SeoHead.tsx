import { Helmet } from "react-helmet-async";

interface Props {
  title: string;
  description?: string;
  path?: string; // relative path, e.g. "/auth"
  noIndex?: boolean;
}

/**
 * Per-route head tags. Sets title, description, canonical and og:* values.
 * Pairs with the sitewide fallback in index.html for non-JS crawlers.
 */
export default function SeoHead({ title, description, path, noIndex }: Props) {
  const canonical = path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
}
