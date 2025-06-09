export default function MaxAttendeesInput({ maxGuests, setMaxGuests }) {
  return (
    <div className="w-full">
      <label htmlFor="maxGuests" className="block mb-2 text-sm font-medium text-gray-700">
        Max attendees
      </label>
      <input
        id="maxGuests"
        type="number"
        min="1"
        placeholder="10"
        value={maxGuests}
        onChange={(event) => setMaxGuests(event.target.value)}
        className="w-full border py-2 px-3 rounded-xl text-base"
      />
    </div>
  );
}
