import { useEffect, useRef, useState } from "react";
import { PhotoApiResponse } from "../pages/api/photos";

interface InputProps {
  name: string;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: PhotoApiResponse["validationErrors"];
  placeholder?: string;
}

export default function Input({
  name,
  label,
  placeholder,
  value,
  onChange,
  errors,
}: InputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const em = errors?.find((_) => _.elementId === name)?.uiMessage || "";
    setErrorMessage(em);
    errorRef.current?.classList[!!em ? "remove" : "add"]("invisible");
  }, [errors]);
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        ref={inputRef}
        type="text"
        name={name}
        id={name}
        value={value}
        className="peer block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        placeholder={placeholder}
        onChange={onChange}
        aria-invalid={!!errorMessage}
        aria-errormessage={errorRef.current?.id}
      />
      <p
        id={`${name}-error`}
        className="error-label text-red-400 text-sm invisible mb-2"
        ref={errorRef}
      >
        {errorMessage}
      </p>
    </div>
  );
}
