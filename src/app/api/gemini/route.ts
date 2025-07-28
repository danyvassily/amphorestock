import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Fonction pour retry automatique en cas de surcharge
async function callGeminiWithRetry(url: string, body: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 503 && attempt < maxRetries) {
        console.log(`Tentative ${attempt}/${maxRetries} - API surchargée, retry dans ${attempt * 2}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue;
      }

      const errorText = await response.text();
      throw new Error(`Erreur API (${response.status}): ${errorText}`);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Tentative ${attempt}/${maxRetries} échouée, retry dans ${attempt * 2}s...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, data, userId, action } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt requis et doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    // Construire le prompt final avec contexte
    let contextualPrompt = `
Tu es un assistant IA spécialisé dans la gestion de stock pour un bar/restaurant.
Tu aides à analyser, optimiser et gérer les données de stock, ventes et historiques.

Contexte de l'application:
- Application de gestion de stock Amphore
- Produits: vins, spiritueux, bières, softs
- Données structurées en JSON avec Firebase/Firestore

Instruction utilisateur: ${prompt}

${data ? `Données à analyser:\n${JSON.stringify(data, null, 2)}` : ''}

Réponds en français, de manière claire et actionnable.
Si tu proposes des modifications de données, structure ta réponse en JSON quand c'est pertinent.
`;

    // Contexte spécialisé pour les cocktails
    if (action === 'suggest_cocktails') {
      contextualPrompt = `
Tu es un mixologue expert et assistant IA pour un bar/restaurant.
Tu aides à créer des suggestions de cocktails basées sur le stock disponible.

Contexte de l'application Amphore:
- Gestion de stock pour bar/restaurant
- Base de données de ${data?.totalRecipesInDatabase || 'nombreuses'} recettes de cocktails
- Stock en temps réel avec quantités disponibles

MISSION: ${prompt}

Stock disponible: ${data?.availableProducts?.join(', ') || 'Données indisponibles'}

Cocktails parfaitement réalisables: ${data?.perfectMatchCocktails?.length || 0}
Cocktails partiellement réalisables: ${data?.possibleCocktails?.length || 0}

${data ? `Détails du stock:\n${JSON.stringify(data, null, 2)}` : ''}

INSTRUCTIONS SPÉCIALES:
1. Priorise les cocktails 100% réalisables
2. Suggère des variations créatives avec les produits disponibles
3. Propose des achats stratégiques pour élargir la carte
4. Considère la saison, la difficulté et la rentabilité
5. Structure ta réponse de manière claire et professionnelle
6. Inclus des conseils de présentation et de dressage

Réponds en français avec expertise et créativité.
`;
    }

    // Contexte spécialisé pour l'import de fichiers
    if (action === 'import_parse' || action === 'import_text_parse') {
      contextualPrompt = `
Tu es un expert en extraction et structuration de données pour un système de gestion de stock de bar/restaurant.

Application Amphore - Import automatique:
- Extraction intelligente de produits depuis fichiers ou texte
- Catégorisation automatique (vins-rouge, vins-blanc, vins-rose, spiritueux, liqueur, biere, soft, champagne)
- Validation et normalisation des données
- Détection d'erreurs et suggestion de corrections

MISSION: ${prompt}

${action === 'import_parse' ? 
  `Fichiers à analyser: ${data?.fileNames?.join(', ') || 'Non spécifiés'}
   Taille totale du contenu: ${data?.contentLength || 0} caractères` :
  `Texte libre à analyser: "${data?.textInput || ''}"
   Longueur: ${data?.textLength || 0} caractères`
}

INSTRUCTIONS CRITIQUES:
1. RETOURNE UNIQUEMENT un JSON Array valide au format suivant
2. N'ajoute AUCUN texte explicatif avant ou après le JSON
3. Commence directement par [ et termine par ]
4. Identifie et extrait TOUS les produits mentionnés
5. Normalise les noms (première lettre majuscule, pas de doublons)
6. Catégorise automatiquement selon les types disponibles
7. Convertis les unités en format standard (bouteille, litre, cl, piece)
8. Estime les prix manquants selon le type de produit
9. Attribue un score de confiance réaliste (0-100)
10. Ignore les en-têtes, totaux, et données non-produits

FORMAT JSON STRICT - EXEMPLE:
[
  {
    "nom": "Château Margaux 2018",
    "categorie": "vins-rouge",
    "quantite": 6,
    "unite": "bouteille",
    "prixAchat": 45.0,
    "prixVente": 65.0,
    "fournisseur": "Cave Premium",
    "description": "",
    "confidence": 95
  }
]

CATÉGORIES AUTORISÉES: vins-rouge, vins-blanc, vins-rose, spiritueux, liqueur, biere, soft, champagne
UNITÉS AUTORISÉES: bouteille, litre, cl, piece

${data ? `\nDonnées à traiter:\n${JSON.stringify(data, null, 2)}` : ''}
`;
    }

    // Appel à l'API Gemini avec retry automatique
    const requestBody = {
      contents: [
        { 
          role: "user", 
          parts: [{ text: contextualPrompt }] 
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const result = await callGeminiWithRetry(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, requestBody);
    
    // Extraire la réponse de Gemini
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Aucune réponse générée';

    // Logger la requête dans Firebase
    try {
      await addDoc(collection(db, 'ai-logs'), {
        prompt: prompt.substring(0, 500), // Limiter la taille
        action: action || 'general',
        response: aiResponse.substring(0, 1000), // Limiter la taille
        userId: userId || 'anonymous',
        dataSize: data ? JSON.stringify(data).length : 0,
        timestamp: Timestamp.fromDate(new Date()),
        success: true
      });
    } catch (logError) {
      console.error('Erreur lors du logging:', logError);
      // Continue même si le logging échoue
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      usage: result.usageMetadata,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur dans l\'API Gemini:', error);
    
    // Logger l'erreur
    try {
      await addDoc(collection(db, 'ai-logs'), {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: Timestamp.fromDate(new Date()),
        success: false
      });
    } catch (logError) {
      console.error('Erreur lors du logging d\'erreur:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur', 
        details: error instanceof Error ? error.message : 'Erreur inconnue' 
      },
      { status: 500 }
    );
  }
} 