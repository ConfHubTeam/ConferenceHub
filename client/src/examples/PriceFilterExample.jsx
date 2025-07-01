import { useState } from "react";
import { PriceFilterProvider } from "../contexts/PriceFilterContext";
import { CurrencyProvider } from "../contexts/CurrencyContext";
import PriceFilterModal from "../components/PriceFilterModal";

/**
 * Example usage of PriceFilterModal component
 * This demonstrates how to integrate the price filter modal into your application
 * 
 * Usage:
 * 1. Wrap your app with PriceFilterProvider and CurrencyProvider
 * 2. Create a button or trigger to open the modal
 * 3. Use the modal state to control open/close
 */
export default function PriceFilterExample() {
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  return (
    <CurrencyProvider>
      <PriceFilterProvider>
        <div className="p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Price Filter Example</h2>
          
          {/* Trigger button */}
          <button
            onClick={() => setIsPriceModalOpen(true)}
            className="w-full px-4 py-3 bg-brand-purple text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition-colors"
          >
            Open Price Filter
          </button>

          {/* Modal */}
          <PriceFilterModal
            isOpen={isPriceModalOpen}
            onClose={() => setIsPriceModalOpen(false)}
          />
        </div>
      </PriceFilterProvider>
    </CurrencyProvider>
  );
}
