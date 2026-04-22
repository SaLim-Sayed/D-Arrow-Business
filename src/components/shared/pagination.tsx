import { 
  PaginationRoot, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationPrevious, 
  PaginationNext,
  PaginationEllipsis
} from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  page: number;
  onChange: (page: number) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Pagination({ total, page, onChange, className, size = "md" }: PaginationProps) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  
  // Basic pagination logic for showing a subset of pages
  const getVisiblePages = () => {
    if (total <= 7) return pages;
    
    if (page <= 4) return [...pages.slice(0, 5), "ellipsis", total];
    if (page >= total - 3) return [1, "ellipsis", ...pages.slice(total - 5)];
    
    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", total];
  };

  const visiblePages = getVisiblePages();

  return (
    <PaginationRoot size={size} className={className}>
      <PaginationContent>
        <PaginationPrevious 
          isDisabled={page <= 1}
          onPress={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </PaginationPrevious>
        
        {visiblePages.map((p, i) => (
          <PaginationItem key={i}>
            {p === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink 
                isActive={p === page}
                onPress={() => onChange(p as number)}
              >
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        
        <PaginationNext 
          isDisabled={page >= total}
          onPress={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </PaginationNext>
      </PaginationContent>
    </PaginationRoot>
  );
}
