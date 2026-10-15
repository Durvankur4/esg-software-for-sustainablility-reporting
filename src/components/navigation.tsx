"use client";

import { usePathname } from "next/navigation";

const links = [{ href: "/evidence/extract", label: "AI Extraction" }];

export function Navigation() {
  const pathname = usePathname();
  return <nav className="navigation" aria-label="Main navigation">{links.map(({ href, label }) => <a className={`nav-link${pathname?.startsWith(href) ? " nav-link--active" : ""}`} href={href} key={href}>{label}</a>)}</nav>;
}
