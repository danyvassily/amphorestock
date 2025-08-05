'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Package, 
  Wine, 
  Coffee, 
  History, 
  User,
  ArrowRight,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SearchResult, SearchMetadata } from '@/types';
import { useModernProducts } from '@/hooks/useModernProducts';
import { ActivityService } from '@/services/activityService';

interface UniversalSearchProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function UniversalSearch({ trigger, className = '' }: UniversalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  
  const { products } = useModernProducts();
  const inputRef = useRef<HTMLInputElement>(null);

  // Raccourci clavier
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus sur l'input quand la dialog s'ouvre
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Charger les recherches récentes
  useEffect(() => {
    const saved = localStorage.getItem('amphore-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Erreur lors du chargement des recherches récentes:', error);
      }
    }
  }, []);

  // Recherche en temps réel
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];
      const queryLower = searchQuery.toLowerCase();

      // Recherche dans les produits
      const productResults = products
        .filter(product => 
          product.nom.toLowerCase().includes(queryLower) ||
          product.categorie.toLowerCase().includes(queryLower) ||
          product.fournisseur?.toLowerCase().includes(queryLower)
        )
        .slice(0, 5)
        .map(product => ({
          id: product.id,
          type: 'product' as const,
          title: product.nom,
          description: `${product.categorie} - ${product.quantite} en stock`,
          subtitle: product.fournisseur || undefined,
          score: calculateScore(product.nom, queryLower),
          url: `/stock?search=${product.nom}`,
          metadata: {
            product: {
              category: product.categorie,
              price: product.prixVente,
              stock: product.quantite,
              isLowStock: product.quantite <= product.seuilAlerte
            }
          }
        }));

      searchResults.push(...productResults);

      // Recherche dans les activités récentes
      try {
        const activities = await ActivityService.searchActivities(searchQuery, 3);
        const activityResults = activities.map(activity => ({
          id: activity.id,
          type: 'activity' as const,
          title: activity.title,
          description: activity.description,
          subtitle: formatTimeAgo(activity.createdAt),
          score: calculateScore(activity.title, queryLower),
          url: `/historique?search=${activity.title}`,
          metadata: {
            activity: {
              severity: activity.severity,
              type: activity.type,
              date: activity.createdAt
            }
          }
        }));
        searchResults.push(...activityResults);
      } catch (error) {
        console.error('Erreur lors de la recherche d\'activités:', error);
      }

      // Recherche de catégories
      const categories = Array.from(new Set(products.map(p => p.categorie)));
      const categoryResults = categories
        .filter(category => category.toLowerCase().includes(queryLower))
        .slice(0, 3)
        .map(category => {
          const categoryProducts = products.filter(p => p.categorie === category);
          return {
            id: `category-${category}`,
            type: 'category' as const,
            title: category,
            description: `${categoryProducts.length} produit(s)`,
            subtitle: `Valeur: ${categoryProducts.reduce((sum, p) => sum + (p.quantite * p.prixAchat), 0).toFixed(2)}€`,
            score: calculateScore(category, queryLower),
            url: `/stock?category=${category}`,
            metadata: {
              category: {
                productCount: categoryProducts.length,
                totalValue: categoryProducts.reduce((sum, p) => sum + (p.quantite * p.prixAchat), 0)
              }
            }
          };
        });

      searchResults.push(...categoryResults);

      // Trier par score de pertinence
      searchResults.sort((a, b) => b.score - a.score);

      setResults(searchResults.slice(0, 10));
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Sélectionner un résultat
  const selectResult = useCallback((result: SearchResult) => {
    // Sauvegarder la recherche
    const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('amphore-recent-searches', JSON.stringify(updatedSearches));

    // Naviguer
    router.push(result.url);
    setOpen(false);
    setQuery('');
  }, [query, recentSearches, router]);

  // Effacer les recherches récentes
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('amphore-recent-searches');
  }, []);

  // Calculer le score de pertinence
  function calculateScore(text: string, query: string): number {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower === queryLower) return 1.0;
    if (textLower.startsWith(queryLower)) return 0.9;
    if (textLower.includes(queryLower)) return 0.7;
    
    // Score basé sur la similarité des mots
    const words = queryLower.split(' ');
    const matchedWords = words.filter(word => textLower.includes(word));
    return matchedWords.length / words.length * 0.5;
  }

  // Formater le temps relatif
  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  }

  // Obtenir l'icône pour un type de résultat
  function getResultIcon(type: SearchResult['type']) {
    switch (type) {
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'category':
        return <Wine className="h-4 w-4" />;
      case 'activity':
        return <History className="h-4 w-4" />;
      case 'supplier':
        return <User className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  }

  // Obtenir la couleur pour un type
  function getTypeColor(type: SearchResult['type']): string {
    switch (type) {
      case 'product':
        return 'bg-blue-100 text-blue-800';
      case 'category':
        return 'bg-purple-100 text-purple-800';
      case 'activity':
        return 'bg-green-100 text-green-800';
      case 'supplier':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <>
      {/* Trigger personnalisé ou bouton par défaut */}
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          variant="outline"
          className={`justify-start text-muted-foreground ${className}`}
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 mr-2" />
          <span>Rechercher...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      {/* Dialog de recherche */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl">
          <Command className="rounded-lg border-none shadow-md">
            <CommandInput
              ref={inputRef}
              placeholder="Rechercher produits, catégories, activités..."
              value={query}
              onValueChange={setQuery}
              className="h-12"
            />
            
            <CommandList className="max-h-96">
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">Recherche...</span>
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-6">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Aucun résultat trouvé</p>
                    <p className="text-sm text-muted-foreground">
                      Essayez avec d'autres mots-clés
                    </p>
                  </div>
                </CommandEmpty>
              )}

              {!query && recentSearches.length > 0 && (
                <CommandGroup heading="Recherches récentes">
                  {recentSearches.map((search, index) => (
                    <CommandItem
                      key={index}
                      value={search}
                      onSelect={() => setQuery(search)}
                      className="cursor-pointer"
                    >
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{search}</span>
                    </CommandItem>
                  ))}
                  <div className="px-2 py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground"
                    >
                      Effacer l'historique
                    </Button>
                  </div>
                </CommandGroup>
              )}

              {results.length > 0 && (
                <CommandGroup heading="Résultats">
                  {results.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => selectResult(result)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center w-full">
                        <div className="flex items-center flex-1 min-w-0">
                          {getResultIcon(result.type)}
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{result.title}</span>
                              <Badge variant="secondary" className={`text-xs ${getTypeColor(result.type)}`}>
                                {result.type}
                              </Badge>
                              {result.metadata.product?.isLowStock && (
                                <Badge variant="destructive" className="text-xs">
                                  Stock faible
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {result.description}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-2" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}