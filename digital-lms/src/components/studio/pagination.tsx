"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function StudioPagination({
  page,
  totalPages,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  function href(p: number) {
    const sp = new URLSearchParams();
    Object.entries(searchParams || {}).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    sp.set("page", String(p));
    const q = sp.toString();
    return `${basePath}?${q}`;
  }

  if (totalPages <= 1 && total <= 20) {
    return (
      <p className="text-xs text-stone-500">
        {total} item{total === 1 ? "" : "s"}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-xs text-stone-500">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)}>
            <Button variant="outline" size="sm">
              Previous
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {page < totalPages ? (
          <Link href={href(page + 1)}>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

/** Client-side pager for fetch-based tables */
export function ClientPagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-xs text-stone-500">
        Page {page} of {Math.max(1, totalPages)} · {total} total
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
