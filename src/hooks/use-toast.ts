import { toast as sonnerToast } from "sonner"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast({ title, description, variant }: ToastProps) {
  const message = title || description || ""
  
  if (variant === "destructive") {
    sonnerToast.error(message, {
      description: title && description ? description : undefined,
    })
  } else {
    sonnerToast.success(message, {
      description: title && description ? description : undefined,
    })
  }
}

export { toast as useToast }