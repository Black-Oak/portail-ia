"use client";
import React, { useState } from "react";
import { Copy, LoaderCircle, Wand2 } from "lucide-react";

export default function JobDescriptionGenerator() {
  const [jobTitle, setJobTitle] = useState<string>("");
  const [keySkills, setKeySkills] = useState<string>("");
  const [generatedText, setGeneratedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const accentColor = "#E1B000"; // Gold accent color consistent with other pages

  const callGeminiAPI = async (prompt: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Clé API Gemini non configurée dans les variables d'environnement"
      );
    }

    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
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
      return result.candidates[0].content.parts[0].text;
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
    if (!jobTitle.trim() || !keySkills.trim()) {
      setError("Veuillez remplir le titre du poste et les compétences clés.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedText("");

    const prompt = `
    Rédige une fiche de poste complète, professionnelle, attractive et non-discriminatoire en français pour le poste suivant :

    **Titre du poste :** ${jobTitle}
    **Compétences clés requises :** ${keySkills}

    La fiche de poste doit impérativement inclure les sections suivantes, clairement délimitées avec des titres en gras (par exemple **Notre entreprise :**) :
    1.  **Notre entreprise :** (Rédigez un paragraphe court et générique sur une entreprise innovante et bienveillante).
    2.  **Vos missions :** (Listez les responsabilités principales sous forme de points).
    3.  **Votre profil :** (Détaillez les compétences techniques, les qualités humaines et le niveau d'expérience attendu, sous forme de points).
    4.  **Ce que nous offrons :** (Listez des avantages attractifs comme un salaire compétitif, de la flexibilité, des opportunités de développement, etc., sous forme de points).

    Adopte un ton engageant et utilise des formulations inclusives. Ne conclus pas par une phrase de fin, termine directement après la liste des avantages.
    `;

    try {
      const result = await callGeminiAPI(prompt);
      setGeneratedText(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-900 font-sans text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center mb-2">
            <span
              className="w-1 h-8 mr-3"
              style={{ backgroundColor: accentColor }}
            ></span>
            <h1 className="text-4xl font-bold">
              Générateur de fiches de poste 🧑‍💼
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            À partir d&apos;un titre de poste et de quelques compétences clés,
            l&apos;IA rédige une fiche complète.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Section */}
          <div className="bg-zinc-800 p-8 rounded-xl shadow-lg border border-zinc-700">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="jobTitle"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Titre du poste
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Ex: Business Developer"
                />
              </div>
              <div>
                <label
                  htmlFor="keySkills"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Compétences clés
                </label>
                <textarea
                  id="keySkills"
                  rows={5}
                  value={keySkills}
                  onChange={(e) => setKeySkills(e.target.value)}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Ex: Prospection, Négociation, CRM, Relation client..."
                />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="mt-8 w-full font-bold py-3 px-6 rounded-lg flex items-center justify-center transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: accentColor,
                color: "#000",
              }}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin mr-2" size={20} />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2" size={20} />
                  Générer la fiche de poste
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-zinc-800 p-8 rounded-xl shadow-lg flex flex-col border border-zinc-700">
            <h2 className="text-xl font-semibold mb-4">
              Fiche de poste générée
            </h2>
            <div className="bg-zinc-900 rounded-lg p-6 flex-grow h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-zinc-800">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <LoaderCircle
                    className="animate-spin mb-4"
                    style={{ color: accentColor }}
                    size={48}
                  />
                  <p className="text-gray-400">Génération en cours...</p>
                </div>
              ) : generatedText ? (
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300">
                  {generatedText}
                </pre>
              ) : (
                <div className="flex items-start h-full">
                  <p className="text-gray-500">
                    La fiche de poste apparaîtra ici.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-400 bg-red-900/50 border border-red-500/30 p-3 rounded-lg mt-4 text-sm">
                {error}
              </p>
            )}

            {generatedText && !isLoading && (
              <button
                onClick={handleCopy}
                className="mt-4 w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition duration-300"
              >
                <Copy size={16} className="mr-2" />
                {isCopied ? "Texte copié !" : "Copier le texte"}
              </button>
            )}

            {isCopied && (
              <div className="text-green-400 text-sm mt-2 text-center">
                Texte copié avec succès !
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
