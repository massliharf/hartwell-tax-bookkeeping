import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-xl group-[.toaster]:bg-sheet group-[.toaster]:text-deep-ink group-[.toaster]:border-line-1 group-[.toaster]:shadow-[0_0_2px_rgba(18,18,18,0.08),0_16px_7px_rgba(18,18,18,0.02),0_9px_5px_rgba(18,18,18,0.02),0_4px_4px_rgba(18,18,18,0.04)] group-[.toaster]:text-[13px]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-ink group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
