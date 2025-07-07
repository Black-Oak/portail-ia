"use client";

import React, { useState } from "react";
import {
  User,
  AlertTriangle,
  Package,
  Copy,
  LoaderCircle,
  Wand2,
} from "lucide-react";

// --- Configuration de l'API Gemini ---
const getApiUrl = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Clé API Gemini non configurée dans les variables d'environnement"
    );
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
};

// --- Schéma JSON pour la réponse structurée de l'IA ---
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    besoins_identifies: { type: "ARRAY", items: { type: "STRING" } },
    produits_recommandes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          nom: { type: "STRING" },
          justification: { type: "STRING" },
        },
        required: ["nom", "justification"],
      },
    },
    brouillon_proposition: { type: "STRING" },
    conseils_personnalises: { type: "STRING" },
  },
  required: [
    "besoins_identifies",
    "produits_recommandes",
    "brouillon_proposition",
    "conseils_personnalises",
  ],
};

// --- Types et interfaces ---
interface Product {
  id: string;
  name: string;
  description: string;
  cout: number;
  prix_vente: number;
}

interface AnalysisResultType {
  besoins_identifies: string[];
  produits_recommandes: Array<{
    nom: string;
    justification: string;
  }>;
  brouillon_proposition: string;
  conseils_personnalises: string;
}

// --- Données initiales pour le POC ---
const initialProductsData: Product[] = [
  {
    id: "1",
    name: "PC Portable Dell Latitude 7490 (Reconditionné)",
    description:
      "Core i5, 16Go RAM, 256Go SSD. Idéal pour la bureautique et la mobilité. Grade A.",
    cout: 250,
    prix_vente: 450,
  },
  {
    id: "2",
    name: 'Écran 24" Dell UltraSharp U2419H (Reconditionné)',
    description:
      "Résolution Full HD (1920x1080), dalle IPS pour des couleurs précises. Connectique complète (HDMI, DP).",
    cout: 80,
    prix_vente: 150,
  },
  {
    id: "3",
    name: "Docking Station Dell WD19 (Reconditionné)",
    description:
      "Permet de connecter un portable à plusieurs écrans, réseau et périphériques avec un seul câble USB-C.",
    cout: 70,
    prix_vente: 130,
  },
  {
    id: "4",
    name: "Clavier Logitech MX Keys (Reconditionné)",
    description:
      "Clavier sans fil rétroéclairé, confortable et précis. Connexion multi-appareils.",
    cout: 45,
    prix_vente: 80,
  },
  {
    id: "5",
    name: "Souris Logitech MX Master 3 (Reconditionné)",
    description:
      "Souris ergonomique sans fil avec molette de défilement ultra-rapide et capteur haute précision.",
    cout: 40,
    prix_vente: 75,
  },
];

