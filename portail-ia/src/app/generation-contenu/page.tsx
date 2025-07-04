"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Newspaper,
  Linkedin,
  Mic,
  Video,
  Copy,
  LoaderCircle,
  Wand2,
  UploadCloud,
  FileCheck2,
  X,
} from "lucide-react";
import type { SVGProps } from "react";

interface PDFJSWindow extends Window {
  pdfjsLib?: {
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (options: {
      data: Uint8Array;
    }) => Promise<unknown> | { promise: Promise<unknown> };
  };
}

declare const window: PDFJSWindow;

interface ContentCardProps {
  icon: React.ReactElement<SVGProps<SVGSVGElement>>;
  title: string;
  content: string;
}
const ContentCard: React.FC<ContentCardProps> = ({ icon, title, content }) => {
  const [isCopied, setIsCopied] = useState(false);
  const accentColor = "#E1B000";

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl shadow-lg relative transform hover:scale-[1.02] transition-transform duration-300 flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex items-center mb-4">
          {React.cloneElement(icon, { style: { color: accentColor } })}
          <h3 className="text-xl font-semibold text-white ml-3">{title}</h3>
        </div>
        <div className="prose prose-sm max-w-none text-gray-300 h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
          <pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>
        </div>
      </div>
      <div className="bg-zinc-900/50 px-6 py-3 rounded-b-2xl border-t border-zinc-700">
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-300 bg-zinc-700 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-zinc-800 transition-all duration-200"
        >
          <Copy size={16} className="mr-2" />
          {isCopied ? "Copié !" : "Copier le texte"}
        </button>
      </div>
    </div>
  );
};

