interface ValidationParams {
  amount: number
  balance: number
  paymentMethod: string
  linkedBankAccount: string | null
  paypalEmail: string
  cardDetails: {
    name: string
    number: string
    expiry: string
    cvc: string
  }
}

interface ValidationResult {
  isValid: boolean
  error: string | null
}

// Define withdrawal limits by payment method
const WITHDRAWAL_LIMITS = {
  plaid: { min: 10, max: 10000 },
  paypal: { min: 5, max: 5000 },
  stripe: { min: 5, max: 2500 },
}

export function validateWithdrawal(params: ValidationParams): ValidationResult {
  const { amount, balance, paymentMethod, linkedBankAccount, paypalEmail, cardDetails } = params

  // Check for valid amount
  if (isNaN(amount) || amount <= 0) {
    return {
      isValid: false,
      error: "Please enter a valid amount",
    }
  }

  // Check withdrawal limits
  const limits = WITHDRAWAL_LIMITS[paymentMethod as keyof typeof WITHDRAWAL_LIMITS] || { min: 1, max: 1000 }

  if (amount < limits.min) {
    return {
      isValid: false,
      error: `Minimum withdrawal amount is $${limits.min} for ${getPaymentMethodName(paymentMethod)}`,
    }
  }

  if (amount > limits.max) {
    return {
      isValid: false,
      error: `Maximum withdrawal amount is $${limits.max} for ${getPaymentMethodName(paymentMethod)}`,
    }
  }

  // Check sufficient balance
  if (amount > balance) {
    return {
      isValid: false,
      error: "Insufficient funds",
    }
  }

  // Validate payment method specific details
  if (paymentMethod === "plaid" && !linkedBankAccount) {
    return {
      isValid: false,
      error: "Please link a bank account first",
    }
  }

  if (paymentMethod === "paypal" && !paypalEmail) {
    return {
      isValid: false,
      error: "Please enter your PayPal email",
    }
  }

  if (paymentMethod === "stripe") {
    if (!cardDetails.name) {
      return {
        isValid: false,
        error: "Please enter the name on the card",
      }
    }

    if (!cardDetails.number) {
      return {
        isValid: false,
        error: "Please enter the card number",
      }
    }

    if (!cardDetails.expiry) {
      return {
        isValid: false,
        error: "Please enter the expiration date",
      }
    }

    if (!cardDetails.cvc) {
      return {
        isValid: false,
        error: "Please enter the CVC code",
      }
    }
  }

  return {
    isValid: true,
    error: null,
  }
}

// Helper function to get payment method display name
function getPaymentMethodName(method: string): string {
  switch (method) {
    case "plaid":
      return "Bank Transfer (ACH)"
    case "paypal":
      return "PayPal"
    case "stripe":
      return "Debit Card"
    default:
      return method
  }
}

