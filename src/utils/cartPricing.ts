export interface CartPricing {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  minOrderRequired: number; // 50
  isMinOrderMet: boolean;
  minOrderShortfall: number;
  nudgeMessage: string;
  freeDeliveryUnlocked: boolean;
  discountApplied: boolean;
}

/**
 * Calculates delivery charges, tier discounts and minimum order requirements for ApnaMart:
 * - Minimum order criteria: ₹50 from one shop
 * - Below ₹50: Warning prompt, cannot checkout (Add ₹X more to reach ₹50)
 * - ₹50 to < ₹100: Basic delivery charge of ₹20 displayed automatically in cart (Add ₹X more to get ₹15 OFF)
 * - ₹100 to ₹150: ₹15 Discount applied (Delivery fee ₹20, Discount ₹15 -> Net delivery ₹5)
 * - Above ₹150 (> ₹150): FREE Delivery (₹0 Delivery Charge)
 */
export function calculateCartPricing(subtotal: number): CartPricing {
  const minOrderRequired = 50;
  const cleanSubtotal = Math.max(0, Number(subtotal.toFixed(2)));
  const isMinOrderMet = cleanSubtotal >= minOrderRequired;
  const minOrderShortfall = Math.max(0, Number((minOrderRequired - cleanSubtotal).toFixed(2)));

  let deliveryFee = 0;
  let discount = 0;
  let nudgeMessage = '';
  let freeDeliveryUnlocked = false;
  let discountApplied = false;

  if (cleanSubtotal <= 0) {
    deliveryFee = 0;
    discount = 0;
    nudgeMessage = '';
  } else if (cleanSubtotal < minOrderRequired) {
    // Under minimum order requirement of ₹50
    deliveryFee = 20;
    discount = 0;
    nudgeMessage = `⚠️ Min order ₹50: Add ₹${minOrderShortfall.toFixed(2)} more to place order`;
  } else if (cleanSubtotal >= 50 && cleanSubtotal < 100) {
    // ₹50 to ₹100: Basic delivery fee of ₹20 automatically shown
    deliveryFee = 20;
    discount = 0;
    const toDiscount = Number((100 - cleanSubtotal).toFixed(2));
    nudgeMessage = `💡 Add ₹${toDiscount} more to get ₹15 DISCOUNT!`;
  } else if (cleanSubtotal >= 100 && cleanSubtotal <= 150) {
    // ₹100 to ₹150: ₹15 discount granted
    deliveryFee = 20;
    discount = 15;
    discountApplied = true;
    const toFree = Number((150.01 - cleanSubtotal).toFixed(2));
    nudgeMessage = `🎉 ₹15 Discount applied! Add ₹${toFree} more for FREE Delivery!`;
  } else {
    // Above ₹150: Free delivery
    deliveryFee = 0;
    discount = 0;
    freeDeliveryUnlocked = true;
    nudgeMessage = `🎉 FREE Delivery Unlocked on orders above ₹150!`;
  }

  const grandTotal = Math.max(0, Number((cleanSubtotal + deliveryFee - discount).toFixed(2)));

  return {
    subtotal: cleanSubtotal,
    deliveryFee,
    discount,
    grandTotal,
    minOrderRequired,
    isMinOrderMet,
    minOrderShortfall,
    nudgeMessage,
    freeDeliveryUnlocked,
    discountApplied,
  };
}

