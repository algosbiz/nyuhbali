// Content for src/app/ubud/spa/page.tsx.
//
// It lives here rather than in the route for one reason: the Sanity migration
// seeds this page's `page` document from these exact constants, and a module
// that imports React or `server-only` cannot be read by a plain Node script.
// One copy, so the CMS cannot drift from the page it was seeded from.

import type { TreatmentCategory } from "@/components/property/TreatmentList";
import type { Testimonial } from "@/data/testimonials";

export const UPLOADS = "/uploads";

// Mahamaya Spa takes bookings through Fresha, not the resort's own booking
// engine, so every "Book Now" and the closing "Reserve Now" point here.
// Category thumbnails follow the live SPA tabs. Both package sections share
// the live SPA PACKAGE photograph.
export const RESERVE_HREF =
  "https://www.fresha.com/a/mahamaya-spa-at-ubud-nyuh-bali-resort-bali-lodtunduh-gianyar-regency-jalan-raya-silungan-kgeujm85/booking?menu=true";

export const HERO_IMAGES = [
  `${UPLOADS}/2023/03/ezgif.com-gif-maker-19.webp`,
  `${UPLOADS}/2023/03/ezgif.com-gif-maker-21.webp`,
  `${UPLOADS}/2023/04/New-Beginning-1-min-1-1.jpg`,
];

export const SPA_INTRO =
  "Nestled in the south of Ubud, Mahamaya Spa stands as a sanctuary of serenity and indulgence, offering a luxurious escape for those seeking a rejuvenating experience. Renowned for its commitment to excellence, Mahamaya Spa prides itself on utilizing the finest natural products, ensuring a holistic and nourishing approach to wellness. Guests are welcomed into a world of opulence, where the signature flower bath experience beckons, immersing them in a fragrant oasis of petals and tranquility. The spa's distinction lies not only in its exquisite setting but also in its team of highly trained and friendly therapists, well-versed in medical anatomy. This unique combination of premium natural products, enchanting rituals, and knowledgeable therapists creates an unparalleled haven for relaxation and revitalization at Mahamaya Spa in Ubud Bali.";

/** Every option links to the same Fresha booking page. */
export const at = (label: string) => ({ label, href: RESERVE_HREF });

