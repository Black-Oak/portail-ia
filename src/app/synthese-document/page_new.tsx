"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Copy, LoaderCircle, AlertTriangle, Wand2 } from "lucide-react";

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

// Types d'interface
interface DocumentType {
  value: string;
  label: string;
}

const documentTypes: DocumentType[] = [
  { value: "general", label: "Générique" },
  { value: "rapport", label: "Rapport" },
  { value: "etude-marche", label: "Étude de marché" },
  { value: "appel-offre", label: "Appel d'offre" },
  { value: "contrat", label: "Contrat" },
];

export default function SyntheseDocumentPage() {
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");
  const [documentText, setDocumentText] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("general");
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState<boolean>(false);
  const accentColor = "#E1B000"; // Gold accent color consistent with other pages

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger PDF.js
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js";
    script.onload = () => {
      const workerScript = document.createElement("script");
      workerScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js";
      workerScript.onload = () => {
        // Configuration du worker
        const pdfLib = (
          window as unknown as {
            pdfjsLib?: { GlobalWorkerOptions: { workerSrc: string } };
          }
        ).pdfjsLib;
        if (pdfLib) {
          pdfLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js";
          setIsPdfJsLoaded(true);
        }
      };
      document.head.appendChild(workerScript);
    };
    document.head.appendChild(script);

    return () => {
      // Nettoyage des scripts
      const scripts = document.querySelectorAll('script[src*="pdf"]');
      scripts.forEach((s) => s.remove());
    };
  }, []);

  const getPrompt = (docType: string, documentText: string): string => {
    const prompts: Record<string, string> = {
      general: `Résume le document suivant de manière concise et professionnelle. Met en évidence les points clés, les décisions importantes et les actions à entreprendre sous forme de liste à puces. Le résumé doit être facile à lire et à comprendre.`,
      rapport: `Agis comme un analyste expert. Résume ce rapport en te concentrant sur les conclusions principales, les données chiffrées clés et les recommandations émises. La synthèse doit être structurée et factuelle.`,
      "etude-marche": `Agis comme un stratège marketing. Analyse cette étude de marché et résume les tendances principales, la taille du marché, le paysage concurrentiel et les opportunités identifiées. Mets en avant les insights exploitables pour une entreprise.`,
      "appel-offre": `Agis comme un expert en appels d'offres. Résume cet appel d'offres en extrayant les exigences techniques et fonctionnelles critiques, les critères de sélection, les dates limites importantes et les livrables attendus. Le résumé doit être une checklist claire pour la réponse.`,
      contrat: `Agis comme un juriste. Résume ce contrat en identifiant les parties impliquées, l'objet du contrat, les obligations principales de chaque partie, les conditions financières (paiement, durée), les clauses de résiliation et les points de responsabilité. Le ton doit être neutre et précis.`,
    };
    const instruction = prompts[docType] || prompts.general;
    return `${instruction}\n\nVoici le document à analyser:\n\n---\n\n${documentText}`;
  };

  // Fonction pour extraire le texte d'un PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);

          // Utilisation de PDF.js via CDN
          const pdfjsLib = (
            window as unknown as {
              pdfjsLib: {
                getDocument: (options: { data: Uint8Array }) => {
                  promise: Promise<{
                    numPages: number;
                    getPage: (num: number) => Promise<{
                      getTextContent: () => Promise<{
                        items: { str: string }[];
                      }>;
                    }>;
                  }>;
                };
              };
            }
          ).pdfjsLib;
          if (!pdfjsLib) {
            throw new Error("PDF.js n'est pas chargé");
          }

          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: { str: string }) => item.str)
              .join(" ");
            fullText += pageText + "\n";
          }

          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () =>
        reject(new Error("Erreur lors de la lecture du fichier"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    setFileName(`Chargement de : ${file.name}...`);
    setFileContent("");
    setError(null);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension === "txt") {
        const text = await file.text();
        setFileContent(text);
        setFileName(`Fichier chargé : ${file.name}`);
      } else if (extension === "pdf") {
        if (!isPdfJsLoaded) {
          setError(
            "PDF.js est en cours de chargement. Veuillez patienter et réessayer dans quelques secondes."
          );
          setFileName("");
          return;
        }
        try {
          const text = await extractTextFromPDF(file);
          if (!text.trim()) {
            setError(
              "Le PDF semble vide ou le texte n'a pas pu être extrait. Il peut s'agir d'un PDF d'images sans OCR."
            );
            setFileName("");
          } else {
            setFileContent(text);
            setFileName(`Fichier chargé : ${file.name}`);
          }
        } catch (pdfError) {
          console.error("Erreur PDF:", pdfError);
          setError(
            "Impossible de lire le fichier PDF. Assurez-vous que le fichier n'est pas corrompu ou protégé par mot de passe."
          );
          setFileName("");
        }
      } else {
        setError(
          "Format de fichier non supporté. Veuillez utiliser .txt, .pdf ou copier le texte manuellement."
        );
        setFileName("");
      }
    } catch (error) {
      setError("Une erreur est survenue lors de la lecture du fichier.");
      setFileName("");
      console.error(error);
    }
  };

  const callGeminiAPI = async (prompt: string) => {
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };

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

  const handleSynthesize = async () => {
    const content =
      activeTab === "text" ? documentText.trim() : fileContent.trim();

    if (!content) {
      setError(
        "Veuillez entrer un document ou charger un fichier à synthétiser."
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary("");

    try {
      const prompt = getPrompt(documentType, content);
      const result = await callGeminiAPI(prompt);
      setSummary(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(err);
      setError(`Une erreur est survenue : ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const formatSummary = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-400">$1</strong>')
      .replace(/^\* (.*$)/gm, '<li class="ml-5 list-disc">$1</li>')
      .replace(/\n/g, "<br>");
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
              Synthèse de Documents
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Collez votre document ou téléchargez un fichier pour obtenir un
            résumé intelligent et personnalisé.
          </p>
        </header>

        <div className="max-w-4xl mx-auto bg-zinc-800 p-6 md:p-8 rounded-2xl shadow-2xl border border-zinc-700">
          {/* Sélecteur d'onglet */}
          <div className="flex border-b border-zinc-700 mb-6">
            <button
              onClick={() => setActiveTab("text")}
              className={`font-semibold py-2 px-6 rounded-t-lg focus:outline-none transition-colors ${
                activeTab === "text"
                  ? "text-zinc-900"
                  : "text-gray-400 hover:text-white"
              }`}
              style={{
                backgroundColor:
                  activeTab === "text" ? accentColor : "transparent",
              }}
            >
              Coller le texte
            </button>
            <button
              onClick={() => setActiveTab("file")}
              className={`font-semibold py-2 px-6 rounded-t-lg focus:outline-none transition-colors ${
                activeTab === "file"
                  ? "text-zinc-900"
                  : "text-gray-400 hover:text-white"
              }`}
              style={{
                backgroundColor:
                  activeTab === "file" ? accentColor : "transparent",
              }}
            >
              Télécharger un fichier
            </button>
          </div>

          {/* Contenu des onglets */}
          {activeTab === "text" && (
            <div>
              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                rows={12}
                className="w-full p-4 bg-zinc-900 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-200 text-gray-200 placeholder-gray-500"
                placeholder="Collez ici votre document..."
              />
            </div>
          )}

          {activeTab === "file" && (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-lg p-8 text-center cursor-pointer border-2 border-dashed transition-colors ${
                  isDragOver
                    ? "bg-zinc-700 border-yellow-400"
                    : "border-zinc-600 hover:border-zinc-500"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <Upload
                  className="mx-auto h-12 w-12"
                  style={{ color: accentColor }}
                />
                <p className="mt-2 text-gray-400">
                  <span
                    className="font-semibold"
                    style={{ color: accentColor }}
                  >
                    Cliquez pour choisir
                  </span>{" "}
                  ou glissez-déposez un fichier
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  TXT, PDF {isPdfJsLoaded ? "(✓ Chargé)" : "(Chargement...)"}
                </p>
                {fileName && (
                  <p className="mt-4 text-gray-300 font-medium">{fileName}</p>
                )}
              </div>
            </div>
          )}

          {/* Sélecteur de typologie */}
          <div className="mt-6">
            <label
              htmlFor="doc-type"
              className="block text-lg font-semibold mb-2 text-gray-300"
            >
              Typologie du document
            </label>
            <select
              id="doc-type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-3 bg-zinc-900 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-200 text-gray-200"
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton d'action */}
          <div className="text-center mt-8 mb-6">
            <button
              onClick={handleSynthesize}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-8 py-4 font-bold text-zinc-900 rounded-full hover:opacity-90 disabled:bg-zinc-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 focus:ring-offset-zinc-800 transition-all duration-300 shadow-lg hover:shadow-yellow-500/20 transform hover:-translate-y-1"
              style={{ backgroundColor: accentColor }}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin mr-3" size={24} />
                  Synthèse en cours...
                </>
              ) : (
                <>
                  <Wand2 className="mr-3" size={24} />
                  Synthétiser le Document
                </>
              )}
            </button>
          </div>

          {/* Zone d'affichage du résumé */}
          {summary && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white border-b-2 border-yellow-400 pb-2">
                Résumé du Document
              </h2>
              <div
                className="bg-zinc-900 p-6 rounded-lg text-gray-300 space-y-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatSummary(summary) }}
              />
              <div className="text-center mt-6">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center mx-auto px-6 py-2 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-600 transition duration-300"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  {isCopied ? "Copié !" : "Copier le résumé"}
                </button>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mt-6 flex items-center">
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
