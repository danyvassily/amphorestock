"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { toast } from "sonner";
import { ProductCategory, ProductUnit } from "@/types";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { StockService } from "@/lib/stockService";

const productSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  category: z.enum(['vins', 'spiritueux', 'bieres', 'softs', 'jus', 'eaux', 'cocktails', 'autres']),
  subcategory: z.string().optional(),
  quantity: z.number().min(0, "La quantité doit être positive"),
  unit: z.enum(['bouteille', 'litre', 'centilitre', 'verre', 'cannette', 'piece', 'kilogramme', 'gramme']),
  prixAchat: z.number().min(0, "Le prix d'achat doit être positif"),
  prixVente: z.number().min(0, "Le prix de vente doit être positif"),
  prixVerre: z.number().optional(),
  prixBouteille: z.number().optional(),
  description: z.string().optional(),
  fournisseur: z.string().optional(),

  seuilAlerte: z.number().min(0, "Le seuil d'alerte doit être positif"),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

const categories: { value: ProductCategory; label: string }[] = [
  { value: 'vins', label: 'Vins' },
  { value: 'spiritueux', label: 'Spiritueux' },
  { value: 'bieres', label: 'Bières' },
  { value: 'softs', label: 'Softs' },
  { value: 'jus', label: 'Jus' },
  { value: 'eaux', label: 'Eaux' },
  { value: 'cocktails', label: 'Cocktails' },
  { value: 'autres', label: 'Autres' },
];

const units: { value: ProductUnit; label: string }[] = [
  { value: 'bouteille', label: 'Bouteille' },
  { value: 'litre', label: 'Litre' },
  { value: 'centilitre', label: 'Centilitre' },
  { value: 'verre', label: 'Verre' },
  { value: 'cannette', label: 'Cannette' },
  { value: 'piece', label: 'Pièce' },
  { value: 'kilogramme', label: 'Kilogramme' },
  { value: 'gramme', label: 'Gramme' },
];

export default function AddProductPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      prixAchat: 0,
      prixVente: 0,
      seuilAlerte: 5,
      isActive: true,
      description: "",
      fournisseur: "",

    },
  });

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      // Préparer les données du produit pour Firestore
      const productData = {
        nom: data.name,
        categorie: data.category,
        subcategory: data.subcategory,
        quantite: data.quantity,
        unite: data.unit,
        prixAchat: data.prixAchat,
        prixVente: data.prixVente,
        prixVerre: data.prixVerre,
        prixBouteille: data.prixBouteille,
        description: data.description,
        fournisseur: data.fournisseur,
        seuilAlerte: data.seuilAlerte,
        source: data.category === 'vins' || data.category === 'vin-rouge' || data.category === 'vin-blanc' || data.category === 'vin-rose' ? 'vins' : 'boissons',
        isActive: data.isActive,
        createdBy: user?.uid || 'anonymous',
      };
      
      // Ajouter le produit via StockService
      await StockService.addProduct(productData);
      
      toast.success("Produit ajouté avec succès !");
      router.push("/stock");
    } catch (error) {
      console.error("Erreur lors de l'ajout du produit:", error);
      toast.error("Erreur lors de l'ajout du produit");
    } finally {
      setLoading(false);
    }
  };

  const watchedCategory = form.watch("category");

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/stock">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au stock
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PlusCircle className="h-8 w-8 text-green-500" />
            Ajouter un Produit
          </h1>
          <p className="text-muted-foreground">
            Ajouter un nouveau produit à votre inventaire
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Informations générales */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
                <CardDescription>
                  Détails de base du produit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Château Margaux 2019" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sous-catégorie</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Rouge, Blanc, IPA..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description détaillée du produit..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fournisseur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fournisseur</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Caviste Martin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                </div>
              </CardContent>
            </Card>

            {/* Stock et prix */}
            <Card>
              <CardHeader>
                <CardTitle>Stock et Prix</CardTitle>
                <CardDescription>
                  Quantités et tarification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="seuilAlerte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seuil d'alerte *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Quantité minimum avant alerte
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prixAchat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix d'achat (€) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prixVente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix de vente (€) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(watchedCategory === 'vins' || watchedCategory === 'spiritueux') && (
                  <>
                    <FormField
                      control={form.control}
                      name="prixVerre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix au verre (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Pour vins et spiritueux servis au verre
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prixBouteille"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix bouteille (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Si différent du prix de vente
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Produit actif</FormLabel>
                        <FormDescription>
                          Le produit apparaîtra dans les menus
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/stock">Annuler</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Ajout en cours..." : "Ajouter le produit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 