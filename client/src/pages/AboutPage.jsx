import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";



const aboutTranslations = {
  en: {
    title: "About Us",
    subtitle: "GetSpace is a modern platform for renting spaces for every occasion.",
    body: "We have gathered the best venues in the city: from stylish conference halls and cozy offices to photo studios, podcast and interview studios, as well as unique locations for creative and business events. Want to hold a business meeting, organize a training, record a podcast, or have a photo shoot? You can find it all with us.\n\nConvenient search filters, real photos, and up-to-date prices make the selection and booking process fast and transparent. You compare venues online and book in a few clicks — easily, safely, and without unnecessary calls.\n\nThe mission of GetSpace is to give people the freedom to find the perfect space for any moment in life: work, creativity, or celebration.",
    features: [
      { color: "bg-blue-600", title: "Premium locations", desc: "Handpicked venues in top cities for your events." },
      { color: "bg-green-500", title: "Easy online booking", desc: "Book, manage, and pay for spaces in minutes." },
      { color: "bg-yellow-500", title: "Customizable amenities", desc: "Tailor your space with tech, catering, and more." },
    ],
  },
  ru: {
    title: "О нас",
    subtitle: "GetSpace — современная платформа для аренды пространств на любой случай.",
    body: "Мы собрали лучшие площадки города: от стильных конференц-залов и уютных офисов до фотостудий, студий для подкастов и интервью, а также уникальных локаций для творческих и деловых мероприятий. Хотите провести деловую встречу, организовать тренинг, записать подкаст или устроить фотосессию? Всё это вы найдёте у нас.\n\nУдобные фильтры поиска, реальные фотографии и актуальные цены делают процесс выбора и бронирования быстрым и прозрачным. Вы сравниваете площадки онлайн и бронируете в несколько кликов — легко, безопасно и без лишних звонков.\n\nМиссия GetSpace — дать людям свободу находить идеальное пространство для любого момента жизни: работы, творчества или праздника.",
    features: [
      { color: "bg-blue-600", title: "Премиальные локации", desc: "Лучшие площадки в топовых городах для ваших мероприятий." },
      { color: "bg-green-500", title: "Удобное онлайн-бронирование", desc: "Бронируйте, управляйте и оплачивайте площадки за минуты." },
      { color: "bg-yellow-500", title: "Настраиваемые удобства", desc: "Подберите технику, кейтеринг и другие опции под себя." },
    ],
  },
  uz: {
    title: "Biz haqimizda",
    subtitle: "GetSpace — har qanday tadbir uchun zamonaviy joylarni ijaraga olish platformasi.",
    body: "Biz shahardagi eng yaxshi joylarni to'pladik: zamonaviy konferensiya zallari va qulay ofislardan tortib, fotosessiya, podkast va intervyu studiyalari hamda ijodiy va biznes tadbirlar uchun noyob lokatsiyalargacha. Biznes uchrashuv o'tkazmoqchimisiz, trening tashkil qilmoqchimisiz, podkast yozmoqchimisiz yoki fotosessiya qilmoqchimisiz? Bularning barchasini bizda topasiz.\n\nQulay qidiruv filtrlari, haqiqiy suratlar va dolzarb narxlar tanlash va bron qilish jarayonini tez va shaffof qiladi. Siz joylarni onlayn taqqoslaysiz va bir necha bosishda bron qilasiz — oson, xavfsiz va ortiqcha qo'ng'iroqlarsiz.\n\nGetSpace missiyasi — har qanday hayot lahzasi uchun: ish, ijod yoki bayram uchun mukammal joyni topishda odamlar uchun erkinlik yaratish.",
    features: [
      { color: "bg-blue-600", title: "Premium joylar", desc: "Tadbirlaringiz uchun eng yaxshi joylar." },
      { color: "bg-green-500", title: "Oson onlayn bronlash", desc: "Joylarni bir necha daqiqada bron qiling, boshqaring va to'lang." },
      { color: "bg-yellow-500", title: "Moslashtiriladigan qulayliklar", desc: "Joyingizni texnika, taom va boshqa xizmatlar bilan to'ldiring." },
    ],
  },
};

const AboutPage = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || "en";
  const tData = aboutTranslations[lang] || aboutTranslations.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2233] via-[#232B3E] to-[#2C3650] flex flex-col items-center px-4 py-12">
      {/* Top bar: Back button only */}
      <div className="w-full max-w-2xl flex items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-lg"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
      </div>
      <div className="max-w-2xl w-full flex flex-col items-center">
        <img src="/getSpace_logo.png" alt="GetSpace Logo" className="h-16 md:h-20 w-auto object-contain mb-2" />
        <h1 className="mt-8 text-5xl md:text-6xl font-extrabold text-white text-center tracking-tight leading-tight font-montserrat">
          {tData.title}
        </h1>
        <h2 className="mt-6 text-2xl md:text-3xl font-bold text-gray-100 text-center font-montserrat">
          {tData.subtitle}
        </h2>
        <p className="mt-8 text-xl md:text-2xl text-gray-200 text-center leading-relaxed font-medium whitespace-pre-line font-montserrat">
          {tData.body}
        </p>
  <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {tData.features.map((f, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className={`inline-block w-4 h-4 rounded-full mb-3 ${f.color}`} />
              <span className="text-lg text-white font-semibold font-montserrat">{f.title}</span>
              <span className="mt-2 text-gray-300 text-center text-base font-montserrat">{f.desc}</span>
            </div>
          ))}
        </div>
        <div className="mt-16 text-base text-gray-400 text-center">
          &copy; {new Date().getFullYear()} GetSpace. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
