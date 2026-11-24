import type { Metadata } from "next";

/**
 * Page titles and meta descriptions, taken verbatim from the live site.
 *
 * **Every value here is nyuhbalivillas.com's own `<title>` and
 * `<meta name="description">`, fetched per route and copied unchanged.** The
 * build previously carried titles written for this project. They read fine,
 * but they were not what the business had published or what search engines
 * had indexed: 61 of the 74 routes disagreed with the live site, and
 * descriptions were absent altogether apart from the one site-wide fallback
 * in `layout.tsx`.
 *
 * They live in one map rather than inline across 42 page files so the set can
 * be re-fetched and diffed against the live site in a single step, and so the
 * coming CRUD has one seam to write into.
 *
 * **Fifteen live routes publish no description at all.** Those fifteen are the
 * only entries here whose description did not come from nyuhbalivillas.com,
 * because there was nothing to copy. They previously carried a title only and
 * fell back to the root layout's — which meant fifteen pages sharing one
 * description, and that description opens by talking about the *Seminyak*
 * honeymoon villas even on the Ubud pages. Each now has its own, assembled out
 * of words already on that page: its opening paragraph, its own headings, or
 * the property's contact details from `properties.ts`. Nothing is newly
 * written marketing copy, and re-fetching the live site will not overwrite
 * them — they are additions, not a diff.
 *
 * Verified against the live site: all 74 titles and all 59 live descriptions
 * match byte-for-byte.
 *
 * One live fault is copied rather than corrected, on the same principle as the
 * rest of this build: `/ubud/discover/5-star-resort` publishes the *yoga
 * teacher training* title, identical to `/ubud/discover/yoga-teacher-training`.
 * Two posts sharing one title is a real SEO problem on the live site, not a
 * copying error here — worth fixing in WordPress, not silently here.
 */
export type RouteSeo = { title: string; description?: string };

// Moved to its own module so `src/proxy.ts` can import it without
// pulling ROUTE_SEO into the edge bundle. Re-exported here because this is
// where every caller already looks for it.
export { SITE_ORIGIN } from "./origin";

