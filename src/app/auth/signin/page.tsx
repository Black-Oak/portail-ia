"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  LoaderCircle,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const accentColor = "#E1B000"; // Gold accent color consistent with other pages
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else {
        // Redirection vers la page d'accueil après connexion réussie
        router.push("/");
      }
    } catch {
      setError("Une erreur est survenue lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 font-sans text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <span
              className="h-10 w-1.5"
              style={{ backgroundColor: accentColor }}
            ></span>
            <h1 className="text-3xl font-bold tracking-tight">Connexion</h1>
          </div>
          <p className="text-gray-400">
            Connectez-vous pour accéder à votre portail IA
          </p>
        </header>

        <div className="bg-zinc-800 p-8 rounded-2xl shadow-2xl border border-zinc-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Adresse email
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-200 text-gray-200 placeholder-gray-500"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-zinc-900 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-200 text-gray-200 placeholder-gray-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full inline-flex items-center justify-center px-6 py-3 font-bold text-zinc-900 rounded-lg hover:opacity-90 disabled:bg-zinc-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 focus:ring-offset-zinc-800 transition-all duration-300 shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin mr-2" size={20} />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Lien retour accueil */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
            >
              ← Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
