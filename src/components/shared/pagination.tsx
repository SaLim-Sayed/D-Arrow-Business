import { Pagination as HeroPagination } from "@heroui/react";

interface PaginationProps {
  total: number;
  page: number;
  onChange: (page: number) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Pagination({ total, page, onChange, className, size = "md" }: PaginationProps) {
  if (total <= 1) return null;

  return (
    <HeroPagination 
      total={total} 
      page={page} 
      onChange={onChange} 
      size={size}
      className={className}
      showControls
    />
  );
}
