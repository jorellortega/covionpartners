import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with custom endpoint
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil',
  typescript: true,
  // Add any other custom configuration options as needed
});

// Helper function to verify webhook signatures
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
) {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      secret
    );
    return event;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw new Error('Webhook signature verification failed');
  }
}

// Helper function to create a payment intent
export async function createPaymentIntent(amount: number, currency: string = 'usd') {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      // Add any additional parameters as needed
    });
    return paymentIntent;
  } catch (err) {
    console.error('Error creating payment intent:', err);
    throw err;
  }
}

// Helper function to retrieve a payment intent
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (err) {
    console.error('Error retrieving payment intent:', err);
    throw err;
  }
}

// Add any other Stripe-related utility functions as needed 