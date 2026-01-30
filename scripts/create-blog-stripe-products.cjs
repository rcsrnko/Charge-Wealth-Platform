#!/usr/bin/env node
/**
 * Create Stripe products and prices for Take Charge Blog subscription
 * Run once to set up the products in Stripe
 */

const Stripe = require('stripe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

async function createBlogProducts() {
  console.log('Creating Take Charge Blog subscription products in Stripe...\n');

  try {
    // Check if product already exists
    const existingProducts = await stripe.products.list({ limit: 100 });
    const existingBlogProduct = existingProducts.data.find(
      p => p.metadata?.product_type === 'take_charge_blog'
    );

    let product;
    if (existingBlogProduct) {
      console.log('Product already exists:', existingBlogProduct.id);
      product = existingBlogProduct;
    } else {
      // Create the product
      product = await stripe.products.create({
        name: 'Take Charge Blog Pro',
        description: 'Premium access to all Take Charge blog content - tax strategies, financial planning guides, and market insights.',
        metadata: {
          product_type: 'take_charge_blog',
        },
      });
      console.log('Created product:', product.id, '-', product.name);
    }

    // Check for existing prices
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 10,
    });

    const hasMonthly = existingPrices.data.some(
      p => p.recurring?.interval === 'month' && p.unit_amount === 900
    );
    const hasYearly = existingPrices.data.some(
      p => p.recurring?.interval === 'year' && p.unit_amount === 8700
    );

    // Create monthly price ($9/month)
    let monthlyPrice;
    if (hasMonthly) {
      monthlyPrice = existingPrices.data.find(
        p => p.recurring?.interval === 'month' && p.unit_amount === 900
      );
      console.log('Monthly price already exists:', monthlyPrice.id);
    } else {
      monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: 900, // $9.00
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          plan_type: 'blog_monthly',
        },
      });
      console.log('Created monthly price:', monthlyPrice.id, '- $9/month');
    }

    // Create yearly price ($87/year - saves $21)
    let yearlyPrice;
    if (hasYearly) {
      yearlyPrice = existingPrices.data.find(
        p => p.recurring?.interval === 'year' && p.unit_amount === 8700
      );
      console.log('Yearly price already exists:', yearlyPrice.id);
    } else {
      yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: 8700, // $87.00
        currency: 'usd',
        recurring: {
          interval: 'year',
        },
        metadata: {
          plan_type: 'blog_yearly',
        },
      });
      console.log('Created yearly price:', yearlyPrice.id, '- $87/year (save $21)');
    }

    console.log('\n✅ Stripe products created successfully!\n');
    console.log('Product ID:', product.id);
    console.log('Monthly Price ID:', monthlyPrice.id);
    console.log('Yearly Price ID:', yearlyPrice.id);
    console.log('\nAdd these to your .env file:');
    console.log(`STRIPE_BLOG_PRODUCT_ID=${product.id}`);
    console.log(`STRIPE_BLOG_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
    console.log(`STRIPE_BLOG_YEARLY_PRICE_ID=${yearlyPrice.id}`);

    return { product, monthlyPrice, yearlyPrice };
  } catch (error) {
    console.error('Error creating Stripe products:', error.message);
    throw error;
  }
}

async function setupWebhook() {
  console.log('\n--- Setting up webhook ---\n');
  
  const webhookUrl = 'https://chargewealth.co/api/stripe/webhook';
  
  try {
    // Check existing webhooks
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const existingWebhook = webhooks.data.find(w => w.url === webhookUrl);
    
    if (existingWebhook) {
      console.log('Webhook already exists:', existingWebhook.id);
      console.log('URL:', existingWebhook.url);
      console.log('Events:', existingWebhook.enabled_events.join(', '));
      
      // Update to ensure all events are enabled
      const updated = await stripe.webhookEndpoints.update(existingWebhook.id, {
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed',
        ],
      });
      console.log('Webhook updated with all necessary events');
      return existingWebhook;
    }

    // Create new webhook
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
      ],
    });

    console.log('Created webhook:', webhook.id);
    console.log('URL:', webhook.url);
    console.log('\n⚠️  IMPORTANT: Copy the webhook secret from Stripe Dashboard');
    console.log('Go to: https://dashboard.stripe.com/webhooks');
    console.log('Click on the webhook and copy the signing secret');
    console.log('Add to .env: STRIPE_WEBHOOK_SECRET=whsec_...');

    return webhook;
  } catch (error) {
    console.error('Error setting up webhook:', error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Take Charge Blog - Stripe Setup');
  console.log('='.repeat(60));
  console.log();
  
  await createBlogProducts();
  await setupWebhook();
  
  console.log('\n' + '='.repeat(60));
  console.log('Setup complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);
