import { Calendar, BookOpen, Users, MessageSquare, Home } from "lucide-react";
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

export interface LokaalDetail {
  id: string;
  key: string;
  value: string;
}
export interface LokaalBlock {
  id: string;
  title: string;
  emoji: string;
  details: LokaalDetail[];
}

export interface FoodItem {
  id: string;
  name: string;
  priceNonMember: string;
  priceMember: string;
  available: boolean;
}

export interface FoodCategory {
  id: string;
  title: string;
  emoji: string;
  items: FoodItem[];
}

export interface Sponsor {
  id: string;
  name: string;
  description: string;
  url: string;
  emoji: string;
}

export interface CodeSnippet {
  id: string;
  filename: string;
  code: string;
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
    href: "/contact",
  },
  {
    id: "lokaal",
    label: "lokaal",
    description: "Room info, 3D printer, food & more",
    icon: <Home className="w-5 h-5" />,
    href: "/lokaal",
  },
];

// ============================================
// EVENTS
// ============================================

export const events: Event[] = [
  {
    id: "1",
    title: "Warmste Gamenight",
    date: "2025-12-04",
    time: "19:00-23:00",
    location: "Campus Connect - Hemisfeer",
    description: "in in videogames? Daag je vrienden uit in Mario Kart, Just Dance, FiFa en nog veel meer andere spelletjes! Liever bordspellen? We hebben een enorme selectie klaarstaan. Van MTG (Magic: The Gathering) Catan, Poker ♦️ en nog een hele hoop andere. Kom mee gamen, lachen en warmte verspreiden voor dit goede doel. Iedereen is welkom 🔥 ",
  },
  {
    id: "2",
    title: "Github Workshop 1&2",
    date: "Dates pending",
    time: "Time pending",
    location: "Location Pending",
    description: "Explaining how Git, the best and worst thing ever works. We will cover the basics of version control, how to use Git for your projects, and how to collaborate with others using GitHub. Whether you're a beginner or just looking to brush up on your skills, this workshop will provide you with the knowledge and tools you need to effectively use Git and GitHub in your development workflow.",
  },
  {
    id: "3",
    title: "Pending",
    date: "Pending",
    time: "Pending",
    location: "Pending",
    description: "Also Pending",
  },
];

// ============================================
// BOARD MEMBERS
// ============================================

export const boardMembers: BoardMember[] = [
  { id: "1", name: "Willem Speetjens", role: "Penningmeester en Voorzitter externe werking" },
  { id: "2", name: "Thomas Peelman", role: "Secretaris" },
  { id: "3", name: "Xander D'Hondt", role: "Voorlopig in het buitenland op Stage"},
  { id: "4", name: "Lander Goffings", role: "Systeembeheerder" },
  { id: "5", name: "Bram Roden", role: "Workshopmaster" },
  { id: "6", name: "Gleb Tanakov", role: "Everything And Nothing"},
  { id: "7", name: "Jonas Van Bussel", role: "Sociale Media"},
  { id: "8", name: "Daniel Pereira", role: "Verantwoordelijke informatie buitenlandse studenten." },
];

// ============================================
// RESOURCES
// ============================================

