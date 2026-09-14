"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CoursesFilter({
  q,
  category,
  tag,
  categories,
}: {
  q: string;
  category: string;
  tag: string;
  categories: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const [cat, setCat] = useState(category);
  const [tagVal, setTagVal] = useState(tag);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (cat) params.set("category", cat);
    if (tagVal.trim()) params.set("tag", tagVal.trim());
    const qs = params.toString();
    router.push(qs ? `/courses?${qs}` : "/courses");
  }

  function clear() {
    setQuery("");
    setCat("");
    setTagVal("");
    router.push("/courses");
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="min-w-[180px] flex-1">
        <label className="mb-1 block text-xs font-medium text-stone-500">Search</label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, tags…"
        />
      </div>
      <div className="w-44">
        <label className="mb-1 block text-xs font-medium text-stone-500">Category</label>
        <select
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="w-40">
        <label className="mb-1 block text-xs font-medium text-stone-500">Tag</label>
        <Input value={tagVal} onChange={(e) => setTagVal(e.target.value)} placeholder="e.g. beginner" />
      </div>
      <Button type="submit" size="sm">
        Filter
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={clear}>
        Clear
      </Button>
    </form>
  );
}
