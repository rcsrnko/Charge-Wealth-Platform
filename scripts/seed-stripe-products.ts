import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  console.log('Creating Charge Wealth products in Stripe...');
  
  const stripe = await getUncachableStripeClient();

  // Check if product already exists
  const existingProducts = await stripe.products.search({ 
    query: "name:'Charge Wealth Lifetime Access'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Product already exists:', existingProducts.data[0].id);
    
    // Get existing prices
    const prices = await stripe.prices.list({ 
      product: existingProducts.data[0].id,
      active: true 
    });
    
    if (prices.data.length > 0) {
      console.log('Price ID:', prices.data[0].id);
      console.log('Amount:', prices.data[0].unit_amount! / 100, prices.data[0].currency.toUpperCase());
    }
    return;
  }

  // Create the Lifetime Access product
  const product = await stripe.products.create({
    name: 'Charge Wealth Lifetime Access',
    description: 'Lifetime access to Charge Wealth - AI-powered financial decision support. Includes AI Advisor, Tax Advisor, Portfolio Engine, Custom Playbooks, and all future updates.',
    metadata: {
      type: 'lifetime_access',
      features: 'ai_advisor,tax_advisor,portfolio_engine,playbooks,cfo_recommendations',
    }
  });

  console.log('Created product:', product.id);

  // Create the $279 one-time price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 27900, // $279.00 in cents
    currency: 'usd',
    metadata: {
      display_name: 'Lifetime Access - Early Bird',
    }
  });

  console.log('Created price:', price.id);
  console.log('\nSetup complete!');
  console.log('Product ID:', product.id);
  console.log('Price ID:', price.id);
  console.log('\nUse this Price ID in your checkout flow.');
}

createProducts().catch(console.error);
