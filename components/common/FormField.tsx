import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  FieldErrors,
  Path,
  UseFormRegister,
  FieldValues,
} from "react-hook-form";

interface FormFieldProps<T extends FieldValues> {
  id: string;
  type?: string;
  disabled?: boolean;
  placeholder: string;
  label?: string;
  inputClassNames?: string;
  register: UseFormRegister<T>;
  errors: FieldErrors;
}

const FormField = <T extends FieldValues>({
  id,
  type,
  disabled,
  placeholder,
  label,
  inputClassNames,
  register,
  errors,
}: FormFieldProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);
  const message = errors[id] && (errors[id]?.message as string);
  const isPasswordField = type === "password";

  return (
    <div>
      {label && <span className="block text-sm">{label}</span>}
      <div className="relative">
        <input
          id={id}
          disabled={disabled}
          placeholder={placeholder}
          type={isPasswordField && showPassword ? "text" : type}
          {...register(id as Path<T>)}
          className={cn(
            "w-full p-3 my-2 outline-none rounded-md disabled:opacity-70 disabled:cursor-not-allowed border border-slate-300 dark:border-slate-700",
            isPasswordField && "pr-11",
            errors[id] && "border-rose-400",
            inputClassNames,
          )}
        />
        {isPasswordField && (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {message && <span className="text-sm text-rose-400">{message}</span>}
    </div>
  );
};

export default FormField;
