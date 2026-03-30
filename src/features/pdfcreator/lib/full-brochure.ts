import { BrochureData } from "@/src/features/pdfcreator/lib/types"

export const defaultBrochure: BrochureData = {
  "brand": "LUNE",
  "logo": "/branding/lune-logo.png",
  "city": "PARIS",
  "year": "2026",
  "sourcePdf": null,
  "extraction": null,
  "cover": {
    "title": "The Paris Price List",
    "intro": "Elevate your travel, experience with LUNE. This version turns the brochure into a web app with multi-brochure management, editable cards and a print-ready PDF layout.",
    "image": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1800&q=80"
  },
  "contact": {
    "name": "LUNE DMC & Concierge",
    "phone": "+33 6 59 58 17 12",
    "email": "vivianne@lunedmc.com",
    "instagram": "@lunedmc",
    "locations": "Paris — Amsterdam"
  },
  "sections": [
    {
      "id": "guided",
      "title": "Guided Tours and Cultural must-sees",
      "items": [
        {
          "id": "guided-museum-and-monuments-tours",
          "name": "Guided museum and monuments tours",
          "hero": "Private Tour including tickets and licensed guide",
          "description": "Private tour at Louvre, D’Orsay, Arc du Triomphe, Saint-Chapelle, L’Orangerie, Foundation LV, etc.",
          "image": "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "approximately 2h",
              "price": "€599"
            },
            {
              "guests": "2 persons",
              "duration": "approximately 2h",
              "price": "€659"
            },
            {
              "guests": "3 persons",
              "duration": "approximately 2h",
              "price": "€719"
            },
            {
              "guests": "4 persons",
              "duration": "approximately 2h",
              "price": "€819"
            },
            {
              "guests": "5 persons",
              "duration": "approximately 2h",
              "price": "€879"
            },
            {
              "guests": "6 persons",
              "duration": "approximately 2h",
              "price": "€899"
            },
            {
              "guests": "7 persons",
              "duration": "approximately 2h",
              "price": "€929"
            },
            {
              "guests": "8 persons",
              "duration": "approximately 2h",
              "price": "€949"
            }
          ],
          "note": "We can tailor all our tours to kids. Opt for a Louvre tour with a fun scavenger hunt."
        },
        {
          "id": "private-eiffel-tower-summit-tour",
          "name": "Private Eiffel Tower Summit Tour",
          "hero": "Private guided tour of the Eiffel Tower summit",
          "description": "Private guided tour of the Eiffel Tower summit, including priority elevator access and tickets.",
          "image": "https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "2h",
              "price": "€539"
            },
            {
              "guests": "2 people",
              "duration": "2h",
              "price": "€629"
            },
            {
              "guests": "3 people",
              "duration": "2h",
              "price": "€689"
            },
            {
              "guests": "4 people",
              "duration": "2h",
              "price": "€739"
            },
            {
              "guests": "5 people",
              "duration": "2h",
              "price": "€799"
            },
            {
              "guests": "6 people",
              "duration": "2h",
              "price": "€859"
            },
            {
              "guests": "7 people",
              "duration": "2h",
              "price": "€919"
            },
            {
              "guests": "8 people",
              "duration": "2h",
              "price": "€979"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "private-notre-dame-tour",
          "name": "Private Notre Dame tour",
          "hero": "Private tour with a licensed guide and priority access",
          "description": "The PDF source still contains a placeholder for the short description. Keep this field editable and complete it in the admin.",
          "image": "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "approximately 1h30",
              "price": "€459"
            },
            {
              "guests": "2 people",
              "duration": "approximately 1h30",
              "price": "€519"
            },
            {
              "guests": "3 people",
              "duration": "approximately 1h30",
              "price": "€569"
            },
            {
              "guests": "4 people",
              "duration": "approximately 1h30",
              "price": "€619"
            },
            {
              "guests": "5 people",
              "duration": "approximately 1h30",
              "price": "€669"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "city-tour-in-premium-car",
          "name": "City Tour in premium car",
          "hero": "Explore Paris",
          "description": "Explore Paris with a licensed guide in a premium vehicle.",
          "image": "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-3 people",
              "duration": "3h",
              "price": "€769"
            },
            {
              "guests": "1-3 people",
              "duration": "4h",
              "price": "€849"
            },
            {
              "guests": "1-3 people",
              "duration": "Full day (7h)",
              "price": "€1239"
            },
            {
              "guests": "1-6 people",
              "duration": "3h",
              "price": "€819"
            },
            {
              "guests": "1-6 people",
              "duration": "4h",
              "price": "€929"
            },
            {
              "guests": "1-6 people",
              "duration": "Full day (7h)",
              "price": "€1349"
            }
          ],
          "note": "The vehicle for 1-3 people is a luxury sedan. For 1-6 people it is a luxury van."
        },
        {
          "id": "vintage-2cv-car-tour",
          "name": "Vintage 2CV car tour",
          "hero": "Discover Paris in an iconic vintage 2CV",
          "description": "Discover Paris in an iconic vintage 2CV with a local guide.",
          "image": "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-3 people",
              "duration": "2h",
              "price": "€229"
            },
            {
              "guests": "1-3 people",
              "duration": "3h",
              "price": "€329"
            },
            {
              "guests": "1-3 people",
              "duration": "4h",
              "price": "€479"
            },
            {
              "guests": "1-3 people",
              "duration": "7h",
              "price": "€749"
            }
          ],
          "note": "All pricing is per car. Optional extras: champagne, macarons, a flower bouquet, photographer."
        },
        {
          "id": "paris-on-foot",
          "name": "Paris on foot",
          "hero": "Discover Paris on foot with a guide",
          "description": "Discover le Marais, Montmartre, Saint-Germain-des-Pres or the Latin Quarter with a licensed guide. Including a gourmet break.",
          "image": "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "2h30",
              "price": "€499"
            },
            {
              "guests": "2 people",
              "duration": "2h30",
              "price": "€549"
            },
            {
              "guests": "3 people",
              "duration": "2h30",
              "price": "€599"
            },
            {
              "guests": "4 people",
              "duration": "2h30",
              "price": "€649"
            },
            {
              "guests": "5 people",
              "duration": "2h30",
              "price": "€699"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "retro-side-car-tour",
          "name": "Retro Side-car Tour",
          "hero": "Side-car tour in Paris",
          "description": "Side-car tour in Paris to discover the iconic highlights of Paris. Accommodates up to 2 passengers per vehicle.",
          "image": "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-2 people",
              "duration": "1h30",
              "price": "€299"
            }
          ],
          "note": "Pricing is per vehicle."
        },
        {
          "id": "private-paris-bike-tour",
          "name": "Private Paris Bike Tour",
          "hero": "Private Bike Tour",
          "description": "Private Bike Tour visiting Paris’ most iconic highlights.",
          "image": "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-2 people",
              "duration": "4h",
              "price": "€675"
            },
            {
              "guests": "3 people",
              "duration": "4h",
              "price": "€710"
            },
            {
              "guests": "4 people",
              "duration": "4h",
              "price": "€745"
            },
            {
              "guests": "5 people",
              "duration": "4h",
              "price": "€780"
            },
            {
              "guests": "6 people",
              "duration": "4h",
              "price": "€815"
            },
            {
              "guests": "7 people",
              "duration": "4h",
              "price": "€850"
            },
            {
              "guests": "8 people",
              "duration": "4h",
              "price": "€885"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "half-day-versailles-excursion",
          "name": "Half Day Versailles excursion",
          "hero": "Private Versailles Tour with guide",
          "description": "Including private roundtrip transfer from Paris hotel, fast-track entry, and a private guided tour of the palace and gardens with a licensed guide.",
          "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "4h",
              "price": "€749"
            },
            {
              "guests": "2 people",
              "duration": "4h",
              "price": "€899"
            },
            {
              "guests": "3 people",
              "duration": "4h",
              "price": "€1049"
            },
            {
              "guests": "4 people",
              "duration": "4h",
              "price": "€1199"
            },
            {
              "guests": "5 people",
              "duration": "4h",
              "price": "€1299"
            },
            {
              "guests": "6 people",
              "duration": "4h",
              "price": "€1349"
            },
            {
              "guests": "7 people",
              "duration": "4h",
              "price": "€1399"
            }
          ],
          "note": "Enhance your visit with a picnic, bike tour through the estate, private rowboat ride on the Grand Canal, or add the Trianon."
        }
      ]
    },
    {
      "id": "culinary",
      "title": "Culinary Tours and Food Experiences in Paris",
      "items": [
        {
          "id": "marais-pastry-tour",
          "name": "Marais Pastry Tour",
          "hero": "Le Marais Pastry Walking Tour",
          "description": "Guided walk with a local guide, tasting classic French pastries while exploring le Marais.",
          "image": "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "approximately 2h",
              "price": "€449"
            },
            {
              "guests": "2 people",
              "duration": "approximately 2h",
              "price": "€499"
            },
            {
              "guests": "3 people",
              "duration": "approximately 2h",
              "price": "€519"
            },
            {
              "guests": "4 people",
              "duration": "approximately 2h",
              "price": "€689"
            },
            {
              "guests": "5 people",
              "duration": "approximately 2h",
              "price": "€799"
            },
            {
              "guests": "6 people",
              "duration": "approximately 2h",
              "price": "€899"
            }
          ],
          "note": "Not recommended on Mondays."
        },
        {
          "id": "montmartre-food-tour",
          "name": "Montmartre Food Tour",
          "hero": "Montmartre Food Walking Tour",
          "description": "Guided walking tour with a local guide, sampling local food specialties in Montmartre.",
          "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "approximately 2h",
              "price": "€449"
            },
            {
              "guests": "2 people",
              "duration": "approximately 2h",
              "price": "€499"
            },
            {
              "guests": "3 people",
              "duration": "approximately 2h",
              "price": "€519"
            },
            {
              "guests": "4 people",
              "duration": "approximately 2h",
              "price": "€689"
            },
            {
              "guests": "5 people",
              "duration": "approximately 2h",
              "price": "€799"
            },
            {
              "guests": "6 people",
              "duration": "approximately 2h",
              "price": "€899"
            }
          ],
          "note": "Not recommended on Mondays."
        },
        {
          "id": "parisian-picnic-by-the-eiffel-tower",
          "name": "Parisian Picnic by the Eiffel Tower",
          "hero": "Parisian picnic",
          "description": "Enjoy an elegant French picnic in iconic Paris locations such as the Eiffel Tower, Parc de Bagatelle or Parc Monceau.",
          "image": "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "1h30 to 3h",
              "price": "€549"
            },
            {
              "guests": "2 people",
              "duration": "1h30 to 3h",
              "price": "€649"
            },
            {
              "guests": "3 people",
              "duration": "1h30 to 3h",
              "price": "€749"
            },
            {
              "guests": "4 people",
              "duration": "1h30 to 3h",
              "price": "€799"
            },
            {
              "guests": "5 people",
              "duration": "1h30 to 3h",
              "price": "€849"
            },
            {
              "guests": "6 people",
              "duration": "1h30 to 3h",
              "price": "€899"
            },
            {
              "guests": "7 people",
              "duration": "1h30 to 3h",
              "price": "€949"
            }
          ],
          "note": "Can be customized for birthdays, anniversaries or proposals."
        },
        {
          "id": "market-visit-and-french-cooking-class",
          "name": "Market visit and French cooking class",
          "hero": "French cooking class",
          "description": "Hands-on English-taught cooking class in Paris with market visit, fresh ingredients and a three-course meal served with wine.",
          "image": "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "Price per person",
              "duration": "6h",
              "price": "€269"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "macarons-baking-class",
          "name": "Macarons baking class",
          "hero": "Macarons class",
          "description": "Learn how to make delicate French macarons from scratch in a hands-on class with a professional chef.",
          "image": "https://images.unsplash.com/photo-1558326567-98ae2405596b?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "Price per person",
              "duration": "3h",
              "price": "€165"
            }
          ],
          "note": "Option to privatize is at extra price."
        },
        {
          "id": "private-wine-tasting",
          "name": "Private Wine Tasting",
          "hero": "Wine tasting experience",
          "description": "Wine tasting with a professional sommelier. Six wines including Champagne, paired with cheeses and charcuterie in a private tasting space.",
          "image": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "2h",
              "price": "€150"
            },
            {
              "guests": "2 people",
              "duration": "2h",
              "price": "€299"
            },
            {
              "guests": "3 people",
              "duration": "2h",
              "price": "€399"
            },
            {
              "guests": "4 people",
              "duration": "2h",
              "price": "€550"
            },
            {
              "guests": "5 people",
              "duration": "2h",
              "price": "€650"
            },
            {
              "guests": "6 people",
              "duration": "2h",
              "price": "€739"
            }
          ],
          "note": "Wines are available for purchase after the tasting."
        },
        {
          "id": "gin-making-workshop",
          "name": "Gin making workshop",
          "hero": "Guided gin making workshop",
          "description": "Gin-making workshop in an artisanal distillery. Taste several gins and house cocktails, explore botanicals, and create your own bespoke 70cl bottle with custom label.",
          "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-12 people",
              "duration": "2h",
              "price": "€175"
            }
          ],
          "note": "Includes a non-alcoholic infusion, gourmet plate, booklet and full guidance throughout the session."
        }
      ]
    },
    {
      "id": "seine",
      "title": "Seine River Experiences",
      "items": [
        {
          "id": "the",
          "name": "The",
          "hero": "Discover Paris from the Seine",
          "description": "Experience Paris from a different perspective on a 1.5-hour private Seine River cruise, enjoying iconic landmarks from the water. Including rosé wine and macarons.",
          "image": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-4 people",
              "duration": "1h30",
              "price": "€799"
            },
            {
              "guests": "5 people",
              "duration": "1h30",
              "price": "€899"
            },
            {
              "guests": "6 people",
              "duration": "1h30",
              "price": "€999"
            }
          ],
          "note": "The original PDF page title is truncated to “The”. Keep this item editable until the business title is confirmed."
        },
        {
          "id": "the-limousine",
          "name": "The Limousine",
          "hero": "Private Seine cruise",
          "description": "Private Seine experience with elegant setup and curated onboard moment.",
          "image": "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-6 people",
              "duration": "1h30",
              "price": "€1250"
            },
            {
              "guests": "7 people",
              "duration": "1h30",
              "price": "€1375"
            },
            {
              "guests": "8 people",
              "duration": "1h30",
              "price": "€1499"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "the-cocktail-cruise",
          "name": "The Cocktail Cruise",
          "hero": "Cocktail cruise",
          "description": "Private cruise with sweet or savory onboard options. Vintage champagne and non-alcoholic drinks are included.",
          "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-3 people",
              "duration": "2h",
              "price": "€1499"
            },
            {
              "guests": "4-5 people",
              "duration": "2h",
              "price": "€1599"
            },
            {
              "guests": "6-8 people",
              "duration": "2h",
              "price": "€1750"
            },
            {
              "guests": "9-10 people",
              "duration": "2h",
              "price": "€1899"
            },
            {
              "guests": "11-12 people",
              "duration": "2h",
              "price": "€2050"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "premium-private-seine-cruise",
          "name": "Premium Private Seine Cruise",
          "hero": "Premium private cruise",
          "description": "Premium boat with indoor space. Panoramic views of Paris landmarks with champagne, macarons and amuse-bouches.",
          "image": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-6 people",
              "duration": "1h30",
              "price": "€1399"
            },
            {
              "guests": "7-12 people",
              "duration": "1h30",
              "price": "€1750"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "private-seine-cruise-lunch-or-dinner",
          "name": "Private Seine Cruise lunch or dinner",
          "hero": "Private lunch or dinner cruise",
          "description": "Romantic and intimate private Seine lunch or dinner cruise, good for proposals, family dinners or special evenings.",
          "image": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "Up to 12 people",
              "duration": "2 to 4 hours",
              "price": "On request"
            }
          ],
          "note": "Not applicable."
        }
      ]
    },
    {
      "id": "daytrips",
      "title": "Day Trips and Excursions",
      "items": [
        {
          "id": "champagne",
          "name": "Champagne",
          "hero": "Champagne day trip",
          "description": "Visits to two Champagne estates with tastings, Reims Cathedral, Dom Pérignon’s village and the Avenue de Champagne, including transportation from Paris.",
          "image": "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "10h",
              "price": "€1469"
            },
            {
              "guests": "2 people",
              "duration": "10h",
              "price": "€1599"
            },
            {
              "guests": "3 people",
              "duration": "10h",
              "price": "€1719"
            },
            {
              "guests": "4 people",
              "duration": "10h",
              "price": "€1839"
            },
            {
              "guests": "5 people",
              "duration": "10h",
              "price": "€1949"
            },
            {
              "guests": "6 people",
              "duration": "10h",
              "price": "€2069"
            },
            {
              "guests": "7 people",
              "duration": "10h",
              "price": "€2189"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "champagne-premium",
          "name": "Champagne Premium",
          "hero": "Premium Champagne day",
          "description": "Ultimate day in Champagne with premium houses such as Moët & Chandon, Dom Pérignon, Veuve Clicquot or Taittinger.",
          "image": "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-7 people",
              "duration": "10h",
              "price": "On request"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "loire-valley",
          "name": "Loire Valley",
          "hero": "Loire Valley full-day tour",
          "description": "Full-day private Loire Valley tour with a guide and round-trip luxury transportation from Paris. Chambord, Cheverny, Blois and wine tasting.",
          "image": "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "10h",
              "price": "€1499"
            },
            {
              "guests": "2 people",
              "duration": "10h",
              "price": "€1559"
            },
            {
              "guests": "3 people",
              "duration": "10h",
              "price": "€1679"
            },
            {
              "guests": "4 people",
              "duration": "10h",
              "price": "€1789"
            },
            {
              "guests": "5 people",
              "duration": "10h",
              "price": "€1999"
            },
            {
              "guests": "6 people",
              "duration": "10h",
              "price": "€2149"
            },
            {
              "guests": "7 people",
              "duration": "10h",
              "price": "€2199"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "mont-saint-michel",
          "name": "Mont-Saint-Michel",
          "hero": "Mont-Saint-Michel",
          "description": "Enjoy a private guided tour of Mont-Saint-Michel and its medieval abbey with a licensed guide, including round-trip transportation from Paris and entrance tickets.",
          "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "10h",
              "price": "€1639"
            },
            {
              "guests": "2 people",
              "duration": "10h",
              "price": "€1849"
            },
            {
              "guests": "3 people",
              "duration": "10h",
              "price": "€1979"
            },
            {
              "guests": "4 people",
              "duration": "10h",
              "price": "€2085"
            },
            {
              "guests": "5 people",
              "duration": "10h",
              "price": "€2199"
            },
            {
              "guests": "6 people",
              "duration": "10h",
              "price": "€2299"
            },
            {
              "guests": "7 people",
              "duration": "10h",
              "price": "€2429"
            }
          ],
          "note": "Customize your day with a horse-riding session or a guided walking tour of the bay with an official bay guide to explore the tidal sands and mudflats."
        },
        {
          "id": "normandy-d-day",
          "name": "Normandy D-Day",
          "hero": "Normandy D-Day",
          "description": "Full-day private Normandy D-Day tour with a certified guide-driver and round-trip transportation from Paris. Visit the Caen Memorial, Omaha Beach, Pointe du Hoc and the American Cemetery.",
          "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "10h",
              "price": "€1595"
            },
            {
              "guests": "2 people",
              "duration": "10h",
              "price": "€1649"
            },
            {
              "guests": "3 people",
              "duration": "10h",
              "price": "€1789"
            },
            {
              "guests": "4 people",
              "duration": "10h",
              "price": "€1945"
            },
            {
              "guests": "5 people",
              "duration": "10h",
              "price": "€2049"
            },
            {
              "guests": "6 people",
              "duration": "10h",
              "price": "€2169"
            },
            {
              "guests": "7 people",
              "duration": "10h",
              "price": "€2249"
            }
          ],
          "note": "Customize your excursion with a Jeep tour of Omaha Beach or add a picnic lunch for a more special day."
        },
        {
          "id": "versailles-and-giverny",
          "name": "Versailles and Giverny",
          "hero": "Versailles and Giverny",
          "description": "Full-day private tour to the Palace of Versailles and the Monet Foundation in Giverny, including an expert guide and private round-trip transportation.",
          "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "8h",
              "price": "€1399"
            },
            {
              "guests": "2 people",
              "duration": "8h",
              "price": "€1459"
            },
            {
              "guests": "3 people",
              "duration": "8h",
              "price": "€1599"
            },
            {
              "guests": "4 people",
              "duration": "8h",
              "price": "€1789"
            },
            {
              "guests": "5 people",
              "duration": "8h",
              "price": "€1999"
            },
            {
              "guests": "6 people",
              "duration": "8h",
              "price": "€2149"
            },
            {
              "guests": "7 people",
              "duration": "8h",
              "price": "€2199"
            }
          ],
          "note": "Elevate your day with an elegant lunch between both tours or a prepared picnic in the gardens of Versailles."
        },
        {
          "id": "vaux-le-vicomte-and-fontainebleau",
          "name": "Vaux-le-Vicomte and Fontainebleau",
          "hero": "Vaux-le-Vicomte and Fontainebleau",
          "description": "Private guided tour of both Vaux-le-Vicomte and Fontainebleau with round-trip transfer from Paris, fast-track entry and free time for lunch in Fontainebleau.",
          "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "8h",
              "price": "€1399"
            },
            {
              "guests": "2 people",
              "duration": "8h",
              "price": "€1459"
            },
            {
              "guests": "3 people",
              "duration": "8h",
              "price": "€1599"
            },
            {
              "guests": "4 people",
              "duration": "8h",
              "price": "€1789"
            },
            {
              "guests": "5 people",
              "duration": "8h",
              "price": "€1999"
            },
            {
              "guests": "6 people",
              "duration": "8h",
              "price": "€2149"
            },
            {
              "guests": "7 people",
              "duration": "8h",
              "price": "€2199"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "chateau-de-chantilly",
          "name": "Chateau de Chantilly",
          "hero": "Chateau de Chantilly",
          "description": "Private guided tour of the Chateau de Chantilly and its gardens with round-trip transfer from Paris, offering an immersive exploration of French aristocratic history.",
          "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "4h",
              "price": "€799"
            },
            {
              "guests": "2 people",
              "duration": "4h",
              "price": "€899"
            },
            {
              "guests": "3 people",
              "duration": "4h",
              "price": "€999"
            },
            {
              "guests": "4 people",
              "duration": "4h",
              "price": "€1199"
            },
            {
              "guests": "5 people",
              "duration": "4h",
              "price": "€1299"
            },
            {
              "guests": "6 people",
              "duration": "4h",
              "price": "€1399"
            },
            {
              "guests": "7 people",
              "duration": "4h",
              "price": "€1499"
            }
          ],
          "note": "Add free time to explore the chateau grounds, with optional experiences such as a royal picnic or a horseback ride through Chantilly Forest."
        },
        {
          "id": "bruges",
          "name": "Bruges",
          "hero": "Bruges",
          "description": "Private full-day Bruges excursion with round-trip transport from Paris, a private walking tour, timed Belfry tickets and a scenic canal cruise.",
          "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "12h",
              "price": "€1595"
            },
            {
              "guests": "2 people",
              "duration": "12h",
              "price": "€1649"
            },
            {
              "guests": "3 people",
              "duration": "12h",
              "price": "€1789"
            },
            {
              "guests": "4 people",
              "duration": "12h",
              "price": "€1945"
            },
            {
              "guests": "5 people",
              "duration": "12h",
              "price": "€2049"
            },
            {
              "guests": "6 people",
              "duration": "12h",
              "price": "€2169"
            },
            {
              "guests": "7 people",
              "duration": "12h",
              "price": "€2249"
            }
          ],
          "note": "This can be turned into a two-day trip with an overnight stay, plus optional chocolate, beer, bike or waffle-making add-ons."
        },
        {
          "id": "brussels",
          "name": "Brussels",
          "hero": "Brussels",
          "description": "Private transfer from your Paris hotel to Gare du Nord, then high-speed train to Brussels, a private walking tour, lunch and an afternoon museum visit before returning to Paris.",
          "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-7 people",
              "duration": "Around 14h",
              "price": "On request"
            }
          ],
          "note": "You can extend the Brussels experience with an overnight stay or add beer tasting, chocolate-making, boutique shopping or a guided bike tour."
        },
        {
          "id": "amsterdam",
          "name": "Amsterdam",
          "hero": "Amsterdam",
          "description": "Private transfer to Gare du Nord, high-speed train, group or private bike tour of Amsterdam, plus optional museum visits, canal cruise or shopping before returning to Paris.",
          "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-10 people",
              "duration": "Around 16h",
              "price": "On request"
            }
          ],
          "note": "You can extend the stay overnight and add tulip fields in season, Zaanse Schans, Anne Frank House tickets, a food tour or a Dutch cheese tasting."
        },
        {
          "id": "london",
          "name": "London",
          "hero": "London",
          "description": "London appears in the PDF index. The webapp keeps this card editable so you can finish the exact wording, pricing and notes from the source brochure.",
          "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-10 people",
              "duration": "Around 16h",
              "price": "On request"
            }
          ],
          "note": "Keep editing from the admin."
        }
      ]
    },
    {
      "id": "fashion",
      "title": "Paris Fashion and Shopping Experiences",
      "items": [
        {
          "id": "flea-market-experience",
          "name": "Flea Market Experience",
          "hero": "Saint-Ouen Flea Market",
          "description": "Explore the Saint-Ouen Flea Market with a private guide, uncovering hidden gems and vintage treasures during a 2.5h to 3h tour.",
          "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "2.5h-3h",
              "price": "€629"
            },
            {
              "guests": "2 people",
              "duration": "2.5h-3h",
              "price": "€639"
            },
            {
              "guests": "3 people",
              "duration": "2.5h-3h",
              "price": "€669"
            },
            {
              "guests": "4 people",
              "duration": "2.5h-3h",
              "price": "€729"
            },
            {
              "guests": "5 people",
              "duration": "2.5h-3h",
              "price": "€779"
            },
            {
              "guests": "6 people",
              "duration": "2.5h-3h",
              "price": "€819"
            },
            {
              "guests": "7 people",
              "duration": "2.5h-3h",
              "price": "€869"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "private-galerie-dior-tour",
          "name": "Private Galerie Dior Tour",
          "hero": "Galerie Dior",
          "description": "Private Galerie Dior tour with an expert.",
          "image": "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "approximately 2h",
              "price": "€550"
            },
            {
              "guests": "2 people",
              "duration": "approximately 2h",
              "price": "€599"
            },
            {
              "guests": "3 people",
              "duration": "approximately 2h",
              "price": "€649"
            },
            {
              "guests": "4 people",
              "duration": "approximately 2h",
              "price": "€699"
            },
            {
              "guests": "5 people",
              "duration": "approximately 2h",
              "price": "€749"
            },
            {
              "guests": "6 people",
              "duration": "approximately 2h",
              "price": "€799"
            },
            {
              "guests": "7 people",
              "duration": "approximately 2h",
              "price": "€849"
            },
            {
              "guests": "8 people",
              "duration": "approximately 2h",
              "price": "€899"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "luxury-vintage-shopping-experience",
          "name": "Luxury Vintage Shopping Experience",
          "hero": "Luxury vintage shopping",
          "description": "A curated private experience exploring authentic designer vintage in Paris, across exclusive boutiques in Le Marais and Saint-Germain-des-Pres.",
          "image": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "2.5h-3h",
              "price": "€629"
            },
            {
              "guests": "2 people",
              "duration": "2.5h-3h",
              "price": "€639"
            },
            {
              "guests": "3 people",
              "duration": "2.5h-3h",
              "price": "€669"
            },
            {
              "guests": "4 people",
              "duration": "2.5h-3h",
              "price": "€729"
            },
            {
              "guests": "5 people",
              "duration": "2.5h-3h",
              "price": "€779"
            },
            {
              "guests": "6 people",
              "duration": "2.5h-3h",
              "price": "€819"
            },
            {
              "guests": "7 people",
              "duration": "2.5h-3h",
              "price": "€869"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "samaritaine-vip-lounge-styling",
          "name": "Samaritaine VIP Lounge Styling",
          "hero": "VIP Lounge Styling",
          "description": "Private appointment-only styling session in the historic VIP Lounge of La Samaritaine with champagne, refreshments and optional beauty or fragrance experiences.",
          "image": "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "3-4 hours",
              "price": "€550"
            }
          ],
          "note": "Not applicable."
        },
        {
          "id": "parisian-shopping-experience",
          "name": "Parisian Shopping Experience",
          "hero": "Parisian shopping",
          "description": "Explore hidden boutiques and emerging French designers. A fully curated itinerary with personal guidance and street-style analysis.",
          "image": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1 person",
              "duration": "6 hours",
              "price": "€650"
            }
          ],
          "note": "Not applicable."
        }
      ]
    },
    {
      "id": "transport",
      "title": "Transport",
      "items": [
        {
          "id": "airport-transfers",
          "name": "Airport Transfers",
          "hero": "Airport transfer",
          "description": "Pick-up at CDG Airport: your chauffeur meets you in the arrivals hall with a name sign and drives you directly to your Paris hotel.",
          "image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-3 people",
              "duration": "1h",
              "price": "€149"
            },
            {
              "guests": "1-7 people",
              "duration": "1h",
              "price": "€189"
            }
          ],
          "note": "Vehicle for 1-3 people: Mercedes Class E. Vehicle for 1-7 people: Mercedes Class V."
        },
        {
          "id": "train-station-transfers",
          "name": "Train Station Transfers",
          "hero": "Train station transfer",
          "description": "Pick-up at the train station of choice: your chauffeur meets you in the arrivals hall with a name sign and drives you directly to your Paris hotel.",
          "image": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1600&q=80",
          "highlights": [
            "[highlight 1]",
            "[highlight 2]",
            "[highlight 3]",
            "[highlight 4]",
            "[highlight 5]"
          ],
          "pricing": [
            {
              "guests": "1-3 people",
              "duration": "1h",
              "price": "€85"
            },
            {
              "guests": "1-7 people",
              "duration": "1h",
              "price": "€110"
            }
          ],
          "note": "Vehicle for 1-3 people: Mercedes Class E. Vehicle for 1-7 people: Mercedes Class V."
        }
      ]
    }
  ]
}
