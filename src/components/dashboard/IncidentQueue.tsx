import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";

import { IncidentFilterControls } from "@/components/incidents/IncidentFilterControls";
import { IncidentTypeIcon } from "@/components/incidents/IncidentTypeIcon";
import { SeverityBadge } from "@/components/incidents/SeverityBadge";
import { StatusBadge } from "@/components/incidents/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TYPE_LABEL } from "@/lib/incidents/constants";
import { DEFAULT_FILTERS, matchesFilters, type IncidentFilters } from "@/lib/incidents/filters";
import { timeAgo } from "@/lib/incidents/format";
import { compareQueue } from "@/lib/incidents/rules";
import type { Incident } from "@/lib/incidents/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

interface Props {
  incidents: Incident[];
  freshIds: Set<string>;
  onOpen: (id: string) => void;
}

function typeLabel(i: Incident) {
  return i.incident_type ? TYPE_LABEL[i.incident_type] : "Unclassified";
}

export function IncidentQueue({ incidents, freshIds, onOpen }: Props) {
  const [filters, setFilters] = useState<IncidentFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const rows = useMemo(
    () =>
      incidents
        .filter((i) => i.duplicate_of == null && matchesFilters(i, { ...filters, search }))
        .sort(compareQueue),
    [incidents, filters, search],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  useEffect(() => setPage(1), [filters, search]);
  useEffect(() => setPage((p) => Math.min(p, pageCount)), [pageCount]);
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section aria-labelledby="queue-title" className="rounded-md border bg-surface">
      <div className="space-y-3 border-b p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="queue-title" className="label-caps">
            Incident queue
          </h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {rows.length} incident{rows.length === 1 ? "" : "s"} · most severe, then oldest first
          </p>
        </div>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search summary, address or description"
            aria-label="Search incidents"
            className="pl-9"
          />
        </div>
        <div role="group" aria-label="Filter incidents" className="flex flex-wrap gap-2">
          <IncidentFilterControls value={filters} onChange={setFilters} idPrefix="queue" />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">No incidents match these filters.</p>
      ) : (
        <>
          {/* Phone: stacked cards */}
          <ul className="divide-y md:hidden">
            {visible.map((i) => (
              <li key={i.id} className={cn(freshIds.has(i.id) && "animate-row-flash")}>
                <button
                  type="button"
                  onClick={() => onOpen(i.id)}
                  className="flex w-full flex-col gap-2 p-4 text-left hover:bg-accent/50"
                  aria-label={`Open ${typeLabel(i)} incident${i.address_text ? ` at ${i.address_text}` : ""}`}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={i.severity} size="sm" />
                    <StatusBadge status={i.status} />
                    <span className="ml-auto text-xs text-muted-foreground font-mono">{timeAgo(i.created_at)}</span>
                  </span>
                  <span className="flex items-center gap-2 font-medium">
                    <IncidentTypeIcon type={i.incident_type} className="size-4 text-muted-foreground" />
                    {typeLabel(i)}
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <Users aria-hidden className="size-3.5" /> {i.report_count}
                    </span>
                  </span>
                  <span className="line-clamp-1 text-sm text-muted-foreground">{i.address_text ?? "No address"}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Tablet and desktop: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Reports</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((i) => (
                  <TableRow
                    key={i.id}
                    onClick={() => onOpen(i.id)}
                    className={cn("cursor-pointer", freshIds.has(i.id) && "animate-row-flash")}
                  >
                    <TableCell>
                      <SeverityBadge severity={i.severity} size="sm" />
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <IncidentTypeIcon type={i.incident_type} className="size-4 text-muted-foreground" />
                        {typeLabel(i)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate">{i.address_text ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{i.report_count}</TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      <time dateTime={i.created_at}>{timeAgo(i.created_at)}</time>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(i.id);
                        }}
                        aria-label={`Open ${typeLabel(i)} incident${i.address_text ? ` at ${i.address_text}` : ""}`}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <nav aria-label="Queue pages" className="flex items-center justify-between gap-2 border-t p-3 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft aria-hidden className="size-4" /> Prev
            </Button>
            <span aria-live="polite">
              Page {page} of {pageCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount}
              aria-label="Next page"
            >
              Next <ChevronRight aria-hidden className="size-4" />
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}
