export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
}

export const updateSEO = (seoData: SEOData) => {
  // Update title
  document.title = seoData.title;

  // Update or create meta tags
  const updateMetaTag = (name: string, content: string, property = false) => {
    const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let meta = document.querySelector(selector) as HTMLMetaElement;
    
    if (!meta) {
      meta = document.createElement('meta');
      if (property) {
        meta.setAttribute('property', name);
      } else {
        meta.setAttribute('name', name);
      }
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  };

  // Update basic meta tags
  updateMetaTag('description', seoData.description);
  if (seoData.keywords) {
    updateMetaTag('keywords', seoData.keywords);
  }

  // Update Open Graph tags
  updateMetaTag('og:title', seoData.ogTitle || seoData.title, true);
  updateMetaTag('og:description', seoData.ogDescription || seoData.description, true);
  if (seoData.ogImage) {
    updateMetaTag('og:image', seoData.ogImage, true);
  }

  // Update Twitter tags
  updateMetaTag('twitter:title', seoData.ogTitle || seoData.title, true);
  updateMetaTag('twitter:description', seoData.ogDescription || seoData.description, true);

  // Update canonical URL
  if (seoData.canonical) {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', seoData.canonical);
  }
};

export const seoPages = {
  home: {
    title: 'Viking Chess Online - Play Hnefatafl Multiplayer | Strategic Norse Board Game',
    description: 'Play authentic Viking chess (Hnefatafl) online with real-time multiplayer battles. Join the Norse strategy game with 11x11 board, king vs attackers gameplay, and Viking-themed design.',
    keywords: 'viking chess, hnefatafl, norse board game, multiplayer chess, strategy game, online board game, viking game, tactical game',
    canonical: 'https://viking-chess-online.replit.app'
  },
  
  auth: {
    title: 'Login & Register - Viking Chess Online | Join the Norse Battle',
    description: 'Create your Viking warrior account or login to play Hnefatafl online. Join thousands of players in strategic Norse board game battles with real-time multiplayer gameplay.',
    keywords: 'viking chess login, hnefatafl register, norse game account, multiplayer board game signup',
    canonical: 'https://viking-chess-online.replit.app/auth'
  },
  
  lobby: {
    title: 'Game Lobby - Viking Chess Online | Find Opponents & Create Battles',
    description: 'Browse active Viking chess games, create new Hnefatafl battles, and challenge opponents. Join the lobby to find players of your skill level for strategic Norse board game matches.',
    keywords: 'viking chess lobby, hnefatafl multiplayer, find opponents, create game, norse strategy battles',
    canonical: 'https://viking-chess-online.replit.app/lobby'
  },
  
  game: {
    title: 'Viking Chess Game - Hnefatafl Battle in Progress | Strategic Norse Warfare',
    description: 'Experience authentic Hnefatafl gameplay with real-time moves, chat, and strategic battles. Master the ancient Norse board game with king escape mechanics and tactical piece captures.',
    keywords: 'hnefatafl gameplay, viking chess battle, norse strategy game, real-time multiplayer, tactical board game',
    canonical: 'https://viking-chess-online.replit.app/game'
  }
};