// Main App Component
interface GeneratedContent {
  seoArticle: string;
  newsletter: string;
  linkedinPost: string;
  podcastScript: string;
  videoTeaser: string;
}
export default function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const accentColor = "#E1B000"; // Gold accent color

  // Hardcoded API Key
  const HARDCODED_API_KEY = "AIzaSyAC3JWwQ3_mZwHYVZxcYbFlhB3Y2a6_hX0";

  // Load pdf.js script
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setError(null);
      setGeneratedContent(null);
      parsePdf(file);
    } else {
      setError("Veuillez sélectionner un fichier PDF.");
      setPdfFile(null);
      setExtractedText("");
    }
  };

  const parsePdf = async (file: File) => {
    if (!window.pdfjsLib) {
      setError(
        "La librairie PDF n'est pas encore chargée. Veuillez patienter."
      );
      return;
    }
    setIsParsing(true);
    setExtractedText("");
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = e.target?.result;
        if (!result) throw new Error("Aucun contenu lu dans le fichier PDF.");
        const typedarray = new Uint8Array(result as ArrayBuffer);
        // pdfjsLib.getDocument returns an object with a .promise property
        const pdfDoc = window.pdfjsLib!.getDocument({ data: typedarray });
        // Type assertion for pdf.js PDFDocumentProxy
        type PDFDocumentProxy = {
          numPages: number;
          getPage: (
            pageNumber: number
          ) => Promise<{
            getTextContent: () => Promise<{ items: { str: string }[] }>;
          }>;
        };
        const pdf = (
          "promise" in pdfDoc ? await pdfDoc.promise : await pdfDoc
        ) as PDFDocumentProxy;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: { str: string }) => item.str)
            .join(" ");
          fullText += pageText + "\n\n";
        }
        setExtractedText(fullText);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("Erreur de parsing PDF:", err);
        setError(
          `Impossible de lire le fichier PDF. Est-il corrompu ? Erreur: ${errorMsg}`
        );
        setPdfFile(null);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier.");
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const resetState = () => {
    setPdfFile(null);
    setExtractedText("");
    setGeneratedContent(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const callGeminiAPI = async (prompt: string) => {
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${HARDCODED_API_KEY}`;

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
        `Le contenu a été bloqué : ${result.promptFeedback.blockReason}. Vérifiez le contenu de votre PDF.`
      );
    }

    console.error("Unexpected API response structure:", result);
    throw new Error(
      "Aucun contenu n'a été généré. La réponse de l'API était inattendue ou vide."
    );
  };

  const handleGenerate = async () => {
    if (!extractedText.trim()) {
      setError("Le texte du PDF est vide ou n'a pas pu être lu.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);

    const basePrompt = `À partir du texte suivant d'un livre blanc, génère le contenu demandé. Le texte du livre blanc est : """${extractedText}"""\n\n`;
    const prompts = {
      seoArticle:
        basePrompt +
        "Génère un article de blog optimisé pour le SEO. Inclus un titre H1, des sous-titres H2 et H3, une meta-description de 160 caractères maximum, et intègre des mots-clés pertinents de manière naturelle.",
      newsletter:
        basePrompt +
        "Génère un court article pour une newsletter. Le ton doit être engageant et inciter au téléchargement du livre blanc complet avec un appel à l'action clair.",
      linkedinPost:
        basePrompt +
        "Génère un post LinkedIn percutant. Utilise des emojis pour la structure, inclus 3 à 5 hashtags pertinents, et termine par une question pour susciter l'engagement.",
      podcastScript:
        basePrompt +
        "Génère un script pour un podcast audio de 2-3 minutes présentant les 3 idées clés du livre blanc dans un style conversationnel. Inclus une introduction et une conclusion.",
      videoTeaser:
        basePrompt +
        "Génère un concept et un script pour une vidéo de teasing de 30-45 secondes. Décris la voix-off et les visuels clés scène par scène pour créer de la curiosité.",
    };

    try {
      const results = await Promise.all(
        Object.values(prompts).map((p) => callGeminiAPI(p))
      );
      setGeneratedContent({
        seoArticle: results[0],
        newsletter: results[1],
        linkedinPost: results[2],
        podcastScript: results[3],
        videoTeaser: results[4],
      });
      setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
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
              Générateur de Contenu Marketing
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Transformez votre livre blanc en une campagne marketing complète.
            Déposez votre PDF pour commencer.
          </p>
        </header>

        <div className="max-w-4xl mx-auto bg-zinc-800 p-8 rounded-2xl border border-zinc-700">
          {!pdfFile && (
            <div
              className="flex justify-center items-center w-full"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                handleFileChange({
                  target: { files: e.dataTransfer.files },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
            >
              <label
                htmlFor="pdf-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-zinc-600 border-dashed rounded-lg cursor-pointer bg-zinc-900/50 hover:bg-zinc-700/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud
                    className="w-10 h-10 mb-4"
                    style={{ color: accentColor }}
                  />
                  <p className="mb-2 text-sm text-gray-300">
                    <span className="font-semibold text-yellow-400">
                      Cliquez pour choisir un fichier
                    </span>{" "}
                    ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500">PDF uniquement</p>
                </div>
                <input
                  id="pdf-upload"
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {isParsing && (
            <div className="text-center p-8">
              <LoaderCircle
                className="animate-spin mx-auto"
                style={{ color: accentColor }}
                size={48}
              />
              <p className="mt-4 text-lg font-semibold text-gray-300">
                Lecture du PDF en cours...
              </p>
              <p className="text-gray-400">{pdfFile?.name}</p>
            </div>
          )}

          {!isParsing && pdfFile && extractedText && (
            <div className="text-center p-4 bg-zinc-700 border border-zinc-600 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileCheck2 className="w-8 h-8 text-green-400 mr-4" />
                  <div>
                    <p className="font-bold text-white text-left">
                      {pdfFile.name}
                    </p>
                    <p className="text-sm text-gray-300 text-left">{`PDF analysé avec succès. Prêt à générer les contenus.`}</p>
                  </div>
                </div>
                <button
                  onClick={resetState}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 bg-red-900/50 border border-red-500/30 p-3 rounded-lg mt-4 text-sm text-center">
              {error}
            </p>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={handleGenerate}
              disabled={isLoading || isParsing || !extractedText}
              className="inline-flex items-center justify-center px-8 py-4 font-bold text-white rounded-full hover:opacity-90 disabled:bg-zinc-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 focus:ring-offset-zinc-800 transition-all duration-300 shadow-lg hover:shadow-yellow-500/20 transform hover:-translate-y-1"
              style={{ backgroundColor: accentColor }}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin mr-3" size={24} />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Wand2 className="mr-3" size={24} />
                  Générer tous les contenus
                </>
              )}
            </button>
          </div>
        </div>

        {generatedContent && (
          <div ref={resultsRef} className="mt-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
              Vos contenus sont prêts !
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ContentCard
                icon={<Newspaper size={24} />}
                title="Article de Blog (SEO)"
                content={generatedContent.seoArticle}
              />
              <ContentCard
                icon={<FileText size={24} />}
                title="Newsletter"
                content={generatedContent.newsletter}
              />
              <ContentCard
                icon={<Linkedin size={24} />}
                title="Post LinkedIn"
                content={generatedContent.linkedinPost}
              />
              <ContentCard
                icon={<Mic size={24} />}
                title="Script Podcast"
                content={generatedContent.podcastScript}
              />
              <ContentCard
                icon={<Video size={24} />}
                title="Teaser Vidéo"
                content={generatedContent.videoTeaser}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
