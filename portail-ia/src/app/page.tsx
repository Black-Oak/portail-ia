"use client";

import React, { useEffect } from "react";
import Image from "next/image";

export default function Home() {
  useEffect(() => {
    const appContainer = document.querySelector("#app-container");

    if (!appContainer) return;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;

      const brick = target.closest(".app-brick");
      if (brick) {
        if (brick.classList.contains("add-new")) {
          alert(
            "Simulation : Ouverture de l'interface pour ajouter une nouvelle application..."
          );
        } else {
          if (!(brick instanceof HTMLAnchorElement)) {
            const appName = brick.querySelector("h3")?.textContent;
            alert(`Simulation : Lancement de l'application "${appName}"...`);
          }
        }
      }

      const infoLink = target.closest(".info-card-link");
      if (infoLink) {
        event.preventDefault();
        alert(
          "Simulation : Affichage de l'article complet sur l'Info IA du Jour..."
        );
      }
    };

    appContainer.addEventListener("click", handleClick);

    return () => {
      appContainer.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div
      id="app-container"
      className="font-poppins bg-background text-textLight w-screen h-screen overflow-auto"
    >
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
        <div className="user-profile">
          <i className="fa-solid fa-user text-2xl cursor-pointer hover:text-primaryGold transition-colors"></i>
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
          <a
            href="#"
            className="block text-right text-textLight font-semibold hover:text-primaryGold hover:-translate-x-1 transition"
          >
            En savoir plus &gt;
          </a>
        </section>

        {/* Apps Section */}
        <section>
          <h2 className="text-2xl mb-6 border-l-4 border-primaryGold pl-3">
            Mes Applications
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6">
            {[
              { icon: "fa-chart-pie", label: "Analyse de données" },
              {
                icon: "fa-magnifying-glass-chart",
                label: "Decouverte prospect",
              },
              {
                icon: "fa-file-signature",
                label: "Générateur de contenu",
                href: "/generation-contenu",
              },
              { icon: "fa-robot", label: "Chatbot RH" },
              { icon: "fa-address-card", label: "Matching de CV" },
              { icon: "fa-file-word", label: "Mise au format de document" },
            ].map((app, idx) =>
              app.href ? (
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
              ) : (
                <div
                  key={idx}
                  className="app-brick bg-surface rounded-lg p-8 text-center cursor-pointer border-2 border-transparent hover:-translate-y-2 hover:border-primaryGold transition flex flex-col justify-center items-center"
                >
                  <i
                    className={`fa-solid ${app.icon} text-4xl text-primaryGold mb-4`}
                  ></i>
                  <h3 className="text-base font-semibold flex-grow">
                    {app.label}
                  </h3>
                </div>
              )
            )}
            <div className="app-brick add-new border-2 border-dashed border-[#555] bg-surface rounded-lg p-8 text-center cursor-pointer hover:border-primaryGold transition flex flex-col justify-center items-center">
              <i className="fa-solid fa-plus text-4xl text-[#777] hover:text-primaryGold transition-colors mb-4"></i>
              <h3 className="text-base font-semibold flex-grow">Ajouter</h3>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
