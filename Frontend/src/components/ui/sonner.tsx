import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg font-sans",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!bg-green-950 group-[.toaster]:!border-green-800 group-[.toaster]:!text-green-100",
          warning: "group-[.toaster]:!bg-orange-950 group-[.toaster]:!border-orange-800 group-[.toaster]:!text-orange-100",
          error: "group-[.toaster]:!bg-red-950 group-[.toaster]:!border-red-800 group-[.toaster]:!text-red-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

