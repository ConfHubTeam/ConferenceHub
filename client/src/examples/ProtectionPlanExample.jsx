/**
 * Protection Plan Configuration Test
 * This demonstrates how the protection plan percentage is automatically calculated
 */

// Example of how the configuration works:

import { PROTECTION_PLAN_CONFIG } from '../utils/refundPolicyUtils.js';

// Usage examples:
// - For calculations: totalPrice * PROTECTION_PLAN_CONFIG.PROTECTION_RATE
// - For display: `${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}% protection plan`

export default function ProtectionPlanExample() {
  return (
    <div>
      <h3>Protection Plan Configuration</h3>
      <p>Rate: {PROTECTION_PLAN_CONFIG.PROTECTION_RATE}</p>
      <p>Display: {PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}%</p>
      
      <h4>Examples:</h4>
      <ul>
        <li>Rate 0.15 → Display 15%</li>
        <li>Rate 0.20 → Display 20%</li>
        <li>Rate 0.25 → Display 25%</li>
        <li>Rate 0.30 → Display 30%</li>
      </ul>
    </div>
  );
}
