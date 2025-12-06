// seedBlogs.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Blog from "./models/Blog.js"; // adjust path if your Blog model is elsewhere

dotenv.config();

// Paste your BLOG_POSTS here (same structure as in frontend)
const BLOG_POSTS = [
  {
    title:
      "How OneRise Group is Redefining Modern Living Through Real Estate & Home Upgrades",
    slug: "redefining-modern-living-real-estate",
    desc: "In today’s fast-paced world, homeowners seek more than just a place to live—they want a space that reflects comfort, style, and long-term value.",
    content: `
    <p>
  In today's fast-paced world, homeowners seek more than just a place to live—they
  want a space that reflects comfort, style, and long-term value. At 
  <strong>OneRise Group</strong>, we bring a unique approach to modern living by combining 
  high-quality real estate services with premium kitchen and bathroom fittings distribution.
</p>

<p>
  This dual expertise allows us to support customers at every step of their home journey—
  from finding the perfect property to enhancing it with top-tier fixtures and finishes.
  By integrating both services under one roof, we make the home transformation process
  easier, more affordable, and more personalized. Whether you’re buying, selling,
  renovating, or upgrading, <strong>OneRise Group</strong> provides the tools, expertise, and products
  to elevate your living space.
</p>
    `,
  },
  {
    title: "Top 5 Home Upgrades That Boost Property Value in 2025",
    slug: "top-5-home-upgrades-2025",
    desc: "When it comes to increasing your property’s value, not all upgrades are created equal. According to current market trends, the most impactful...",
    content: `
    <p>
  When it comes to increasing your property’s value, not all upgrades are created equal.
  According to current market trends, the most impactful renovations happen in the
  kitchen and bathrooms—the areas where <strong>OneRise Group</strong> specializes.
</p>

<p>Here are the top five upgrades homeowners are investing in:</p>

<ol>
  <li>
    <strong>Modern Faucets &amp; Fixtures</strong><br />
    Switching to sleek, water-efficient fixtures instantly elevates the space and saves
    money long-term.
  </li>
  <li>
    <strong>Smart Bathroom Accessories</strong><br />
    Touchless faucets, LED mirrors, and sensor lighting are trending in 2025.
  </li>
  <li>
    <strong>Quartz Countertops</strong><br />
    Highly durable, beautiful, and popular among buyers.
  </li>
  <li>
    <strong>Updated Cabinet Hardware</strong><br />
    Small change, big impact—modern knobs and handles refresh the look instantly.
  </li>
  <li>
    <strong>High-Pressure Shower Systems</strong><br />
    An upgraded shower experience is a strong selling point in today’s market.
  </li>
</ol>

<p>
  <strong>OneRise Group</strong> offers a wide selection of these fittings, making it easy for
  homeowners and investors to upgrade efficiently and affordably.
</p>

    `,
  },
  {
    title:
      "Why Working With a Full-Service Real Estate Team Gives You an Advantage",
    slug: "real-estate-team-advantage",
    desc: "Buying or selling real estate can feel overwhelming—but partnering with a full-service company like OneRise Group ensures a smoother, more confident experience.",
    content: `
    
    <p>
  Buying or selling real estate can feel overwhelming—but partnering with a full-service
  company like OneRise Group ensures a smoother, more confident experience.
</p>

<p>Here’s how:</p>

<ol>
  <li>
    <strong>Market Expertise</strong><br>
    We analyze neighborhood growth, pricing trends, and buyer behavior to guide you correctly.
  </li>
  <li>
    <strong>Negotiation Power</strong><br>
    Our team works to secure the best deal—whether you're buying your dream home or
    selling for maximum return.
  </li>
  <li>
    <strong>End-to-End Support</strong><br>
    From showings and contracts to inspections and closing, we manage every detail.
  </li>
  <li>
    <strong>Added Value Through Home Improvement Solutions</strong><br>
    Because we also distribute kitchen and bathroom fittings, our clients get access to
    premium products for upgrading or staging their property before listing.
  </li>
</ol>

<p>
  This bundled approach gives buyers and sellers a competitive advantage in today’s market.
</p>
`,
  },
  {
    title:
      "Guide to Choosing the Right Kitchen & Bathroom Fittings for Your Home",
    slug: "choosing-kitchen-bathroom-fittings",
    desc: "Selecting fittings might seem like a small step in a renovation, but the right choices create a lasting impact on appearance, function, and resale value.",
    content: `
    <p>
  Selecting fittings might seem like a small step in a renovation, but the right choices
  create a lasting impact on appearance, function, and resale value.
</p>

<p>Here’s a quick guide from OneRise Group experts:</p>

<ol>
  <li>
    <strong>Define Your Design Style</strong><br>
    Modern? Traditional? Industrial? Choose fittings that match your theme.
  </li>
  <li>
    <strong>Check Material &amp; Quality</strong><br>
    Solid brass, stainless steel, and corrosion-resistant finishes ensure longevity.
  </li>
  <li>
    <strong>Focus on Water Efficiency</strong><br>
    Eco-friendly faucets and showerheads reduce bills and conserve water.
  </li>
  <li>
    <strong>Match the Finishes</strong><br>
    Brushed nickel, matte black, chrome—consistency creates a polished look.
  </li>
  <li>
    <strong>Consider Everyday Use</strong><br>
    Make sure fixtures are easy to clean, maintain, and operate.
  </li>
</ol>

<p>
  OneRise Group carries curated collections that meet both aesthetic and performance
  standards.
</p>

    `,
  },
  {
    title: "Kitchen & Bathroom Trends to Watch in 2025",
    slug: "kitchen-bathroom-trends-2025",
    desc: "The home design world is constantly evolving, and 2025 is bringing exciting new trends. Here are the ones homeowners love right now...",
    content: `
    <p>
  The home design world is constantly evolving, and 2025 is bringing exciting new
  trends. Here are the ones homeowners love right now:
</p>

<ol>
  <li>
    <strong>Matte Black Finishes</strong><br>
    Bold, elegant, and easy to maintain.
  </li>
  <li>
    <strong>Warm Metallics</strong><br>
    Brushed gold and champagne bronze bring luxury to kitchens and bathrooms.
  </li>
  <li>
    <strong>Space-Saving Storage Solutions</strong><br>
    Pull-out organizers, drawer dividers, and hidden storage are in demand.
  </li>
  <li>
    <strong>Spa-Inspired Bathrooms</strong><br>
    Rainfall showers, body jets, and soaking tubs are becoming essentials.
  </li>
  <li>
    <strong>Minimalist Kitchen Designs</strong><br>
    Clean lines, handle-less cabinets, and integrated appliances create a modern feel.
  </li>
</ol>

<p>
  At OneRise Group, we source and supply fittings that align with these evolving trends
  so homeowners can stay ahead of the curve.
</p>

    `,
  },
  {
    title:
      "The Benefits of Upgrading Your Kitchen Fixtures Before Selling Your Home",
    slug: "benefits-upgrading-kitchen-fixtures",
    desc: "If you’re preparing to list your home, a simple and affordable way to boost resale value is by upgrading your kitchen fixtures.",
    content: `
    <p>
  If you’re preparing to list your home, a simple and affordable way to boost resale value
  is by upgrading your kitchen fixtures. Buyers pay close attention to kitchens, and
  modern fixtures instantly make a home look more updated and well-maintained.
</p>

<p>
  New faucets, cabinet handles, sink systems, and lighting can transform an outdated
  kitchen into a fresh, attractive space. At OneRise Group, we offer stylish, high-quality
  fixtures that help sellers stand out in the market without overspending on a full
  renovation.
</p>
    `,
  },
  {
    title: "How OneRise Group Supports Builders With Bulk Supply Solutions",
    slug: "builders-bulk-supply-solutions",
    desc: "For builders and contractors, consistency and reliability are everything. OneRise Group provides high-volume kitchen and bathroom fittings that are durable and design-forward.",
    content: `
    <p>
  For builders and contractors, consistency and reliability are everything. OneRise Group
  provides high-volume kitchen and bathroom fittings that are durable, affordable, and
  delivered on schedule.
</p>

<p>
  Whether it’s a single custom home or a 200-unit development, we ensure product
  availability, quality control, and smooth logistics. Builders trust us because we combine
  real estate insight with product expertise, making us a strong partner for construction
  projects.
</p>
    `,
  },
  {
    title:
      "First-Time Homebuyer Tips: What to Look for in Kitchen & Bathroom Quality",
    slug: "first-time-homebuyer-tips",
    desc: "First-time buyers often focus on bedrooms, square footage, and location—but the kitchen and bathrooms actually reveal more about the true quality of a home.",
    content: `
    <p>
  First-time buyers often focus on bedrooms, square footage, and location—but the
  kitchen and bathrooms actually reveal more about a home’s overall condition.
</p>

<p>Here’s what to look for:</p>

<ul>
  <li>Water pressure &amp; plumbing quality</li>
  <li>Condition of faucets, sinks, and drainage</li>
  <li>Quality of tiles, grouts, and fixtures</li>
  <li>Ventilation and humidity control</li>
  <li>Upgraded or outdated hardware</li>
</ul>

<p>
  OneRise Group helps buyers inspect and assess these details so they can make
  confident decisions and estimate future upgrade costs accurately.
</p>
    `,
  },
  {
    title: "2025 Real Estate Market Outlook: What Homeowners Should Expect",
    slug: "2025-real-estate-outlook",
    desc: "The housing market continues to evolve, and homeowners need to stay informed. In 2025, rising demand for energy-efficient homes and quality finishes is shaping buyer preferences.",
    content: `
    <p>
  The housing market continues to evolve, and homeowners need to stay informed. In
  2025, rising demand for energy-efficient homes, improved construction quality, and
  modern interiors will shape buyer preferences.
</p>

<p>
  Upgraded kitchens and bathrooms remain top priorities. Real estate clients who
  combine modern aesthetics with functional upgrades will see faster sales and stronger
  returns. OneRise Group provides both the market insights and the upgrade options
  needed to stay competitive.
</p>
    `,
  },
  {
    title: "How to Create a Luxury Bathroom on a Budget",
    slug: "create-luxury-bathroom-budget",
    desc: "A luxury bathroom doesn’t always require a full remodeling project. Strategic upgrades with the right fittings can completely transform the space.",
    content: `
    <p>
  A luxury bathroom doesn’t always require a full remodeling project. Strategic upgrades
  with the right fittings can completely transform the space.
</p>

<p>Here are budget-friendly ways to create a four-star spa feel:</p>

<ul>
  <li>Install a rainfall or multi-function shower system</li>
  <li>Choose stylish faucets in matte black or brushed gold</li>
  <li>Upgrade to a modern LED mirror</li>
  <li>Add sleek towel bars and storage organizers</li>
  <li>Replace outdated cabinet handles</li>
</ul>

<p>
  OneRise Group offers high-end products at competitive prices, making luxury
  accessible for every homeowner.
</p>

    `,
  },
  {
    title: "Why Quality Fixtures Matter More Than You Think",
    slug: "why-quality-fixtures-matter",
    desc: "Fixtures may seem like small elements, but they influence daily use, water efficiency, and long-term durability. Cheap or low-quality fittings often cost more over time.",
    content: `
    <p>
  Fixtures may seem like small elements, but they influence daily use, water efficiency,
  and long-term durability. Cheap or low-quality fittings often lead to leaks, rust, or high
  maintenance costs.
</p>

<p>
  Premium fittings from OneRise Group are designed to last. Made from corrosion-resistant
  materials with smooth operation, they provide better performance and enhance the value
  of your home. Investing once saves money for years.
</p>
    `,
  },
  {
    title: "The Hidden Value of Pre-Listing Home Improvements",
    slug: "hidden-value-home-improvements",
    desc: "Before listing your home, making targeted improvements can result in thousands of dollars in added value. Kitchens and bathrooms are often the best places to start.",
    content: `
    <p>
  Before listing your home, making targeted improvements can result in thousands of
  dollars in added value. Kitchens and bathrooms are the two most inspected areas—and
  the ones that influence buyer decisions the most.
</p>

<p>
  Consumers today prefer move-in-ready homes. OneRise Group helps sellers choose
  the right fittings and upgrades that make a property stand out in photos, showings,
  and online listings—leading to quicker offers and higher selling prices.
</p>
    `,
  },
  {
    title:
      "Maintenance Tips to Keep Your Kitchen & Bathroom Fixtures Looking New",
    slug: "maintenance-tips-kitchen-bathroom",
    desc: "Proper care extends the lifespan of your fittings and keeps them looking their best, protecting your investment and preserving your home’s appeal.",
    content: `
    <p>
  Proper care extends the lifespan of your fittings and keeps them looking their best.
</p>

<p>Top maintenance tips:</p>

<ul>
  <li>Clean with mild soap and soft cloths</li>
  <li>Avoid harsh chemicals or abrasive cleaners</li>
  <li>Use silicone-based lubricants for moving parts</li>
  <li>Wipe down water spots regularly</li>
  <li>Check for minor leaks or drips early</li>
</ul>

<p>
  OneRise Group’s fittings are built for low-maintenance use, but these steps ensure
  they stay in excellent condition for years.
</p>
    `,
  },
  {
    title: "The Rise of Matte Finishes in Modern Homes",
    slug: "matte-finishes-modern-homes",
    desc: "Matte black, brushed nickel, and satin finishes are quickly replacing shiny chrome as the top choices for homeowners. Their soft, elegant appearance creates a refined look.",
    content: `
    <p>
  Matte black, brushed nickel, and satin finishes are quickly replacing shiny chrome as
  the top choices for homeowners. Their soft, elegant appearance creates a
  sophisticated design that blends with modern, farmhouse, or contemporary styles.
</p>

<p>
  OneRise Group stays ahead of these trends by offering a variety of matte-finish fittings
  that are durable, stylish, and fingerprint-resistant—perfect for a clean, timeless look.
</p>
    `,
  },
  {
    title: "Why OneRise Group Is the Ideal Partner for Home Renovators",
    slug: "one-rise-group-home-renovators",
    desc: "Home renovation projects require a balance of design, budget, and product reliability. OneRise Group makes renovations easier by offering curated products and expert support.",
    content: `
    <p>
  Home renovation projects require a balance of design, budget, and product reliability.
  OneRise Group makes renovations easier by offering:
</p>

<ul>
  <li>High-quality fittings</li>
  <li>Bulk and retail purchasing options</li>
  <li>Design guidance</li>
  <li>Real estate value insights</li>
  <li>Local expertise</li>
  <li>Reliable delivery and customer service</li>
</ul>

<p>
  Whether customers are renovating a single bathroom or flipping an entire property, our
  team ensures they have the right materials and support to achieve exceptional results.
</p>
    `,
  },
];

async function run() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGO_URI / MONGODB_URI not set in .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    for (const post of BLOG_POSTS) {
      const metaTitle = post.metaTitle || post.title;
      const metaDesc = post.metaDesc || post.desc;

      const existing = await Blog.findOne({ slug: post.slug }).exec();
      if (existing) {
        console.log(`Skipping existing blog: ${post.slug}`);
        continue;
      }

      await Blog.create({
        title: post.title,
        slug: post.slug,
        desc: post.desc,
        content: post.content,
        metaTitle,
        metaDesc,
        author: "OneRise Group", // or whatever default you use
      });

      console.log(`Inserted blog: ${post.slug}`);
    }

    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding blogs:", err);
    process.exit(1);
  }
}

run();