export const resources: Resource[] = [
  {
    id: "1",
    title: "Examenwiki",
    description: "Collection of past exams and solutions",
    url: "https://wiki.iswleuven.be",
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

// ============================================
// LOKAAL (ROOM) DETAILS
// ============================================
export const lokaalBlocks: LokaalBlock[] = [
  {
    id: "room",
    title: "Room Status",
    emoji: "🚪",
    details: [
      { id: "r1", key: "Open", value: "Maybe." },
      { id: "r2", key: "Location", value: "Block B, Basement" },
      { id: "r3", key: "Access", value: "Anyone if an active member is present" },
    ],
  },
  {
    id: "printer",
    title: "3D Printer",
    emoji: "🖨️",
    details: [
      { id: "p1", key: "Model", value: "Bambu Lab A1" },
      { id: "p2", key: "Material", value: "Filament (PLA black)" },
      { id: "p3", key: "Cost", value: "€0.06/g for single use,if (member && pay_for_semester) 19 euro else 29 euro per school year" },
      { id: "p4", key: "Booking", value: "Message the PR-meester" },
    ],
  },

];

// ============================================
// FOOD & DRINKS
// ============================================

export const foodCategories: FoodCategory[] = [
  {
    id: "drinks",
    title: "Drinks",
    emoji: "🥤",
    items: [
      {
        id: "d1",
        name: "Aquarius Lemon/Red Peach 50cl",
        priceNonMember: "€2.50",
        priceMember: "€2.00",
        available: true,
      },
      {
        id: "d2",
        name: "RODEO 25cl",
        priceNonMember: "€1.00",
        priceMember: "€0.70",
        available: true,
      },
      {
        id: "d3",
        name: "chcolate milk",
        priceNonMember: "€1.50",
        priceMember: "€1.00",
        available: true,
      },
    ],
  },
  {
    id: "snacks",
    title: "Snacks",
    emoji: "🍟",
    items: [
      {
        id: "s1",
        name: "Small Aiki noodles Chicken/Curry/Hot&Spicy",
        priceNonMember: "€2.00",
        priceMember: "€1.50",
        available: true,
      },
      {
        id: "s2",
        name: "Dorito's",
        priceNonMember: "€2.50",
        priceMember: "€2.00",
        available: true,
      },
      {
        id: "s3",
        name: "Lay's Natural/Paprika/Salt&Pepper 40g",
        priceNonMember: "€1.20",
        priceMember: "€1.00",
        available: true,
      },
    ],
  },
  {
    id: "coffee",
    title: "Coffee",
    emoji: "☕",
    items: [
      {
        id: "c1",
        name: "Pads Coffee",
        priceNonMember: "€0.20",
        priceMember: "€0.16",
        available: true,
      },
      {
        id: "c2",
        name: "Pads Deca Coffee",
        priceNonMember: "€0.20",
        priceMember: "€0.16",
        available: true,
      },
      {
        id: "c3",
        name: "Senseo Extra Strong",
        priceNonMember: "€0.40",
        priceMember: "€0.32",
        available: true,
      },
      {
        id: "c4",
        name: "Volle Melk",
        priceNonMember: "N/A",
        priceMember: "N/A",
        available: false,
      },
      {
        id: "c5",
        name: "Halfvolle Melk",
        priceNonMember: "N/A",
        priceMember: "N/A",
        available: false,
      },
    ],
  },
];

// ============================================
// SPONSORS
// ============================================

export const sponsors: Sponsor[] = [
  {
    id: "1",
    name: "UCLL Leuven",
    description: "Host university",
    url: "https://ucll.be",
    emoji: "🏛️",
  },
  {
    id: "2",
    name: "Placeholder Sponsor",
    description: "Your company here",
    url: "#",
    emoji: "🤝",
  },
];

// ============================================
// FLOATING CODE SNIPPETS
// ============================================

export const codeSnippets: CodeSnippet[] = [
  {
    id: "1",
    filename: "hello.py",
    code: `def greet(name):
    return f"Hello, {name}!"
print(greet("ISW"))`,
  },
  {
    id: "2",
    filename: "fibonacci.js",
    code: `const fib = (n) =>
  n <= 1 ? n
  : fib(n-1) + fib(n-2);`,
  },
  {
    id: "3",
    filename: "main.rs",
    code: `fn main() {
    println!("ISW Leuven");
    let x = 42;
}`,
  },
  {
    id: "4",
    filename: "sort.c",
    code: `void swap(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}`,
  },
  {
    id: "5",
    filename: "query.sql",
    code: `SELECT name, role
FROM praesidium
WHERE active = true;`,
  },
  {
    id: "6",
    filename: "style.css",
    code: `.terminal {
  background: #0a0a0a;
  color: #00ff00;
  font-family: monospace;
}`,
  },
  {id: "7",
    filename: "app.jsx",
    code: `import React from 'react';
const App = () => <h1>ISW Leuven</h1>;
export default App;`,
  },
  {id: "8",
    filename: "Pages.tsx",
    code: `/about
    /contact
    /events
    /resources
    /lokaal
    /adult
    /catgirls`,
  },
  {id: "9",
    filename: "types.ts",
    code: `Konami Code Hook — ↑↑↓↓←→←→BA
  `}
];

