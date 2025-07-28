"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Product, ProductCategory } from "@/types";
import { StockService } from "@/lib/stockService";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { getCategoryColor, getCategoryLabel } from "@/lib/product-classifier";
import { useAuth } from "@/contexts/auth-context";

interface EditProductCategoryDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: ProductCategory; label: string; description: string }[] = [
  { value: 'vins', label: 'Vins (général)', description: 'Vins sans classification spécifique' },
  { value: 'vin-rouge', label: 'Vins Rouges', description: 'Vins rouges de toutes régions' },
  { value: 'vin-blanc', label: 'Vins Blancs', description: 'Vins blancs secs et moelleux' },
  { value: 'vin-rose', label: 'Vins Rosés', description: 'Vins rosés et clairets' },
  { value: 'spiritueux', label: 'Spiritueux', description: 'Alcools forts distillés' },
  { value: 'bieres', label: 'Bières', description: 'Bières de toutes sortes' },
  { value: 'softs', label: 'Softs', description: 'Boissons non-alcoolisées générales' },
  { value: 'jus', label: 'Jus', description: 'Jus de fruits et nectars' },
  { value: 'eaux', label: 'Eaux', description: 'Eaux plates et gazeuses' },
  { value: 'cocktails', label: 'Cocktails', description: 'Cocktails préparés' },
  { value: 'autres', label: 'Autres', description: 'Produits non classifiés' },
];

export function EditProductCategoryDialog({ 
  product, 
  isOpen, 
  onClose 
}: EditProductCategoryDialogProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!product || !selectedCategory) return;

    try {
      setIsLoading(true);
      await StockService.updateProduct(product.id, {
        categorie: selectedCategory
      }, user?.uid || 'anonymous');
      
      toast.success(`Produit déplacé vers ${getCategoryLabel(selectedCategory)}`);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast.error('Erreur lors de la modification de la catégorie');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la catégorie</DialogTitle>
          <DialogDescription>
            Déplacez ce produit vers une autre catégorie. Les modifications sont appliquées en temps réel.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Produit actuel */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Produit sélectionné :</h4>
            <div className="p-3 bg-muted rounded-md">
              <div className="font-medium">{product.nom}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">Catégorie actuelle :</span>
                <Badge 
                  variant="outline" 
                  className={`${getCategoryColor(product.categorie)} border text-xs`}
                >
                  {getCategoryLabel(product.categorie)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Nouvelle catégorie */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Nouvelle catégorie :</h4>
            <Select value={selectedCategory || ""} onValueChange={(value) => setSelectedCategory(value as ProductCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem 
                    key={category.value} 
                    value={category.value}
                    disabled={category.value === product.categorie}
                  >
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${getCategoryColor(category.value)} border text-xs`}
                      >
                        {category.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <p className="text-xs text-muted-foreground">
                {CATEGORIES.find(c => c.value === selectedCategory)?.description}
              </p>
            )}
          </div>

          {/* Aperçu du changement */}
          {selectedCategory && selectedCategory !== product.categorie && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm">
                <Badge 
                  variant="outline" 
                  className={`${getCategoryColor(product.categorie)} border text-xs`}
                >
                  {getCategoryLabel(product.categorie)}
                </Badge>
                <ArrowRight className="h-3 w-3 text-blue-600" />
                <Badge 
                  variant="outline" 
                  className={`${getCategoryColor(selectedCategory)} border text-xs`}
                >
                  {getCategoryLabel(selectedCategory)}
                </Badge>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Le produit apparaîtra dans la nouvelle catégorie après modification.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedCategory || selectedCategory === product.categorie || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Déplacer le produit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 