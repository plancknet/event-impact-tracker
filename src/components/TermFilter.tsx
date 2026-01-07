import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TermFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function TermFilter({ value, onChange }: TermFilterProps) {
  const { data: terms = [] } = useQuery({
    queryKey: ["search-terms-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_terms")
        .select("id, term")
        .order("term", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Todos os termos" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os termos</SelectItem>
        {terms.map((t) => (
          <SelectItem key={t.id} value={t.term}>
            {t.term}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
