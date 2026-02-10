import { Calendar, BookOpen, Users, MessageSquare } from "lucide-react";
import { ReactNode } from "react";

// ============================================
// TYPES
// ============================================

export interface Command {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  href?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: "exams" | "tools" | "courses";
}

// ============================================
// NAVIGATION COMMANDS
// ============================================

export const commands: Command[] = [
  {
    id: "events",
    label: "events",
    description: "View upcoming events and activities",
    icon: <Calendar className="w-5 h-5" />,
    href: "/events",
  },
  {
    id: "resources",
    label: "examenwiki",
    description: "Access exam resources and study materials",
    icon: <BookOpen className="w-5 h-5" />,
    href: "/resources",
  },
  {
    id: "about",
    label: "about",
    description: "Learn about ISW Leuven and the board",
    icon: <Users className="w-5 h-5" />,
    href: "/about",
  },
  {
    id: "contact",
    label: "contact",
    description: "Get in touch with the board",
    icon: <MessageSquare className="w-5 h-5" />,
    href: "/about#contact",
  },
];







// ============================================
// EVENTS
// ============================================

export const events: Event[] = [
  {
    id: "1",
    title: "TESTING",
    date: "2025-02-15",
    time: "20:00",
    location: "campus connect",
    description: "69420",
  },
  {
    id: "2",
    title: "Testing again",
    date: "2025-02-20",
    time: "14:00",
    location: "Library Room 3.14",
    description: "Testing a different amount of text to see how it looks in the card layout. This should be enough to test the wrapping and spacing.",
  }
];

// ============================================
// BOARD MEMBERS
// ============================================

export const boardMembers: BoardMember[] = [
  { id: "1", name: "Willem Speetjens", role: "Penningmeester" },
  { id: "2", name: "Thomas Peelman", role: "Secretaris" },
  { id: "3", name: "Xander D'Hondt", role: "Voorzitter externe werking"},
  { id: "4", name: "Lander Goffings", role: "Systeembeheerder" },
  { id: "5", name: "Bram Roden", role: "Workshopmaster" },
  { id: "6", name: "Gleb Tanakov", role: "nothing"},
  { id: "7", name: "Jonas Van Bussel", role: "Sociale Media"},
];

// ============================================
// RESOURCES
// ============================================

export const resources: Resource[] = [
  {
    id: "1",
    title: "Examenwiki",
    description: "Collection of past exams and solutions",
    url: "/NotFound",
    category: "exams",
  },
  {
    id: "2",
    title: "Toledo (KU Leuven)",
    description: "Official course materials and announcements",
    url: "https://toledo.kuleuven.be",
    category: "courses",
  },
  {
    id: "3",
    title: "Wolfram Alpha",
    description: "Computational engine for math problems",
    url: "https://wolframalpha.com",
    category: "tools",
  },
  
  {
    id: "5",
    title: "Symbolab",
    description: "Step-by-step math solver",
    url: "https://symbolab.com",
    category: "tools",
  },
  {
    id: "6",
    title: "KU Leuven Bibliotheek",
    description: "Access to academic papers and books",
    url: "https://bib.kuleuven.be",
    category: "courses",
  },
  {
    id: "8",
    title: "Quizlet",
    description: "Flashcards and study sets",
    url: "https://quizlet.com",
    category: "tools",
  },
  {
    id: "9",
    title: "Zotero",
    description: "Free citation manager for papers",
    url: "https://zotero.org",
    category: "tools",
  },
  {
    id: "10",
    title: "Overleaf",
    description: "LaTeX editor for reports and theses",
    url: "https://overleaf.com",
    category: "tools",
  },
  {
    id: "11",
    title: "Google Scholar",
    description: "Search academic papers and citations",
    url: "https://scholar.google.com",
    category: "tools",
  },
];
