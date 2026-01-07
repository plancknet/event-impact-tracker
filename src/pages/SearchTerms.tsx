import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Save, Loader2, Plus } from "lucide-react";
import { SortableTableHead, SortDirection } from "@/components/SortableTableHead";
import { format } from "date-fns";

type StoredTerm = {
  id: string;
  term: string;
  created_at: string;
};

export default function SearchTerms() {
  const { toast } = useToast();
  const [newTerms, setNewTerms] = useState("");
  const [storedTerms, setStoredTerms] = useState<StoredTerm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({
    key: "created_at",
    direction: "asc",
  });

  useEffect(() => {
    loadTerms();
  }, []);

  async function loadTerms() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("search_terms")
        .select("id, term, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setStoredTerms(data || []);
    } catch (error) {
      console.error("Error loading terms:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os termos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSort(key: string) {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  const sortedTerms = useMemo(() => {
    if (!sort.direction) return storedTerms;

    return [...storedTerms].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sort.key === "term") {
        aVal = a.term.toLowerCase();
        bVal = b.term.toLowerCase();
      } else if (sort.key === "created_at") {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      }

      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [storedTerms, sort]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const newTermsList = newTerms
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (newTermsList.length === 0) {
        toast({
          title: "Atenção",
          description: "Digite pelo menos um termo.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const existingSet = new Set(storedTerms.map((t) => t.term.toLowerCase()));

      const termsToInsert = newTermsList.filter(
        (t) => !existingSet.has(t.toLowerCase())
      );

      if (termsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("search_terms")
          .insert(termsToInsert.map((term) => ({ term })));

        if (insertError) throw insertError;
      }

      const skipped = newTermsList.length - termsToInsert.length;
      toast({
        title: "Sucesso",
        description: `${termsToInsert.length} novo(s) termo(s) adicionado(s)${skipped > 0 ? `, ${skipped} já existente(s)` : ""}.`,
      });

      await loadTerms();
      setNewTerms("");
    } catch (error) {
      console.error("Error saving terms:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os termos.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-primary">Passo 1</span> — Adicionar Termos
          </CardTitle>
          <CardDescription>
            Digite os novos termos de busca, um por linha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={`bitcoin\nfed\nfomc\ninflation\netf bitcoin`}
            value={newTerms}
            onChange={(e) => setNewTerms(e.target.value)}
            className="min-h-[150px] font-mono text-sm bg-input"
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {newTerms.split("\n").filter((t) => t.trim()).length} termo(s) para adicionar
            </p>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Adicionar termos
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Termos Cadastrados</CardTitle>
          <CardDescription>
            {storedTerms.length} termo(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : storedTerms.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum termo cadastrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="term"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Termo
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="created_at"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Data de Cadastro
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTerms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-mono">{term.term}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(term.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
