export interface Bookmark {
  name: string;
  url: string;
  icon?: string;
}

export interface BookmarkCollection {
  id: string | number;
  title: string;
  desc?: string;
  category?: string;
  tags?: string[];
  links: Bookmark[];
  url?: string; // Legacy support
}

export interface Note {
  id: string | number;
  title: string;
  content: string;
  date: string;
  isPinned?: boolean;
  color?: 'yellow' | 'blue' | 'green' | 'purple' | 'rose' | 'slate';
}

export interface Space {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'regular';
  bookmarks: BookmarkCollection[];
  notes: Note[];
  autoLockMinutes?: number;
}

export interface EncryptedSpace {
  id: string;
  username: string;
  role: 'admin' | 'regular';
  cipherText: string;
  iv: string;
  salt: string;
  bookmarksCount?: number;
  notesCount?: number;
}

export interface Post {
  id: number | string;
  title: string;
  date: string;
  summary: string;
}

export interface PublicConfig {
  title: string;
  subtitle: string;
  logoText: string;
  logoImage: string;
  navItems: {
    home: string;
    articles: string;
    about: string;
  };
  primaryColor: string; // fallback color theme preset
  accentColor?: string; // custom hex accent color
  layoutTemplate?: 'hero' | 'grid' | 'minimal'; // decoy layout structure
  fontFamily?: 'sans' | 'serif' | 'mono'; // decoy typography style
  heroImage: string;
  posts: Post[];
  articles: Post[];
  about: {
    title: string;
    content: string;
  };
  showLoginBtn: boolean;
}

export interface GlobalData {
  isSetup: boolean;
  publicConfig: PublicConfig;
  spaces?: EncryptedSpace[]; // Store encrypted versions in localStorage
}
