import type { PublicConfig } from '../types';

export const STORAGE_KEY = "my_private_site_v6_stealth";
export const THEME_PREF_KEY = "my_private_site_theme_pref";

export const DEFAULT_THEME: PublicConfig = {
  title: "CodeStream",
  subtitle: "Insights into Modern Development",
  logoText: "CS",
  logoImage: "",
  navItems: { home: "Home", articles: "Articles", about: "About" },
  primaryColor: "indigo",
  accentColor: "#4f46e5",
  layoutTemplate: "hero",
  fontFamily: "sans",
  heroImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1000",
  posts: [
    { id: 1, title: "Getting Started with React Hooks", date: "Oct 12, 2023", summary: "Hooks are a new addition in React 16.8. They let you use state and other React features without writing a class." },
    { id: 2, title: "The Future of CSS", date: "Sep 28, 2023", summary: "CSS is evolving rapidly with new features like nesting, layers, and more robust grid systems." },
    { id: 3, title: "Understanding Async/Await", date: "Sep 15, 2023", summary: "Async/await makes asynchronous code look and behave a little more like synchronous code." }
  ],
  articles: [
    { id: 101, title: "10 Tips for Clean Code", date: "Nov 01, 2023", summary: "Writing clean code is essential for maintainability. Here are ten tips to keep your codebase healthy." },
    { id: 102, title: "Why TypeScript?", date: "Oct 25, 2023", summary: "TypeScript adds static typing to JavaScript, making it more robust and easier to scale." }
  ],
  about: { title: "About Us", content: "We are a team of passionate developers exploring the web." },
  showLoginBtn: true
};