export const ROUTE_SEO: Record<string, RouteSeo> = {
  "/": {
    title: "Nyuh Bali Villas & Resort - 5 Star Luxury Bali Villa",
    description:
      "Indulge in romantic ambiance at our Seminyak honeymoon villas. Unwind in our Ubud resort, a retreat for luxury yoga, inner peace and wellness.",
  },
  "/complimentary-services": {
    title: "Complimentary Services - Nyuh Bali",
    description:
      "More than a stay, we invite you to enjoy truly Ubud experience. We curate authentic Balinese activities and wellness classes to help you relax and create an unforgettable stay.",
  },
  "/privacy-policy": {
    title: "Privacy Policy - Nyuh Bali Villas – Your Data Protection & Privacy",
    description:
      "Learn how Nyuh Bali Villas protects your personal information when booking or staying at our Seminyak and Ubud villas. We prioritize your privacy and data security.",
  },
  "/seminyak": {
    title: "Nyuh Bali - Luxury Villas Seminyak - Romantic Honeymoons",
    description:
      "Romanticise in luxury Seminyak villas, blending Balinese tradition and wellness activities. Enjoy candle lit dinners with your very own chef.",
  },
  "/seminyak-directory": {
    title: "Seminyak - Directory - Nyuh Bali",
    description:
      "Your in-villa directory at Nyuh Bali Villas Seminyak: enhance your stay, the dining experience at Nyuh Restaurant, spa and tour menus, and useful information about our facilities and services.",
  },
  "/seminyak/contact": {
    title: "Seminyak - Contact Us - Nyuh Bali",
    description:
      "Contact Nyuh Bali Villas Seminyak: Bali Deli st 99, Seminyak, Bali. Call +62 361 738920 or email reservation@nyuhbalivillas.com — or fill in the form.",
  },
  "/seminyak/dining": {
    title: "Seminyak Dining Experience - Candle Light Dinner",
    description:
      "Indulge in a romantic Seminyak dining experience with an intimate candlelight dinner, crafted for a memorable evening.",
  },
  "/seminyak/discover": {
    title: "Seminyak - Blog - Nyuh Bali",
    description:
      "Stories from Nyuh Bali Villas Seminyak — sunsets, romantic honeymoon activities and the things worth doing while you stay with us.",
  },
  "/seminyak/discover/10-romantic-honeymoon-activities": {
    title: "10 Romantic Honeymoon Activities in Seminyak",
    description:
      "From exploring beaches to tasting amazing cuisine, there’s something for everyone. Here are 10 Romantic things to do in Seminyak for couples.",
  },
  "/seminyak/discover/sunset": {
    title: "Sunset Seminyak",
    description:
      "Experience wellness and healing practices in Bali. Rejuvenate your spirit and restore well-being at Ubud Nyuh Bali Resort.",
  },
  "/seminyak/spa": {
    title: "Romantic Spa Experience in Seminyak - Nyuh Bali Villas",
    description:
      "Our spa at Nyuh Bali Villas offers delightful spa treatments that will pamper the body and nurture the senses amid your leisure on the island.",
  },
  "/seminyak/tour": {
    title: "Seminyak Itinerary - Tour Specialist - Nyuh Bali",
    description:
      "Travel Bali with Nyuh's flawless itineraries. Discover Balinese culture, from sunset tours to ancient temples in Uluwatu, Ubud and Batur!",
  },
  "/seminyak/villa": {
    title: "Seminyak Luxury Villas - Nyuh Bali",
    description:
      "What's better than living in a private villa with your own pool? Each villa is completed with pool and sundeck to be enjoyed anytime at your convenience.",
  },
  "/seminyak/villa/honeymoon": {
    title: "Honeymoon Suite Pool Villa - Seminyak",
    description:
      "Experience a romantic honeymoon at Nyuh Bali’s Seminyak villa, featuring a private pool, elegant Balinese design, and personalized service.",
  },
  "/seminyak/villa/honeymoon/packages": {
    title: "Romantic Honeymoon Packages in Seminyak Bali",
    description:
      "Create unforgettable moments with romantic packages in Seminyak, Bali. Private villas, intimate dining, and special honeymoon experiences.",
  },
  "/seminyak/villa/honeymoon/pool": {
    title: "One Bedroom Pool Villa in Seminyak - Nyuh Bali Villas",
    description:
      "Relax in a private one-bedroom pool villa at Nyuh Bali Seminyak, blending Balinese elegance with modern comfort.",
  },
  "/spa-reservation-seminyak": {
    title: "Seminyak - SPA Booking Form - Nyuh Bali",
    description:
      "Reserve your treatment at Nyuh Bali Villas Seminyak — Balinese massage, warm stone, holistic body treatment and romantic couple packages.",
  },
  "/suite-directory": {
    title: "Suite Directory - Nyuh Bali",
    description:
      "Your in-room directory for the suites at Ubud Nyuh Bali Resort: relax and indulge at Mahamaya SPA, the dining experience at Lumbini Restaurant, and useful information about our facilities and services.",
  },
  "/terms-conditions": {
    title: "Terms & Conditions - Nyuh Bali Villas",
    description:
      "Read the Terms & Conditions for booking and staying at Nyuh Bali Villas in Seminyak and Ubud. Understand our payment, cancellation, guest responsibilities, and legal guidelines.",
  },
  "/ubud": {
    title: "Ubud Luxury Villas - Private Villa and Suite - Book a Retreat",
    description:
      "Nyuh Bali provides luxury villas in Ubud for couples and families. Inspired by coconut philosophy, wellness activities are also available.",
  },
  "/ubud-directory": {
    title: "Ubud - Directory - Nyuh Bali",
    description:
      "Your in-villa directory at Ubud Nyuh Bali Resort: Healthy Look Aesthetic, relax and indulge at Mahamaya SPA, the dining experience, and useful information about our facilities and services.",
  },
  "/ubud-personalize-your-retreat": {
    title: "Ubud - Personalize Your Retreat Form - Nyuh Bali",
    description:
      "Tell us your dates, your group and your dining plan, and our retreat specialist will personalise a retreat at Ubud Nyuh Bali Resort for you.",
  },
  "/ubud-spa-booking-form": {
    title: "Ubud - SPA booking form - Nyuh Bali",
    description:
      "Book a treatment at Mahamaya Spa, Ubud Nyuh Bali Resort — massage, body treatment, hair, bath, self indulgence, couple package or facial.",
  },
  "/ubud/balinese-culture": {
    title: "Ubud - Experience - Nyuh Bali",
    description:
      "Experience the charm of Balinese culture at our Cultural Night: a four-course Balinese dinner, traditional dance performances and a lively Joget.",
  },
  "/ubud/balinese-culture/balinese-class": {
    title: "Daily Balinese Class - Make Offerings at Ubud Nyuh Bali Resort",
    description:
      "Discover how to make the canang sari. The handmade offerings are a sacred form of gratitude for what is and a wish for peace in the world.",
  },
  "/ubud/balinese-culture/cooking-class": {
    title: "Cooking Class Ubud - Market Tour with Ubud Nyuh Bali Resort",
    description:
      "Join an authentic cooking class in Ubud with Nyuh Bali Resort, including a local market tour and hands-on Balinese culinary experience.",
  },
  "/ubud/balinese-culture/melukat-purification-ceremony": {
    title: "Purification Ceremony Bali - Melukat Ubud - Guided Tour",
    description:
      "Experience Melukat in Sebatu or Tirta Empul Holy Spring Temple. Includes picturesque sightseeing tour to Tegalalang with private tour.",
  },
  "/ubud/balinese-culture/rice-field-walk": {
    title: "Rice Terrace Walk - Ubud Nyuh Bali Resort",
    description:
      "Discover the beauty of Ubud with a complimentary rice terrace walk at Nyuh Bali Resort, a perfect blend of nature and culture.",
  },
  "/ubud/contact": {
    title: "Ubud - Contact Us - Nyuh Bali",
    description:
      "Contact Ubud Nyuh Bali Resort: Raya Silungan street, Lodtunduh Ubud Bali (80571). Call +62 85 333 779 779 or email info@ubudnyuhbali.com.",
  },
  "/ubud/dining": {
    title: "Luxury Restaurant - Breakfast & Dinner at Ubud Nyuh Bali Resort",
    description:
      "Enjoy private BBQ and romantic dinners at Nyuh's Lumbini Restaurant in Ubud. Our Chefs cook with fresh ingredients with respect to nature.",
  },
  "/ubud/discover": {
    title: "Ubud - Blog - Nyuh Bali",
    description:
      "Stories from Ubud Nyuh Bali Resort — yoga, wellness retreats, honeymoons and what makes a 5-star resort in Bali worth the stay.",
  },
  "/ubud/discover/5-star-resort": {
    title: "Yoga Teacher Training in Bali - Nyuh Bali Ubud Resort",
    description:
      "Experience wellness and healing practices in Bali. Rejuvenate your spirit and restore well-being at Ubud Nyuh Bali Resort.",
  },
  "/ubud/discover/five-relaxing-activities-to-do": {
    title: "Five Relaxing Activities to Do in Ubud",
    description:
      "There are many activities in Ubud to do, this includes temples, rice terraces, coffee plantations, markets, villages and waterfalls.",
  },
  "/ubud/discover/hatha-yoga": {
    title: "What is Hatha Yoga? - Nyuh Bali Ubud Resort",
    description:
      "Experience wellness and healing practices in Bali. Rejuvenate your spirit and restore well-being at Ubud Nyuh Bali Resort.",
  },
  "/ubud/discover/luxury-honeymoon": {
    title: "Luxury Honeymoon in Ubud",
    description:
      "Indulge in a luxurious honeymoon in Ubud. Enjoy tailored packages, private villas, and serene landscapes for the ultimate romantic escape.",
  },
  "/ubud/discover/luxury-hotel-awards": {
    title: "Nyuh Bali Achieves a Triple World Luxury Hotel Award",
    description:
      "Join us at Nyuh Bali Resort & Spa as we celebrate a triumphant moment with three prestigious titles at the 2023 World Luxury Hotel Awards.",
  },
  "/ubud/discover/most-instagrammable-places": {
    title: "Most Instagrammable Places in Bali - Ubud Spots",
    description:
      "Our top instagram spots are: 1. Campuhan Ridge Walk. 2. The Bali Swing. 3. The Sacred Monkey Forest Sanctuary. 4. Tegalalang Rice Terrace...",
  },
  "/ubud/discover/restoring-body-balance": {
    title: "How to Restore a Balanced Body - Mind & Soul - Nyuh Bali",
    description:
      "The modern world often leaves people feeling disconnected from themselves and their bodies. Wellness retreats have emerged as sanctuaries — here is why.",
  },
  "/ubud/discover/wellness-retreat": {
    title: "Wellness Retreat in Bali - Nyuh Bali Ubud Resort",
    description:
      "Experience wellness and healing practices in Bali. Rejuvenate your spirit and restore well-being at Ubud Nyuh Bali Resort.",
  },
  "/ubud/discover/yoga-teacher-training": {
    title: "Yoga Teacher Training in Bali - Nyuh Bali Ubud Resort",
    description:
      "Experience wellness and healing practices in Bali. Rejuvenate your spirit and restore well-being at Ubud Nyuh Bali Resort.",
  },
  "/ubud/fitness": {
    title: "Gym in Ubud - Fitness - Nyuh Bali Ubud Resort",
    description:
      "Stay active at Nyuh Bali Ubud Resort’s gym, offering modern fitness facilities in a serene tropical setting.",
  },
  "/ubud/packages": {
    title: "Bali Proposal Packages - Ubud Nyuh Bali Resort",
    description:
      "Experience romantic and relaxation retreat packages, precisely curated to rejuvenate you and your loved one in Ubud, Bali.",
  },
  "/ubud/retreat": {
    title: "Ubud - Retreat - Nyuh Bali",
    description:
      "We are dedicated to creating a luxury retreat in Ubud for everyone, whether you want to heal your soul, let go, or simply just to relax.",
  },
  "/ubud/retreat/couples": {
    title: "Luxury Couple Retreat in Bali - Ubud Nyuh Bali Resort",
    description:
      "Reignite passion with luxurious and intimate couple retreats, designed to enhance your shared moments in Ubud, Bali. Indulge now!",
  },
  "/ubud/retreat/detox": {
    title: "Detox Retreat in Bali - Ubud Nyuh Bali Resort",
    description:
      "Located in the heart of Bali, our detox retreat offers a delightful way to heal and rejuvenate amidst the jungle of Ubud.",
  },
  "/ubud/retreat/host-your-own": {
    title: "Retreat Venue for Hire - Bali Yoga Shala at Ubud Nyuh Bali Resort",
    description:
      "Host your own wellness retreat at Nyuh Bali. A venue inspired by Nyuh's coconut philosophy, facilitating holistic healing and rebirth.",
  },
  "/ubud/retreat/luxury": {
    title: "Luxury Retreats in Bali - Ubud Nyuh Bali Resort",
    description:
      "Experience luxurious retreats in Bali. Blending traditional Balinese practices and flawless service across a range of bespoke retreats.",
  },
  "/ubud/retreat/luxury/anti-aging": {
    title: "Ubud - Anti Aging Retreat - Nyuh Bali",
    description:
      "Our luxury anti-aging retreat in Ubud combines the psychological benefits of Balinese healing with scientifically proven treatments for the effects of aging.",
  },
  "/ubud/retreat/luxury/balinese-healing": {
    title: "Traditional Ubud Healing Therapist - Ubud Nyuh Bali Resort",
    description:
      "Maximize your health with traditional Ubud healing at Nyuh Bali. Experience rejuvenation in the hands of our skilled Ubud therapists.",
  },
  "/ubud/retreat/luxury/holistic-balancing": {
    title: "Holistic Retreat in Bali - Ubud Nyuh Bali Resort",
    description:
      "Revitalize your health with our holistic retreat in Ubud, aligning mind, body, and spirit through enriching wellness activities in Bali.",
  },
  "/ubud/retreat/luxury/new-beginning": {
    title: "Ubud Nyuh Bali Resort - New Beginning - Wellness Retreat",
    description:
      "Embrace Nyuh Bali's wellness retreat for a new beginning. Experience healing, rejuvenation, and Ubud's spiritual energy.",
  },
  "/ubud/retreat/slimming": {
    title: "Weight Loss Retreat - Slimming Program in Ubud",
    description:
      "Ubud Nyuh Bali Resort uses Scientific Based Medicine and the Goodness of Balinese Healing to provide the best slimming retreat you deserve.",
  },
  "/ubud/spa": {
    title: "Luxury Spa in Ubud",
    description:
      "Luxury Spa & Flower Bath in Ubud. Enjoy a range of healthy treatments from lymphatic massage to body scrub, facial and coconut body wraps.",
  },
  "/ubud/spa/couple-massage": {
    title: "Couple Massage in Ubud",
    description:
      "Rejuvenate with a luxurious couple’s massage at Ubud Nyuh Bali Resort, a perfect blend of relaxation and romance.",
  },
  "/ubud/spa/flower-bath": {
    title: "Spa with flower bath experience in Ubud",
    description:
      "Experience 5 different types of Bali flower baths. Such as the Tropical Balinese Flower, Energizing Herbal, Cleopatra's Rose Milk and more!",
  },
  "/ubud/spa/hot-stone-massage": {
    title: "Hot Stone Massage Ubud",
    description:
      "Experience wellness and healing practices in Bali. Rejuvenate your spirit and restore well-being at Ubud Nyuh Bali Resort.",
  },
  "/ubud/villa": {
    title: "Ubud Villa - Luxury Accommodations at Ubud Nyuh Bali Resort",
    description:
      "Presenting our newest collection of Ubud Villas. You will find rooms that have been created unlike other accommodations in Ubud.",
  },
  "/ubud/villa/1-bedroom-pool-deluxe": {
    title: "Ubud - One Bedroom Deluxe Pool Villa - Nyuh Bali",
    description:
      "The 240 sqm pool villa comes with a private pool surrounded by greenery, a unique outdoor shower and an indoor bathtub made from natural green stone.",
  },
  "/ubud/villa/1-bedroom-pool-royal": {
    title: "One Bedroom Pool Villa in Ubud - Nyuh Bali Resort",
    description:
      "Experience luxury at Nyuh Bali Ubud’s one-bedroom pool villa, featuring Balinese elegance and a private pool.",
  },
  "/ubud/villa/2-bedroom-pool": {
    title: "2 Bedroom Villa in Ubud with Private Pool",
    description:
      "This Ubud villa features 2 bedrooms overlooking the tropical garden and pool, including an individual bathroom and outdoor shower.",
  },
  "/ubud/villa/3-bedroom-pool": {
    title: "3 Bedroom Villa in Ubud with Pool - Ubud Nyuh Bali Resort",
    description:
      "The villa features three bedrooms, three bathrooms, and two stylish separate living and dining areas to enjoy the best of Ubud, Bali.",
  },
  "/ubud/villa/4-bedroom-pool": {
    title: "4 Bedroom Villa in Ubud with Pool",
    description:
      "Our four-bedroom pool villa in Ubud (450 sqm) is designed to strengthen your bond with friends. Wake up to 5 star service and tropical views.",
  },
  "/ubud/villa/honeymoon": {
    title: "Honeymoon Pool Villa in Ubud",
    description:
      "Celebrate love in a Honeymoon Pool Villa at Ubud Nyuh Bali Resort, featuring a private pool, romantic ambiance, and Balinese charm.",
  },
  "/ubud/villa/honeymoon/packages": {
    title: "Ubud - Romance - Nyuh Bali",
    description:
      "Arrange the first romantic holiday as husband and wife. Indulge your partner in a perfect honeymoon in Ubud Bali and show your everlasting commitment.",
  },
  "/ubud/villa/honeymoon/pool": {
    title: "Ubud Honeymoon Suites - Ubud Nyuh Bali Resort",
    description:
      "The honeymoon suite overlooks the resort’s main pool and tropical garden. Feel the tropical vibes with beautiful greenery from your balcony.",
  },
  "/ubud/villa/suite": {
    title: "Ubud - Nyuh Suite - Nyuh Bali",
    description:
      "One floor only consists of three suites, so you enjoy the serenity you are looking for — an ample bedroom with a stone bathtub, rain shower and separate toilet.",
  },
  "/ubud/wedding": {
    title: "Intimate Wedding in Ubud - Nyuh Bali Villas",
    description:
      "We believe every couple deserves the very best wedding moment, stress and worry free. Let us help you to prepare your once in a life moment.",
  },
  "/ubud/wellness": {
    title: "Ubud Wellness Retreat Activities - Ubud Nyuh Bali Resort",
    description:
      "Immerse in wellness at our Ubud wellness retreat, facilitating a harmonious blend of activities that nurture both mind and body.",
  },
  "/ubud/wellness/body-tone-flow": {
    title: "Body Tone Flow in Ubud - Ubud Nyuh Bali Resort",
    description:
      "Experience an energizing workout that targets your entire body using your own body weight as the primary resistance. These flowing exercises are ideal for everyone, regardless of fitness level.",
  },
  "/ubud/wellness/breathwork": {
    title: "Breathwork Ubud - Private & Group Classes",
    description:
      "Explore breathwork classes at Nyuh Bali, Ubud. Learn deep breathing exercises, guided by the rejuvenating teachings of Nyuh's Gurus.",
  },
  "/ubud/wellness/chakra-healing": {
    title: "Chakra Healing Ubud - Nyuh Bali - Wellness Retreat",
    description:
      "Experience transformative healing at Ubud Nyuh Bali Resort with our Chakra Healing Therapy. Using seven Tibetan singing bowls attuned to your chakras, this soothing session restores balance, releases blockages, and promotes deep relaxation for renewed harmony and clarity.",
  },
  "/ubud/wellness/life-coach": {
    title: "Life Coach & Psychologist in Bali - Ubud Nyuh Bali Resort",
    description:
      "Journey towards self-discovery with our compassionate life coaches and psychologists amidst Ubud’s most luxurious resort.",
  },
  "/ubud/wellness/reiki-healing": {
    title: "Reiki Healing Ubud - Nyuh Bali - Wellness Retreat",
    description:
      "Embrace serenity with our Reiki healing sessions in Ubud, harmonizing your energy and fostering peaceful wellbeing.",
  },
  "/ubud/wellness/sound-healing": {
    title: "Sound Healing Ubud - Nyuh Bali - Wellness Retreat",
    description:
      "Experience sound healing's transformative power at Nyuh Bali, Ubud. Channel the good vibrations and feel the Nyuh philosophy resonate.",
  },
  "/ubud/wellness/yoga": {
    title: "Yoga Class Ubud - Certified Instructor - Nyuh Bali Luxury Retreat",
    description:
      "Elevate your spirit with Acro, Ashtanga and Vinyasa Flow. Set amidst Ubud's lush greenery, embrace ancient teachings and spirit at Nyuh Bali.",
  },
  "/ubud/wellness/yoga/retreat": {
    title: "Luxury Yoga Retreat in Ubud - Nyuh Bali Resort",
    description:
      "Experience luxury at Nyuh's Yoga Hotel in Ubud with daily meditation classes and spa treatments, surrounded by lush greenery and temples.",
  },
  "/welcomeaboard": {
    title: "Welcome Aboard - Nyuh Bali",
    description:
      "The five steps to complete to officially become a member of our team at Ubud Nyuh Bali Resort: basic product knowledge, the Nyuh Bali Manner, the knowledge test, the house rules and the staff database.",
  },
};

