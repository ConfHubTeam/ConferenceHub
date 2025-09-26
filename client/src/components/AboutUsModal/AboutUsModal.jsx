import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

// SVG logo styled similar to uic.group/about
const GetSpaceLogo = () => (
  <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" rx="12" fill="#1A2233" />
    <text x="60" y="25" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="bold" fontFamily="'Montserrat', sans-serif">GETSPACE</text>
  </svg>
);

const AboutUsModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation("about");
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-[#232B3E] rounded-2xl shadow-2xl max-w-md w-full p-8 relative flex flex-col items-center">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <GetSpaceLogo />
        <h2 className="mt-6 text-2xl font-bold text-white text-center">{t("page.title")}</h2>
        <p className="mt-4 text-gray-200 text-center text-base leading-relaxed">
          {t("page.subtitle")}
        </p>
        <div className="mt-6 w-full flex flex-col gap-2">
          {t("page.features", { returnObjects: true }).map((feature, index) => {
            const colors = ["bg-blue-600", "bg-green-500", "bg-yellow-500"];
            return (
              <div key={index} className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${colors[index]}`} />
                <span className="text-sm text-gray-200">{feature.title}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-8 w-full flex flex-col items-center gap-4">
          <a
            href="/about"
            className="inline-block px-6 py-3 rounded-xl bg-accent-primary text-white font-bold text-lg shadow-lg hover:bg-accent-secondary transition-colors"
          >
            Learn more
          </a>
          <div className="text-xs text-gray-400 text-center">
            {t("page.copyright", { year: new Date().getFullYear() })}
          </div>
        </div>
      </div>
    </div>
  );
};

AboutUsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AboutUsModal;