export default function AssistantPropositionPage() {
  const [products] = useState<Product[]>(initialProductsData);
  const [isLoadingProducts] = useState<boolean>(false);
  const [transcript, setTranscript] = useState("");
  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResultType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<string>("");
  const accentColor = "#E1B000"; // Gold accent color consistent with other pages

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(type);
    setTimeout(() => setIsCopied(""), 2000);
  };

  const callGeminiAPI = async (prompt: string) => {
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseSchema: RESPONSE_SCHEMA,
        responseMimeType: "application/json",
      },
    };

    const response = await fetch(getApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        throw new Error(
          `Erreur API : ${response.status} ${response.statusText}`
        );
      }
      const message = errorBody.error?.message || `Erreur ${response.status}`;
      throw new Error(`Erreur API : ${message}`);
    }

    const result = await response.json();

    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      return JSON.parse(result.candidates[0].content.parts[0].text);
    }

    if (result.promptFeedback?.blockReason) {
      throw new Error(
        `Le contenu a été bloqué : ${result.promptFeedback.blockReason}.`
      );
    }

    console.error("Unexpected API response structure:", result);
    throw new Error(
      "Aucun contenu n'a été généré. La réponse de l'API était inattendue ou vide."
    );
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError("Veuillez fournir une transcription.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setAnalysisResult(null);

    const prompt = `
      Vous êtes un assistant expert pour un commercial spécialisé dans la vente de matériel informatique reconditionné.
      Votre mission est d'analyser la transcription d'un entretien client pour préparer une proposition commerciale.

      Voici la transcription de la conversation :
      --- TRANSCRIPTION ---
      ${transcript}
      --- FIN TRANSCRIPTION ---

      Voici le catalogue des produits reconditionnés disponibles. Chaque produit a un nom, une description, un coût d'achat pour l'entreprise et un prix de vente pour le client.
      --- CATALOGUE PRODUITS ---
      ${JSON.stringify(products, null, 2)}
      --- FIN CATALOGUE ---

      En vous basant STRICTEMENT sur ces informations, générez un objet JSON qui suit le schéma demandé.
      - Identifiez les besoins du client.
      - Recommandez les produits les plus pertinents du catalogue.
      - Justifiez vos recommandations en liant les caractéristiques des produits aux besoins du client. Vous pouvez mentionner le bon rapport qualité/prix du reconditionné.
      - Rédigez un brouillon de proposition commerciale.
      - Fournissez des conseils pour présenter l'offre.
    `;

    try {
      const result = await callGeminiAPI(prompt);
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(`Une erreur est survenue : ${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 font-sans text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <header className="text-center mb-12">
          <div className="flex justify-center items-center gap-4">
            <span
              className="h-10 w-1.5"
              style={{ backgroundColor: accentColor }}
            ></span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Assistant Proposition Commerciale
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Générez des propositions commerciales personnalisées avec l&apos;IA
            en analysant vos entretiens clients.
          </p>
        </header>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Section Catalogue */}
          <div className="bg-zinc-800 p-6 md:p-8 rounded-2xl shadow-2xl border border-zinc-700">
            <div className="flex items-center mb-6">
              <Package
                className="w-8 h-8 mr-3"
                style={{ color: accentColor }}
              />
              <h2 className="text-2xl font-bold text-white">
                Catalogue Produits
              </h2>
            </div>
            {isLoadingProducts ? (
              <div className="text-center py-8">
                <LoaderCircle
                  className="animate-spin mx-auto mb-4"
                  style={{ color: accentColor }}
                  size={48}
                />
                <p className="text-gray-400">Chargement du catalogue...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-zinc-700 border border-zinc-600 rounded-lg p-4 hover:border-yellow-400 transition-colors"
                  >
                    <h3 className="font-semibold text-white text-sm mb-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      {product.description}
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">
                        Coût: {product.cout}€
                      </span>
                      <span className="text-yellow-400">
                        PV: {product.prix_vente}€
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section Transcription */}
          <div className="bg-zinc-800 p-6 md:p-8 rounded-2xl shadow-2xl border border-zinc-700">
            <div className="flex items-center mb-6">
              <User className="w-8 h-8 mr-3" style={{ color: accentColor }} />
              <h2 className="text-2xl font-bold text-white">
                Transcription Entretien Client
              </h2>
            </div>
            <p className="text-gray-400 mb-4">
              Collez ici le texte de votre conversation avec le client pour
              générer une proposition personnalisée.
            </p>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Ex: 'Client: Bonjour, nous devons équiper 5 nouveaux collaborateurs avec des postes de travail complets et fiables...'"
              className="w-full h-48 p-4 bg-zinc-900 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-200 text-gray-200 placeholder-gray-500 resize-none"
            />
          </div>

          {/* Bouton de génération */}
          <div className="text-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !transcript.trim()}
              className="inline-flex items-center justify-center px-8 py-4 font-bold text-zinc-900 rounded-full hover:opacity-90 disabled:bg-zinc-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 focus:ring-offset-zinc-800 transition-all duration-300 shadow-lg hover:shadow-yellow-500/20 transform hover:-translate-y-1"
              style={{ backgroundColor: accentColor }}
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="animate-spin mr-3" size={24} />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Wand2 className="mr-3" size={24} />
                  Générer la Proposition
                </>
              )}
            </button>
          </div>

          {/* Résultats */}
          {analysisResult && (
            <div className="bg-zinc-800 p-6 md:p-8 rounded-2xl shadow-2xl border border-zinc-700 space-y-6">
              <h2 className="text-2xl font-bold text-white border-b-2 border-yellow-400 pb-2">
                Proposition Générée
              </h2>

              {/* Besoins identifiés */}
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                  Besoins Identifiés
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  {analysisResult.besoins_identifies.map((need, index) => (
                    <li key={index}>{need}</li>
                  ))}
                </ul>
              </div>

              {/* Produits recommandés */}
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                  Produits Recommandés
                </h3>
                <div className="space-y-3">
                  {analysisResult.produits_recommandes.map((product, index) => (
                    <div
                      key={index}
                      className="bg-zinc-900 p-4 rounded-lg border border-zinc-600"
                    >
                      <h4 className="font-semibold text-white mb-2">
                        {product.nom}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {product.justification}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brouillon de proposition */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-yellow-400">
                    Brouillon de Proposition
                  </h3>
                  <button
                    onClick={() =>
                      handleCopy(
                        analysisResult.brouillon_proposition,
                        "proposition"
                      )
                    }
                    className="flex items-center px-3 py-1 bg-zinc-700 text-white text-sm rounded hover:bg-zinc-600 transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {isCopied === "proposition" ? "Copié !" : "Copier"}
                  </button>
                </div>
                <div className="bg-zinc-900 p-4 rounded-lg text-gray-300">
                  <pre className="whitespace-pre-wrap text-sm">
                    {analysisResult.brouillon_proposition}
                  </pre>
                </div>
              </div>

              {/* Conseils personnalisés */}
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                  Conseils de Présentation
                </h3>
                <div className="bg-zinc-900 p-4 rounded-lg text-gray-300">
                  <pre className="whitespace-pre-wrap text-sm">
                    {analysisResult.conseils_personnalises}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <div>
                <strong className="font-bold">Erreur:</strong>
                <span className="block sm:inline ml-1">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
