// Finance Dailies Newsletter - January 29, 2026
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pbnixrlwlrhqbdkcuagd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibml4cmx3bHJocWJka2N1YWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc0NDU0NCwiZXhwIjoyMDgzMzIwNTQ0fQ.HEqIMm41sW7VeX93Hb08SmJ7EBy392et0IePZqBK448'
);

const contentHtml = `<p>Today's market was a masterclass in what happens when Wall Street expectations meet reality. Software got crushed, gold went parabolic, and Congress is about to shut down the government. Again. Let me break down what actually matters.</p>

<h2>Microsoft: When "Beating Estimates" Isn't Enough</h2>

<p>Microsoft dropped 10% today. Not because they missed earnings. They beat on both revenue and profit. The problem? Cloud growth is slowing, and in a market that's priced every tech company for perfection, "slower growth" might as well be a death sentence.</p>

<p>The ripple effect was brutal. ServiceNow down 10%. Atlassian down 11%. Salesforce down 6%. The entire software sector got taken behind the woodshed because investors realized that maybe, just maybe, the AI hype train doesn't automatically print money for every tech company.</p>

<p>Here's the thing though. Meta surged 10% on the exact same day. Apple beat estimates after hours and popped. The market isn't punishing tech broadly. It's getting surgical. Companies showing actual AI results get rewarded. Companies where the AI story is "trust us, it's coming" are getting crushed.</p>

<p><strong>What this means for you:</strong> If you're holding software stocks, ask yourself one question. Is this company showing real AI monetization, or are they just talking about it? The market is done waiting.</p>

<h2>Gold at $5,600: Not Your Grandfather's Safe Haven</h2>

<p>Gold nearly hit $5,600 today before profit-taking kicked in. Silver broke $120. This isn't normal behavior.</p>

<p>Central banks are buying gold like it's going out of style. Geopolitical tensions are elevated. And here's the part nobody wants to talk about: the dollar just hit a four-year low. When the world's reserve currency is weakening while gold is screaming higher, that's not a coincidence. That's a message.</p>

<p>I'm not a gold bug. I think most gold investors are insufferable. But when every central bank on the planet is diversifying away from dollar assets, you have to pay attention. The old playbook of "stocks and bonds" is evolving whether we like it or not.</p>

<p><strong>What this means for you:</strong> A 5-10% allocation to gold or gold miners isn't crazy anymore. It's risk management. Use our <a href="/calculators">Net Worth Tracker</a> to see where your portfolio actually stands on diversification.</p>

<h2>Government Shutdown: The Dumbest Game in Washington</h2>

<p>Kalshi is pricing a 79% chance of government shutdown starting Saturday. The Senate just failed to advance a funding bill. The issue? Democrats want to strip DHS funding over recent immigration enforcement incidents. Republicans won't budge. The House is on recess.</p>

<p>For most people, a short shutdown doesn't matter much. Federal workers get back pay eventually. But here's what does matter: every shutdown chips away at the full faith and credit narrative that makes Treasury bonds the "risk-free" asset. At some point, the market will stop giving Congress the benefit of the doubt.</p>

<p>We're not there yet. But we're getting closer.</p>

<p><strong>What this means for you:</strong> Don't panic. Shutdowns are usually resolved within days. But if you're relying on government services or expecting a tax refund, build in extra buffer time.</p>

<h2>The Fed: Still Playing It Cool</h2>

<p>The Fed held rates at 3%-3.75%, exactly as expected. No surprises there. The bigger news is Trump announcing he'll name Powell's replacement next week. BlackRock's Rick Rieder is the favorite.</p>

<p>A new Fed chair could mean a more dovish stance on rates. Or it could mean nothing changes. What I do know: markets are pricing in rate stability through mid-year. Use that window to lock in any refinancing you've been putting off.</p>

<h2>The Bottom Line</h2>

<p>Today was a reminder that markets are getting more discerning. The days of "rising tide lifts all boats" are over. Winners are separating from losers in real-time.</p>

<p>If your portfolio is concentrated in software stocks that haven't proven their AI story, today was a warning shot. If you have zero exposure to hard assets while gold is making new highs weekly, that's worth examining.</p>

<p>And if you're still trying to time the market based on what Congress might do? Stop. Focus on what you can control: your savings rate, your tax strategy, your asset allocation. That's what actually moves the needle.</p>

<p>Check out our <a href="/calculators/tax-bracket">Tax Bracket Calculator</a> to optimize before the shutdown chaos, and use the <a href="/calculators/advisor-fee">Advisor Fee Calculator</a> to make sure you're not paying someone 1% to underperform an index fund.</p>

<p>See you tomorrow.</p>

<p><em>- CFOAnon</em></p>`;

const blogPost = {
  slug: "finance-dailies-2026-01-29",
  title: "Microsoft Tanks, Gold Screams, and Washington Plays Chicken",
  preview: "Today's market was a masterclass in what happens when Wall Street expectations meet reality. Software got crushed, gold went parabolic, and Congress is about to shut down the government.",
  content_html: contentHtml,
  content_markdown: null,
  featured_image: null,
  published_at: new Date().toISOString()
};

async function main() {
  console.log('Inserting blog post into Supabase...');
  
  const { data, error } = await supabase
    .from('blog_posts')
    .insert(blogPost)
    .select();
  
  if (error) {
    console.error('Insert error:', error);
    if (error.code === '23505') {
      console.log('Post exists, updating...');
      const { data: updated, error: updateErr } = await supabase
        .from('blog_posts')
        .update(blogPost)
        .eq('slug', blogPost.slug)
        .select();
      if (updateErr) console.error('Update error:', updateErr);
      else console.log('Updated:', updated?.[0]?.slug);
    }
  } else {
    console.log('Inserted:', data?.[0]?.slug);
    console.log('\nURL: https://chargewealth.co/blog/' + blogPost.slug);
  }
}

main().catch(console.error);
