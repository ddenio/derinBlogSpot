import { cn } from "@/lib/utils";
import {
  FieldErrors,
  Path,
  UseFormRegister,
  FieldValues,
} from "react-hook-form";

interface FormFieldProps<T extends FieldValues> {
  id: string;
  disabled?: boolean;
  placeholder: string;
  label?: string;
  inputClassNames?: string;
  register: UseFormRegister<T>;
  errors: FieldErrors;
}

const TextAreaField = <T extends FieldValues>({
  id,
  disabled,
  placeholder,
  label,
  inputClassNames,
  register,
  errors,
}: FormFieldProps<T>) => {
  const message = errors[id] && (errors[id]?.message as string);

  return (
    <div>
      {label && <span className="block text-sm">{label}</span>}
      <textarea
        suppressHydrationWarning
        autoFocus
        autoComplete="off"
        id={id}
        disabled={disabled}
        placeholder={placeholder}
        {...register(id as Path<T>)}
        className={cn(
          "w-full p-3 my-2 rounded-md border border-input bg-transparent outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-70 disabled:cursor-not-allowed min-h-28",
          errors[id] && "border-destructive",
          inputClassNames,
        )}
      />
      {message && <span className="text-sm text-destructive">{message}</span>}
    </div>
  );
};

export default TextAreaField;