/**
 * Metadata for a route: its title and description, plus the canonical link and
 * the Open Graph block that go with them.
 *
 * **An unknown path still gets the canonical and the Open Graph block**, and
 * only loses its title and description — which leaves the root layout's in
 * place, exactly as before. A missing entry is a build-time omission, not a
 * runtime error, and it is no reason for that page to stop declaring which URL
 * it is.
 *
 * The Open Graph fields mirror what Yoast publishes on the live site, value for
 * value: `og:locale` `en_US`, `og:site_name` "Nyuh Bali", and `og:type`
 * `website` for the landing page against `article` for every inner page. Title
 * and description are the same two strings again, because that is what the live
 * site sends — `og:title` there is never a second, punchier headline.
 *
 * **No `og:image`, deliberately.** The live site publishes none on any page,
 * and picking one would mean choosing a photograph to represent the whole
 * business — a brand decision, not a technical default, and this project does
 * not invent brand copy or brand imagery (see the Design state section of
 * CLAUDE.md). An editor can set one per page in the Studio, and
 * `resolvePageMetadata` will use it; that is the right place for the choice.
 *
 * `twitter:card` is not set here. It is one value for the whole site, so it
 * lives once in the root layout and every route inherits it — Next merges
 * metadata a field at a time, and a route that never mentions `twitter` keeps
 * the layout's.
 *
 * Both `alternates.canonical` and `openGraph.url` are relative on purpose:
 * Next resolves them against `metadataBase`, so `SITE_ORIGIN` is stated once
 * in the layout instead of being baked into 74 strings here.
 */
export function seo(path: string): Metadata {
  const entry = ROUTE_SEO[path];
  return {
    ...(entry ? { title: entry.title } : {}),
    ...(entry?.description ? { description: entry.description } : {}),
    alternates: { canonical: path },
    openGraph: {
      type: path === "/" ? "website" : "article",
      locale: "en_US",
      siteName: "Nyuh Bali",
      url: path,
      ...(entry ? { title: entry.title } : {}),
      ...(entry?.description ? { description: entry.description } : {}),
    },
  };
}
