import { useTranslation } from "react-i18next";

export default function MaxAttendeesInput({ maxGuests, setMaxGuests }) {
  const { t } = useTranslation("places");
  
  return (
    <div className="w-full">
      <label htmlFor="maxGuests" className="block mb-0 text-sm font-medium text-gray-700">
        {t("places:form.pricingAndCapacity.maxAttendees")}
      </label>
      <input
        id="maxGuests"
        type="number"
        min="1"
        placeholder="10"
        value={maxGuests}
        onChange={(event) => setMaxGuests(event.target.value)}
        className="w-full border py-2 px-3 rounded-xl text-base h-[42px]"
      />
    </div>
  );
}
