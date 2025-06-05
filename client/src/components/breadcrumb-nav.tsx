import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function BreadcrumbNav() {
  const [location] = useLocation();
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    switch (location) {
      case "/":
        return [{ label: "Home" }];
      case "/auth":
        return [
          { label: "Home", href: "/" },
          { label: "Login & Register" }
        ];
      case "/lobby":
        return [
          { label: "Home", href: "/" },
          { label: "Game Lobby" }
        ];
      default:
        if (location.startsWith("/game/")) {
          return [
            { label: "Home", href: "/" },
            { label: "Lobby", href: "/lobby" },
            { label: "Game Battle" }
          ];
        }
        return [{ label: "Home", href: "/" }];
    }
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  // Generate JSON-LD structured data for breadcrumbs
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.label,
      ...(crumb.href && { "item": `https://viking-chess-online.replit.app${crumb.href}` })
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
        <Home className="w-4 h-4" />
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && <ChevronRight className="w-4 h-4" />}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-yellow-400 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-gray-300">{crumb.label}</span>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}