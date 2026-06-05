import { Button, type ButtonProps } from "@heroui/react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type PrimaryActionButtonProps = ButtonProps & {
  to?: string;
};

export function PrimaryActionButton({
  to,
  className,
  children,
  ...props
}: PrimaryActionButtonProps) {
  const classes = cn(
    "rounded-full font-bold shadow-xl shadow-primary/30",
    className
  );

  if (to) {
    return (
      <Button as={Link} to={to} color="primary" className={classes} {...props}>
        {children}
      </Button>
    );
  }

  return (
    <Button color="primary" className={classes} {...props}>
      {children}
    </Button>
  );
}