export const TREATMENTS: TreatmentCategory[] = [
  {
    name: "MASSAGE",
    image: `${UPLOADS}/2024/11/011A0972-Edit-min-1.jpg`,
    treatments: [
      {
        name: "Bamboo Harmony Massage",
        options: [at("90 mins | IDR 850.000++")],
        description:
          "In the Eastern world, bamboo is a symbol of longevity because of its strength, flexibility, & resilience. Bamboo massage is known for its restorative properties to stimulate the flow of blood and lymph and relieve muscle tension. A combination of deep tissue therapy, manual drainage massage, and long flowing massage strokes and rolling with bamboo sticks combines in our signature massage to soothe the senses and promote the well-being.",
      },
      {
        name: "Lymphatic Drainage Massage",
        options: [
          at("Arm & Upper Back| IDR 490.000++"),
          at("Full Leg 45 mins| IDR 650.000++"),
          at("Belly 45 mins| IDR 650.000++"),
          at("Full Body 120 mins| IDR 1.590.000++"),
        ],
        description:
          "This massage technique is designed to encourage the movement of lymph fluid. By stimulating circulation through a rhythmic motion in the direction of the lymphatic flow, it will enhance the elimination of toxins, alleviate water retention, and relieve bloating.",
      },
      {
        name: "Mahamaya Herbal Massage",
        options: [at("90 mins | IDR 850.000++")],
        description:
          "Inspired by the herbal that has long been used by Balinese People, the warm herbal compress invites your muscle to relax. The warm mixture of the herbs in the relaxing massage flow helps to reduce aches and gives an ultimate boost to your well-being.",
      },
      {
        name: "River Stone Massage",
        options: [at("90 mins | IDR 750.000++")],
        description:
          "Utilizing the warm stone to melt deep muscle tension, River stone massage will release the burdens of everyday living and nurture your body and mind. The therapist carefully places the warm stone on different chakra points in a rhythmic relaxing massage.",
      },
      {
        name: "Deep Tissue Massage",
        options: [at("60 mins | IDR 550.000++"), at("90 mins | IDR 690.000++")],
        description:
          "Our signature deep tissue massage is designed to target deeper tissues under your skin using warm oil and a warm towel ritual. Performed with a slow and deliberate technique passed down through generations, it helps relieve the stiffness and encourages a sense of deep relaxation.",
      },
      {
        name: "Relaxing Balinese massage",
        options: [at("60 mins | IDR 490.000++"), at("90 mins | IDR 650.000++")],
        description:
          "Feel the tension dissolve with the ancient wisdom of Balinese treatment that is performed using long strokes, palm press, thumb press, and gentle stretching. A rhythmic experience evokes a sense of relaxation and stimulates the blood flow.",
      },
      {
        name: "Focused Massage",
        options: [at("30 mins | IDR 390.000++")],
        description:
          "Express treatment that perfect for anyone who seeks relaxation in a busy schedule. Choices: neck & shoulder or back, or foot massage",
      },
      {
        name: "Foot Reflexology",
        options: [at("60 mins | IDR 450.000++")],
        description:
          "An intensely healing treatment to target specific points on the feet to boost the inner energy through the body’s meridian",
      },
    ],
  },
  {
    name: "BODY TREATMENT",
    image: `${UPLOADS}/2023/03/spa-ubud-body-treatment.jpg`,
    treatments: [
      {
        name: "Advanced Anti-Cellulite Care by Tegoder",
        options: [
          at("Arm / Abs / Hip & Thigh · 45 mins | IDR 590.000++"),
          at("Full Leg · 60 mins | IDR 790.000++"),
          at(
            "Full Body (Arm, Abdomen, Hip, Full Leg) · 120 mins | IDR 1.590.000++",
          ),
        ],
        description:
          "This revolutionary therapy combines the goodness of East medicine to improve circulation with West medicine to tighten the loose skin. The treatment starts with anti cellulite massage using a scientifically proven solution that contains Lipoglaucin, L-carnitine, bitter orange, & enzymatic complex to induce lipolysis and reduce the appearance of the cellulite. It is followed by the application of anti-cellulite wrap and infrared thermal blanket to eliminate water retention, flush out the toxin, and smoothen the skin.",
      },
      {
        name: "Refreshing Citrus Body Scrub",
        options: [at("30 mins | IDR 350.000++")],
        description:
          "Reveal nourished and supple skin with this softening exfoliation using a tropical cocktail of organic salt, lemongrass, and mandarin orange. Exfoliate your skin and let it shine.",
      },
      {
        name: "Exotic Flower Body Scrub",
        options: [at("30 mins | IDR 350.000++")],
        description:
          "Infused with traditional blends of Balinese flowers, the salt’s granule gently removes the dead skin while moisturizing it, leaving you with smooth skin.",
      },
      {
        name: "Traditional Coconut Body Scrub",
        options: [at("30 mins | IDR 350.000++")],
        description:
          "Experience a recipe from our ancestors for smooth, glowing skin. A traditional and natural way to buff away dead skin cells gently while the antioxidant power of coconut leaves skin soothed and toned.",
      },
      {
        name: "Boreh Herbal Ritual",
        options: [at("30 mins | IDR 350.000++")],
        description:
          "Boreh has been used for centuries by Balinese farmers to warm the body and relieve fatigue. A blend of ginger, cinnamon, cloves, and sandalwood is applied to the skin and gently massaged into your body. This is a perfect treatment if you experience jet lag or need a boost. Enjoy a heavenly scalp massage while your body is polished in the body wrap",
      },
      {
        name: "Purifying Coconut Body Mask",
        options: [at("30 mins | IDR 350.000++")],
        description:
          "Widely known as the essential part of Balinese wellness, the coconut mask gives your skin the benefit of antioxidants to destress along moisturize it. Enjoy a heavenly scalp massage while your body is polished in the body wrap.",
      },
      {
        name: "Hydrating Milk Body Polish",
        options: [at("30 mins | IDR 350.000++")],
        description:
          "Milk body polish softens and rejuvenates the skin with mild exfoliating properties to eliminate dead skin cells. Enjoy a heavenly scalp massage while your body is polished in the body wrap.",
      },
    ],
  },
  {
    name: "HAIR THERAPY",
    image: `${UPLOADS}/2023/03/spa-ubud-hair-therapy.jpg`,
    treatments: [
      {
        name: "Amaya Scalp Ritual",
        options: [at("90 mins | IDR 950.000++")],
        description:
          "A soothing and immersive ritual combining a scalp-purifying serum, gentle scalp massage, Gua Sha, facial acupressure, and a relaxing warm-water hair ritual. Designed to refresh and rebalance the scalp while releasing tension from the scalp, neck, and shoulders. Completed with a nourishing hair treatment, leaving the scalp refreshed and the hair soft, smooth, and beautifully conditioned. ",
      },
      {
        name: "Mahamaya Shirodara Treatment",
        options: [at("90 mins | IDR 850.000++")],
        description:
          "The key Ayurvedic treatment is to relieve anxiety and restores calmness from within. This ancient treatment has been practiced for centuries and is believed to help treat insomnia & burnout. Our signature Shirodhara begins with a welcoming short neck & shoulder massage. Once you are relaxed, the therapists will pour warm herbal oil over the 6th Ajna chakra point in the center of your forehead, famously known as the “third eye”. Your hair will then be washed properly and applied with a nourished hair mask to help repair the dull hair.",
      },
      {
        name: "Intensive Hair SPA",
        options: [at("75 mins | IDR 590.000++")],
        description:
          "An intensive fragrant treatment to revitalize the hair utilizing the legendary aloe vera extract, a well-known ingredient that helps prevent hair loss by strengthening the roots. Spoil yourself even more with the scalp massage that is designed to enhance nutrient’s penetration and the mahamaya classic massage that target muscle soreness in the neck and shoulder",
      },
      {
        name: "Authentic Hair Crème Bath",
        options: [at("75 mins | IDR 590.000++")],
        description:
          "The secret of the Indonesian beauty ritual that uses extracts blends of strawberry and yogurt containing Vitamin C and amino acids act to nourish and revive dry, damaged hair and leave hair smelling fresh and divine. A gentle head massage promotes scalp circulation and gloss, while the neck and shoulder massage boost your overall well-being.",
      },
    ],
  },
  {
    name: "BATHING RITUAL",
    image: `${UPLOADS}/2024/11/011A1131-Edit-min-1.jpg`,
    treatments: [
      {
        name: "Tropical Balinese Flower Bath",
        options: [at("30 mins | IDR 550.000++")],
        description:
          "Experience being the Balinese queen with a handcrafted flower bath and let the flowers spoil your body and mind. The bath is also infused with ylang ylang essential oil to enhance your soul journey. No wonder, It has become everybody's favorite to create a memorable moment in Ubud.",
      },
      {
        name: "Balinese Warm Spice Bath",
        options: [at("30 mins | IDR 490.000++")],
        description:
          "This bath combines Tenglang tea, ginger, betel leaf, and Balinese flowers to create an aromatic experience. This traditional soak calms the mind, promotes circulation, and leaves you feeling refreshed. Rooted in Balinese heritage, it offers a relaxing escape that nurtures both body & spirit.",
      },
      {
        name: "Energizing Herbal Bath",
        options: [at("30 mins | IDR 490.000++")],
        description:
          "Leisurely soak away your stress in the purity of nature with the aromatic blend of pandanus leaves, ginger, lime, and betel leaves. This Balinese herbal combination, along with the pure essential oil, encourages relaxation leaving the body refreshed and energized.",
      },
      {
        name: "Cleopatra's Rose Milk bath",
        options: [at("30 mins | IDR 390.000++")],
        description:
          "Inspired by Cleopatra's ritual, boost your skin hydration even more in a milk bath scented with pure essential oil to calm your mind. A dash of fresh rose petals will brighten your mood for the remainder of the day",
      },
    ],
  },
  {
    name: "SPA PACKAGE — SELF INDULGENCE",
    image: `${UPLOADS}/2024/11/011A0857-Edit-min.jpg`,
    treatments: [
      {
        name: "Mahamaya Lymphatic Reset",
        options: [at("210 mins | IDR 2.490.000++")],
        includes: [
          "Foot Ritual",
          "Full Body Lymphatic Drainage Massage",
          "Infrared Thermal Blanket",
          "Body Scrub",
          "Body Mask",
          "Spirit Cleansing Bath",
          "Organic Coconut Drink",
        ],
        description:
          "A revitalizing full-body ritual designed to leave you feeling lighter and renewed. The lymphatic drainage massage encourages lymphatic flow, supports circulation, and helps relieve the feeling of water retention while supporting the body’s natural waste-clearing processes. Completed with an infrared blanket sauna, body scrub,  nourishing body mask, Spirit Cleansing Bath, and refreshing organic coconut water.",
      },
      {
        name: "Holistic Cellulite Therapy by Tegoder",
        options: [at("150 mins | IDR 1.990.000++")],
        includes: [
          "Foot Ritual",
          "Full Body Anti Cellulite",
          "Infrared Thermal Blanket",
          "Balinese Warm Spice Bath",
          "Organic Coconut Drink",
        ],
        description:
          "Indulge in a full-body holistic skin-firming therapy to reveal softer skin & combat the cellulite. A blend of scientifically proven ingredients with anti cellulite massage technique improves metabolic circulation, and diminishes cellulite, leaving the skin’s texture visibly plumper & smoother. The treatment is followed by a toning wrap in an infra-red thermal blanket to eliminate the toxin & excess water. Lastly, celebrate the progress with Balinese Spice Bath while enjoying the coconut drink to hydrate your body.",
      },
      {
        name: "Self-Love Journey",
        options: [at("180 mins | IDR 1.490.000++")],
        includes: [
          "Balinese Massage",
          "Coconut Body Scrub",
          "Milk Body Polish",
          "Scalp Massage",
          "Tropical Balinese Flower bath",
          "Light Spa Cuisine",
        ],
        description:
          "Indulge your self an invigorating ritual to create profound balance and harmony in your body and soul. Beginning with a relaxing Balinese Massage, step into coconut body scrub to exfoliate the dead cell, and finished with milk body polish to promote skin hydration. Lastly, spoil yourself with our tropical Balinese flower bath while enjoying a light and healthy spa cuisine as your body & mind deserve.",
      },
      {
        name: "Signature Nyuh (Coconut) Sensation",
        options: [at("180 mins | IDR 1.390.000++")],
        includes: [
          "Balinese Massage",
          "Coconut Body Scrub",
          "Coconut Body Wrap",
          "Scalp Massage",
          "Island Frangipani Milk Bath",
          "Organic Coconut Drink",
        ],
        description:
          "Connecting you with the vital element of Balinese wellness, this holistic package will begin with a relaxing Balinese massage, followed by a coconut body scrub and coconut body wrap. Last, complete the journey with a skin nourishing session with an island frangipani milk bath made from pure coconut milk to refresh your body. From head to toe, you will feel rejuvenated and revitalized.",
      },
      {
        name: "Ayurvedic Healing Journey",
        options: [at("150 mins | IDR 1.350.000++")],
        includes: [
          "Deep tissue massage",
          "Shirodara",
          "Hair Mask",
          "Antioxidant Elixir",
        ],
        description:
          "This ritual combines Ayurvedic wisdom and Balinese wellness for total rejuvenation. Begin with a Deep Tissue Massage to release muscle tension, followed by Shirodhara, where warm oil flows gently over the forehead to promote calm and balance. Finish with a revitalizing Hair Mask for nourished, refreshed hair. A harmonious journey for the mind, body, and spirit, leaving you deeply relaxed and renewed.",
      },
      {
        name: "Blissful Mahamaya Journey",
        options: [at("150 mins | IDR 1.250.000++")],
        includes: [
          "Herbal Massage",
          "Boreh Spice Wrap",
          "Herbal Bath",
          "Healthy Green Juice (spinach, pineapple, apple, cucumber)",
        ],
        description:
          "Capturing the goodness of nature, this signature experience delivers the benefit of Balinese herbal to calm your body and mind. Beginning with the herbal massage, discover the warmth and healing sensation of Balinese boreh, and followed by the energized herbal bath to promote the inner energy from within.",
      },
      {
        name: "Stress Recovery",
        options: [at("120 mins | IDR 1.090.000++")],
        includes: [
          "River Stone Massage",
          "Coconut Body Wrap",
          "Scalp Massage",
          "Aromatherapy Bubble Bath",
          "Cleanser Elixir (Coconut water, lime, ginger, dragon fruit)",
        ],
        description:
          "Breathe into a classic ritual to relieve body tension and let go things that no longer serve you. This treatment features river stone to relieve the stubborn muscle tension, coconut body mask to boost your skin’s antioxidant , and complete with an aromatherapy bubble bath and cleanser elixir that will help to de-stress.",
      },
      {
        name: "Cleopatra's Indulging Ritual",
        options: [at("120 mins | IDR 1.090.000++")],
        includes: ["Balinese Massage", "Body Scrub", "Cleopatra’s Rose Bath"],
        description:
          "Gift yourself once in a while. Throw back to the ancient time, and feel the royalty of Cleopatra's ritual to unwind yourself from the stress of modern living. This treatment begins with a Balinese massage. After enhancing the relaxation of your muscle, the skin is exfoliated with a choice of body scrub and finished with Cleopatra's rose milk Bath.",
      },
    ],
  },
  {
    name: "SPA PACKAGE — ROMANTIC SPA FOR COUPLE",
    // The couples' treatment pavilion. The Self Indulgence package above keeps
    // the photograph the live site gives both — no picture twice on a page.
    image: `${UPLOADS}/2023/03/2izE9l3g-1.jpeg`,
    treatments: [
      {
        name: "Rama & Shinta Refresher",
        options: [at("150 mins | IDR 2.290.000++")],
        includes: [
          "River Stone Massage",
          "Boreh Herbal Ritual",
          "Energizing Herbal bath",
          "Energizing Juice (carrot, orange, lemon, ginger)",
        ],
        description:
          "This Balinese couple package is curated to help you recover from the mental strains of modern living. Beginning with a river stone massage, step into Balinese boreh herbal ritual to warm up your body. Finish the ritual with enegizing and our signature herbal bath consisting of traditional blends of herbs that will allow you to feel physically and emotionally grounded.",
      },
      {
        name: "Honeymoon Enjoyment",
        options: [at("120 mins | IDR 1.990.000++")],
        includes: [
          "Balinese Massage",
          "Milk Body Polish",
          "Scalp Massage",
          "Tropical Balinese Flower Bath",
          "Tropical Blend Juice (dragon fruit, banana, coconut milk)",
        ],
        description:
          "After a tiring wedding jitter, you both deserve ultimate relaxation. Dedicated to relieving the tension while sharing intimacy with your partner, this honeymoon package includes Balinese massages and milk body polish to give a boost to your skin. To end the treatment, immerse yourself and your love in a tropical Balinese flower bath ritual",
      },
      {
        name: "Romantic Bubble Bliss",
        options: [at("90 mins | IDR 1.090.000++")],
        includes: [
          "Balinese Massage",
          "Aromatherapy Bubble Bath with Rose Petals",
          "Ginger Tea",
        ],
        description:
          "This dreamy spa package is designed exclusively for busy couples wanting to gift themselves with pampering time together. This romantic treatment consists of a Balinese massage for couples and an aromatherapy bubble bath with rose petals to enhance the romantic sensation.",
      },
    ],
  },
  {
    name: "MEDI FACIAL BY HEALTHY LOOK AESTHETIC",
    image: `${UPLOADS}/2024/07/WFM04209-min-min.jpg`,
    treatments: [
      {
        name: "Ageless Radiance Facial",
        options: [at("90 mins | IDR 1.490.000")],
        includes: [
          "Deep Cleansing",
          "Radiofrequency",
          "Steam & Extraction",
          "Face Massage",
          "Soft Peeling",
          "PDT",
          "Stem Cell Mask",
          "Brightening Eye Mask",
          "Shoulder Massage",
          "Eye & Lip Care",
          "Moisturizer & Sunscreen",
        ],
        description:
          "This luxurious facial combines advanced technologies like radiofrequency, PDT, and a stem cell mask to tighten and rejuvenate your skin. The treatment begins with deep cleansing and exfoliation to remove impurities, followed by targeted therapies designed to firm and restore your skin’s natural radiance. Steam and extractions clear your pores, while a relaxing face massage promotes circulation. Enjoy a regenerating stem cell mask, brightening eye mask, and soothing shoulder massage. The session finishes with hydrating eye and lip care, followed by moisturizing and sun protection, leaving your skin feeling revitalized and glowing.",
      },
      {
        name: "Collagen Booster Facial by Dermalogica",
        options: [at("90 mins | IDR 1.290.000")],
        includes: [
          "Deep Cleansing",
          "Microfoliant",
          "Steam & Extraction",
          "Face Massage with Roller",
          "Soft Peeling",
          "IPL Rejuvenation",
          "Premium Gold Mask",
          "Shoulder Massage",
          "Serum Infusion with Electroporation",
          "Eye & Lip Care",
          "Moisturizer & Sunscreen",
        ],
        description:
          "A new start for smoother skin. A combination of micro exfoliant and soft peeling intensively works to remove skin debris and purify the skin surface. Intense pulse light therapy is then applied to your skin to target the deeper layer of the skin to revitalize skin cells and boost collagen renewal. Prepare to be pampered with a rejuvenating gold mask and heavenly shoulder massage. The whole experience will leave your skin with a plumper texture and replenished appearance.",
      },
      {
        name: "Firming & Resurfacing Facial by Dermalogica",
        options: [at("90 mins | IDR 1.190.000")],
        includes: [
          "Deep Cleansing",
          "Radiofrequency",
          "Diamond Microdermabrasion",
          "Steam & Extraction",
          "High Frequency",
          "Face Massage with Guasha",
          "Recovery Mask",
          "Serum Infusion",
          "Eye & Lip Care",
          "Moisturizer & Sunscreen",
        ],
        description:
          "Discover the power of restructuring and tightening experience in this to restore vitality and refresh your overall appearance. After double cleansing, radiofrequency is introduced to generate heat to stimulate the production of collagen and elastin as nonsurgical face-firming therapy. Dimond microdermabrasion and manual extraction will follow the journey to exfoliate dead skin, unclog the congested pores, and reveal smoother skin. The treatment concludes with a massage and mask to regenerate natural collagen for for more youthful look.",
      },
      {
        name: "Red Carpet Hydra Glow",
        options: [at("90 mins | IDR 1.290.000")],
        includes: [
          "Deep Cleansing",
          "Enzyme Peeling",
          "Soft Peeling & Steam",
          "Hydra Peeling",
          "Extraction",
          "Face Massage",
          "Tightening Stimulation",
          "Premium Alga Mask",
          "Eye Mask",
          "Shoulder Massage",
          "Hydrating Infusion",
          "Stem Cell Mask",
          "Hand Massage",
          "Serum Infusion",
          "Eye & Lip Care",
          "Moisturizer & Sunscreen",
        ],
        description:
          "Cleanse, brighten, and tighten. Discover red carpet-worthy radiance and refined pores with this non-invasive facial treatment. Your skin is gently resurfaced using Hydra Glow combining deep cleansing, vacuum extraction, and serum infusion. Experience tightening skin with electroporation, tightening stimulation, and an FDA-approved tightening mask to enhance skin elasticity and firm your overall look.",
      },
      {
        name: "Hydra Glow Facial",
        options: [at("75 mins | IDR 850.000")],
        includes: [
          "Deep Cleansing",
          "Enzyme Peeling",
          "Soft Peeling & Steam",
          "Hydra Peeling",
          "Extraction",
          "Face Massage",
          "Tightening Stimulation",
          "Mask",
          "Shoulder Massage",
          "Hydrating Infusion",
          "Serum Infusion",
          "Eye & Lip Care",
          "Moisturizer & Sunscreen",
        ],
        description:
          "This indulgent treatment is designed to deeply clean your skin while pumping the skin with nutrients to reveal smooth and brighten skin. Hydra vacuum technology helps to remove impurities with no downtime. It includes removal of comedones & treat of congestion. Electroporation and tightening stimulation follow to tone the skin. Your skin-reviving experience includes a personalized mask and a relaxing massage. The skin is then infused with a powerful blend of antioxidants and vitamins to maximize the brightening effect for more luminous skin.",
      },
      {
        name: "Glow and Go Facial",
        options: [at("45 mins | IDR 590.000")],
        includes: [
          "Deep Cleansing",
          "Soft Peeling",
          "Hydra Peeling",
          "Face Massage",
          "Tightening Stimulation",
          "Mask",
          "Shoulder Massage",
          "Hydrating Infusion",
          "Eye & Lip Care",
          "Moisturizer & Sunscreen",
        ],
        description:
          "A rapid repair solution to restore your skin glow. This treatment features two steps of hydra dermabrasion to exfoliate gently while hydrating your skin. Electroporation and tightening stimulation follow to tone the skin. Your skin-reviving experience includes a personalized mask and a relaxing massage. The treatment concludes with serum infusion packed with powerful actives, leaving the skin looking refreshed & more radiant.",
      },
      {
        name: "Triple Action Acne Care by Dermalogica",
        options: [at("90 mins | IDR 1.290.000")],
        includes: [
          "Deep Cleansing",
          "Steam & Extraction",
          "IPL Acne",
          "Natural Peeling",
          "Mask",
          "Shoulder Massage",
          "Serum Infusion with Ultrasound",
          "Eye & Lip Care",
          "Moisturizer & Sunscreen",
        ],
        description:
          "Designed specifically for acne-prone skin, this treatment involves deep cleansing, hygienic extraction with natural anti-bacterial extracts, and high frequency to prevent further inflammation. It also includes Intense Pulse Light therapy that effectively destroys the P. acnes bacteria, treats inflammatory acne and inhibits sebaceous oil glands. Natural soft peeling is then applied to unblock the clogged pores and relieve congestion. We round off with our tea tree mask and special serum to clarify the skin.",
      },
      {
        name: "Acne & Blemish Facial by Dermalogica",
        options: [at("75 mins | IDR 850.000")],
        includes: [
          "Deep Cleansing",
          "Steam & Extraction",
          "Natural Peeling",
          "Mask",
          "Shoulder Massage",
          "Serum Infusion with Ultrasound",
          "Eye & Lip Care",
          "Moisturizer & Sunscreen",
        ],
        description:
          "Deep cleansing facial to banish blemishes and balance oil production by removing the debris that builds up in pores. The extraction is done using an advanced formula made from anti-bacterial botanical extracts with high frequency to minimize inflammation and break out. It features a soft peeling to treat congested pores & decrease sebum. The treatment concludes with a tea tree mask and dedicated serum for acne-prone skin, leaving your skin feeling invigorated and thoroughly cleansed.",
      },
      {
        name: "Luminous Facial",
        options: [at("75 mins | IDR 850.000")],
        includes: [
          "Deep Cleansing",
          "Microfoliant",
          "Steam & Extraction",
          "Face Massage with Guasha",
          "Soft Peeling",
          "Serum Infusion with Electroporation",
          "Peptide Sheet Mask with PDT",
          "Shoulder Massage",
          "Eye & Lip Care",
          "Moisturizer & Sunscreen",
        ],
        description:
          "Treat your skin to a refreshing boost with our Luminous Facial to cleanse and refresh. The treatment begins with a deep cleanse and microfoliant exfoliation to refine the complexion. Steam and extractions help remove impurities, followed by a relaxing guasha face massage to improve circulation. Soft peeling gently exfoliates, and a serum infusion with electroporation enhances hydration. A peptide sheet mask with PDT adds radiance, while a soothing shoulder massage and moisturizing care finish the treatment.",
      },
      {
        name: "Calming Oxygen Facial",
        options: [at("75 mins | IDR 850.000")],
        includes: [
          "Deep Cleansing",
          "Jet Peel",
          "Soft Peeling",
          "Steam & Extraction",
          "Face Massage with Roller",
          "Calming Mask",
          "Shoulder Massage",
          "Oxygen Spray",
          "Sheet Mask with PDT",
          "Caviar Serum Infusion with Electroporation",
          "Eye & Lip Care",
          "Moisturizer & Sunscreen",
        ],
        description:
          "A best friend for sensitive, this oxygen facial effectively quenches dehydrated, travel-weary, or sun-damaged skin. After deep cleansing, your skin will be exfoliated to remove the dead skin. Essential nutrients are infused to promote hydration following skin oxygenation to stimulate blood flow and encourage healthy production of newer skin cells. The session ends with double face mask and PDT light therapy to soothe and calm the sensitive skin.",
      },
      {
        name: "Bootylicious",
        options: [at("75 mins | IDR 1.050.000")],
        includes: [
          "Deep Cleansing with Oxygeneo",
          "Jet Peel",
          "Steam & Extraction",
          "Soft Peeling",
          "Booty Mask",
          "Firming Body Serum with Ultrasound",
          "Radiofrequency",
          "Firming Body Cream with Booty Massage",
        ],
        description: "Wear your bikini worry-free. Our bootylicious facial comes with everything to treat your booty the love it deserves. This treatment involves deep cleanse, radiofrequency, extraction, booty massage, soft peeling, soothing hydro jelly mask, and firming body",
      },
      {
        name: "Backne Care",
        options: [at("75 mins | IDR 1.290.000")],
        includes: [
          "Cleansing",
          "Steam & Extraction",
          "High Frequency",
          "Soft Peeling",
          "LED",
          "Peel Off Mask",
          "Serum Infusion with Ultrasound",
          "Oil-Free Acne Moisturizer",
        ],
        description: "Calming and acne-preventing treatment that helps you to smooth and resurface your back. Our back acne treatment involves deep cleansing, extraction, and soft peels to exfoliate the dead skin gently and unclog the pores. Blue light therapy is also used to treat inflammation and accelerate the healing process. The treatment finished calming hydro mask and serum infusion. Get ready to rock and shine with your backless dress.",
      },
    ],
  },
];

export const GUEST_QUOTES: Testimonial[] = [
  {
    quote:
      "The spa treatment is so relaxing and pampering. It also includes a flower bath that we can customize (perfect for the Instagram shots). Thank you Mahamaya Spa. I will definitely come back whenever I visit Bali again",
    author: "Stephanie, Google",
  },
  {
    quote:
      "We loved the daily yoga classes with Pabi, who was very sweet and an excellent instructor. Our foot massage and couples massage were both perfect and so relaxing",
    author: "Nicole Himes, Tripadvisor",
  },
  {
    quote:
      "The morning yoga classes gave the soul of Bali a real feeling! We rested very much in this place and we recommend it with all our heart!",
    author: "Dominika Wronowska, Tripadvisor",
  },
  {
    quote:
      "I had a hot stone massage at the spa and it was really lovely. So tranquil and relaxing. Its also next to a river which gives you beautiful sounds as natural background music!",
    author: "Carina, Google",
  },
  {
    quote:
      "We loved the yoga classes with Paby. She is a great yoga professional. We are from Spain and we have gone to some yoga classes that we did not like but the yoga classes with Paby have been great",
    author: "Paloma Fernández, Google",
  },
];
