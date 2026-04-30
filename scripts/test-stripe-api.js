require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

async function testStripe() {
  try {
    console.log('Testing Stripe API with key:', process.env.STRIPE_SECRET_KEY?.substring(0, 20) + '...');
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
    
    console.log('\n✅ Stripe client created successfully');
    
    // Try to create a simple payment intent
    console.log('\nTrying to create a test payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 7900,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      description: 'Test payment',
    });
    
    console.log('\n✅ Payment Intent created successfully!');
    console.log('ID:', paymentIntent.id);
    console.log('Status:', paymentIntent.status);
    console.log('Amount:', paymentIntent.amount);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Type:', error.type);
    console.error('Code:', error.code);
  }
}

testStripe();
