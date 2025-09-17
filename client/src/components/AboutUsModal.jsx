import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const aboutUsTexts = {
  uz: `Biz haqimizda\n\nGetSpace — zamonaviy maydonlarni ijaraga olish platformasi.\n\nBiz shaharning eng yaxshi maydonlarini to‘pladik: zamonaviy konferensiya zallari va qulay ofislardan tortib, fotostudiyalar, podkast va intervyu studiyalari, shuningdek, ijodiy va ishbilarmonlik tadbirlari uchun noyob joylargacha. Ish uchrashuvini o‘tkazmoqchimisiz, trening tashkil qilmoqchimisiz, podkast yozmoqchimisiz yoki fotosessiya qilmoqchimisiz? Bularning barchasini bizda topasiz.\n\nQulay qidiruv filtrlari, haqiqiy suratlar va dolzarb narxlar tanlash va bron qilish jarayonini tez va shaffof qiladi. Siz maydonlarni onlayn solishtirasiz va bir necha bosishda bron qilasiz — oson, xavfsiz va ortiqcha qo‘ng‘iroqlarsiz.\n\nGetSpace’ning missiyasi — odamlar uchun hayotning har qanday lahzasi uchun: ish, ijod yoki bayram uchun ideal maydonni topishda erkinlik berish.`,
  ru: `О нас\n\nGetSpace — современная платформа для аренды пространств на все случаи жизни.\n\nМы собрали лучшие площадки города: от стильных конференц-залов и уютных офисов до фотостудий, студий для подкастов и интервью, а также уникальных локаций для творческих и деловых мероприятий. Хотите провести деловую встречу, организовать тренинг, записать подкаст или провести фотосессию? Всё это можно найти у нас.\n\nУдобные фильтры поиска, реальные фотографии и актуальные цены делают процесс выбора и бронирования быстрым и прозрачным. Вы сравниваете площадки онлайн и бронируете в пару кликов — легко, безопасно и без лишних звонков.\n\nМиссия GetSpace — дать людям свободу находить идеальное пространство для любого момента жизни: работы, творчества или праздника.`,
  en: `About Us\n\nGetSpace is a modern platform for renting spaces for every occasion.\n\nWe have gathered the best venues in the city: from stylish conference halls and cozy offices to photo studios, podcast and interview studios, as well as unique locations for creative and business events. Want to hold a business meeting, organize a training, record a podcast, or have a photo shoot? You can find it all with us.\n\nConvenient search filters, real photos, and up-to-date prices make the selection and booking process fast and transparent. You compare venues online and book in a few clicks — easily, safely, and without unnecessary calls.\n\nThe mission of GetSpace is to give people the freedom to find the perfect space for any moment in life: work, creativity, or celebration.`
};

export default function AboutUsModal({ open, onClose }) {
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0];
  const text = aboutUsTexts[lang] || aboutUsTexts.en;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-brand-primary/80 to-brand-secondary/90 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 border border-brand-primary/10 animate-fade-in">
        <button
          className="absolute top-3 right-3 text-brand-primary hover:text-brand-secondary text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/30 rounded-full transition"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex flex-col items-center mb-4">
          <img src="/getSpace_logo.png" alt="GetSpace" className="h-12 w-auto mb-2 drop-shadow-lg" />
          <h2 className="text-2xl font-bold text-brand-primary mb-2 tracking-tight">
            {text.split('\n')[0]}
          </h2>
        </div>
        <div className="whitespace-pre-line text-gray-800 text-base leading-relaxed px-1">
          {text.split('\n').slice(1).join('\n')}
        </div>
      </div>
    </div>
  );
}
