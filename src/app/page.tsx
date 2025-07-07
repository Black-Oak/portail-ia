"use client";

import React from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <div className="font-poppins bg-background text-textLight w-screen h-screen overflow-auto">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-surface border-b border-[#333]">
        <div className="flex items-center gap-4">
          <Image
            src="/logos/blanc.png"
            alt="Logo IA Platform Solution"
            width={40}
            height={40}
            className="w-10 h-10 logo-svg"
            priority
          />
          <h1 className="text-xl font-semibold">AI Platform Solution</h1>
        </div>
        <div className="user-section flex items-center gap-4">
          <div className="flex items-center gap-2 text-primaryGold">
            <i className="fa-solid fa-user"></i>
            <span className="font-medium">
              {session?.user?.name || session?.user?.email || "Utilisateur"}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
          >
            <i className="fa-solid fa-sign-out-alt"></i>
            Se déconnecter
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Info Card */}
        <section className="bg-secondaryGreen p-6 rounded-lg mb-10">
          <div className="flex items-center text-primaryGold mb-4">
            <i className="fa-solid fa-brain text-xl mr-2"></i>
            <h2 className="text-lg">L&apos;Info IA du Jour</h2>
          </div>
          <p className="text-sm mb-4">
            Le dernier modèle de langage multimodal a atteint une précision de
            98% dans la reconnaissance d&apos;objets en conditions de faible
            luminosité.
          </p>
        </section>

        {/* Apps Section */}
        <section>
          <h2 className="text-2xl mb-6 border-l-4 border-primaryGold pl-3">
            Mes Applications
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6">
            {[
              {
                icon: "fa-file-signature",
                label: "Générateur de contenu",
                href: "/generation-contenu",
              },
              {
                icon: "fa-briefcase",
                label: "Générateur de fiches",
                href: "/generateur-fiches",
              },
              {
                icon: "fa-handshake",
                label: "Assistant Proposition",
                href: "/assistant-proposition",
              },
              {
                icon: "fa-file-zipper",
                label: "Synthèse de document",
                href: "/synthese-document",
              },
            ].map((app, idx) => (
              <a
                key={idx}
                href={app.href}
                className="app-brick bg-surface rounded-lg p-8 text-center cursor-pointer border-2 border-transparent hover:-translate-y-2 hover:border-primaryGold transition flex flex-col justify-center items-center no-underline"
              >
                <i
                  className={`fa-solid ${app.icon} text-4xl text-primaryGold mb-4`}
                ></i>
                <h3 className="text-base font-semibold flex-grow">
                  {app.label}
                </h3>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
