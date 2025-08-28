import React from "react";

export const SearchContext = React.createContext<{
  search: string;
  setSearch: (v: string) => void;
}>({
  search: "",
  setSearch: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = React.useState("");
  return (
    <SearchContext.Provider value={{ search, setSearch }}>
      {children}
    </SearchContext.Provider>
  );
} 