import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Save, Loader2 } from "lucide-react";

export default function SearchTerms() {
  const { toast } = useToast();
  const [terms, setTerms] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTerms();
  }, []);

  async function loadTerms() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("search_terms")
        .select("term")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setTerms(data?.map((t) => t.term).join("\n") || "");
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

  async function handleSave() {
    setIsSaving(true);
    try {
      // Parse new terms from textarea
      const newTermsList = terms
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Get existing terms to avoid duplicates
      const { data: existingTerms, error: fetchError } = await supabase
        .from("search_terms")
        .select("term");

      if (fetchError) throw fetchError;

      const existingSet = new Set(existingTerms?.map((t) => t.term.toLowerCase()) || []);
      
      // Filter only truly new terms (case-insensitive)
      const termsToInsert = newTermsList.filter(
        (t) => !existingSet.has(t.toLowerCase())
      );

      // Insert only new terms
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

      // Reload and clear textarea
      await loadTerms();
      setTerms("");
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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-primary">Passo 1</span> — Termos de Busca
          </CardTitle>
          <CardDescription>
            Digite os termos de busca, um por linha. Estes termos serão usados para consultar o Google Alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Textarea
                placeholder={`bitcoin\nfed\nfomc\ninflation\netf bitcoin`}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="min-h-[300px] font-mono text-sm bg-input"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {terms.split("\n").filter((t) => t.trim()).length} termo(s)
                </p>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar termos
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
