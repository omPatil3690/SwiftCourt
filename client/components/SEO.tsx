import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description?: string;
  keywords?: string;
  path?: string;
};

const SEO = ({ title, description = "Book local sports courts in real-time with QuickCourt.", keywords, path = "/" }: SEOProps) => (
  <Helmet>
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    {keywords && <meta name="keywords" content={keywords} />}
    <link rel="canonical" href={path} />
    <meta property="og:title" content={title} />
    {description && <meta property="og:description" content={description} />}
  </Helmet>
);

export default SEO;
