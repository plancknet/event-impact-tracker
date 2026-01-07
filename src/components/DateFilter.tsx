import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DateFilter({ value, onChange, placeholder = "dd/mm/aaaa" }: DateFilterProps) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const formatDateInput = (input: string) => {
    // Remove non-digits
    const digits = input.replace(/\D/g, "");
    
    // Format as dd/mm/aaaa
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setInputValue(formatted);
    onChange(formatted);
  };

  return (
    <div className="relative w-36">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        className="pl-9"
        maxLength={10}
      />
    </div>
  );
}
