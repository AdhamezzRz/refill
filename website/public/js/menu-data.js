/* REFILL menu — DEMO CONTENT. Names, prices and descriptions are placeholders to show the layout.
   Edit freely: the menu page, the home page and table ordering all read from this one file.

   section: { id, title, ar, when, intro, groups, special }
   group:   { id, title, desc, cols, items, extras, special }
            cols: price column names, e.g. ['Hot', 'Iced'] or ['Slice', 'Whole'].
            With cols, an item's price is a list in the same order (null = not available).
   item:    { id, name, desc, price, img, notes, pairs, tags }
            tags: sig = house signature, v = vegetarian, vg = vegan, n = contains nuts, new = new, soon = not served yet
            img:  file in /assets/menu/ without .webp (items without img are text-only) */
window.MENU = {
  currency: 'EGP',
  hours: { open: 7 * 60, close: 24 * 60 },
  sections: [
    {
      id: 'coffee', title: 'Coffee', ar: 'قهوة', when: 'All day',
      intro: 'A house espresso for milk, a rotating single origin for the slow bar, and a few signatures we are quietly proud of.',
      special: 'beans',
      groups: [
        { id: 'espresso-bar', title: 'Espresso bar', cols: ['Hot', 'Iced'],
          desc: 'Daybreak house blend. Oat, almond or lactose-free milk at no extra cost.',
          items: [
            { id: 'espresso', name: 'Espresso', desc: 'A double shot, pulled short and sweet.', price: [95, null], img: 'espresso', notes: 'Milk chocolate · red apple · brown sugar', pairs: 'pain-au-chocolat', tags: ['vg'] },
            { id: 'americano', name: 'Americano', desc: 'Double espresso, hot water, nothing to hide.', price: [100, 110], tags: ['vg'] },
            { id: 'cortado', name: 'Cortado', desc: 'Equal parts espresso and warm milk. Small, strong, honest.', price: [115, null], img: 'espresso', notes: 'Cocoa · caramel', tags: ['v'] },
            { id: 'flat-white', name: 'Flat white', desc: 'Double ristretto, a thin layer of silky milk.', price: [135, null], img: 'flatwhite', notes: 'Hazelnut · toffee · cream', pairs: 'butter-croissant', tags: ['v'] },
            { id: 'cappuccino', name: 'Cappuccino', desc: 'Dense foam, a double shot, cocoa on request.', price: [130, null], img: 'flatwhite', tags: ['v'] },
            { id: 'latte', name: 'Latte', desc: 'Long and soft.', price: [140, 150], img: 'flatwhite', tags: ['v'] },
            { id: 'spanish-latte', name: 'Spanish latte', desc: 'Sweetened condensed milk, double espresso.', price: [150, 160], img: 'spanish', tags: ['v'] }
          ],
          extras: [['Extra shot', 25], ['Vanilla, hazelnut or caramel', 20], ['Plant milk', 0], ['Decaf', 0]]
        },
        { id: 'signatures', title: 'Signatures', cols: ['Hot', 'Iced'],
          desc: 'Only at Refill. Made with the house blend.',
          items: [
            { id: 'plaster', name: 'Plaster', desc: 'Latte with white chocolate, a cold cream cap and a few flakes of sea salt. Named after our walls.', price: [175, 185], img: 'plaster', tags: ['sig', 'v'], notes: 'White chocolate · salt · vanilla', pairs: 'basque-cheesecake' },
            { id: 'shorouk', name: 'Shorouk', desc: 'Spanish latte with freshly ground cardamom, poured over clear ice.', price: [155, 165], img: 'spanish', tags: ['sig', 'v'], notes: 'Condensed milk · cardamom · cocoa', pairs: 'cardamom-knot' },
            { id: 'golden-hour', name: 'Golden Hour', desc: 'Espresso over tonic and orange peel. Tastes like 17:30.', price: [null, 160], img: 'tonic', tags: ['sig', 'vg'], notes: 'Bitter orange · quinine · cocoa nib' },
            { id: 'ahwa', name: 'Ahwa mazbout', desc: 'Egyptian coffee with specialty beans, brewed in brass. Cardamom if you like. Thick foam, no shortcuts.', price: [90, null], img: 'ahwa', tags: ['sig', 'vg'], notes: 'Dark cocoa · cardamom · spice' }
          ]
        },
        { id: 'slow-bar', title: 'Slow bar',
          desc: 'Filter coffee, brewed to order. This week: Ethiopia Guji, natural.',
          items: [
            { id: 'v60', name: 'V60 pour-over', desc: 'One cup, about four minutes. Ask us about the beans.', price: 170, img: 'v60', tags: ['vg'], notes: 'Blueberry · jasmine · cacao nib' },
            { id: 'chemex', name: 'Chemex for two', desc: 'A clean, bright pot to share.', price: 260, img: 'v60', tags: ['vg'] },
            { id: 'batch', name: 'Batch brew', desc: 'Fresh every hour. Free refills while you stay.', price: 110, tags: ['vg'] },
            { id: 'cold-brew', name: 'Cold brew', desc: 'Steeped for eighteen hours. Smooth, round, quietly strong.', price: 140, img: 'tonic', tags: ['vg'] }
          ]
        },
        { id: 'not-coffee', title: 'Not coffee', cols: ['Hot', 'Iced'],
          desc: 'For the ones who came for the company.',
          items: [
            { id: 'matcha', name: 'Matcha latte', desc: 'Ceremonial grade from Uji, whisked to order.', price: [160, 170], img: 'matcha', tags: ['v'], notes: 'Grassy · sweet · umami' },
            { id: 'karkade', name: 'Karkade spritz', desc: 'Cold hibiscus over tonic, orange and mint. Very Cairo, very cold.', price: [null, 120], img: 'karkade', tags: ['vg', 'new'], notes: 'Red berries · citrus · mint' },
            { id: 'chocolate', name: 'Hot chocolate', desc: '70% dark chocolate melted into steamed milk.', price: [145, 155], tags: ['v'] },
            { id: 'mint-tea', name: 'Fresh mint tea', desc: 'A pot for one, or for two.', price: [80, null], tags: ['vg'] },
            { id: 'orange', name: 'Fresh orange juice', desc: 'Baladi oranges, squeezed to order.', price: [null, 110], tags: ['vg'] }
          ]
        }
      ]
    },
    {
      id: 'bakehouse', title: 'Bakehouse', ar: 'مخبوزات', when: 'From 07:00 until it is gone',
      intro: 'Laminated by hand every night, baked in small batches all day. When the case is empty, it is empty.',
      special: 'oven',
      oven: [
        { at: 7 * 60, what: 'Croissants & pain au chocolat' },
        { at: 9 * 60, what: 'Sourdough & rye' },
        { at: 12 * 60, what: 'Cardamom knots' },
        { at: 16 * 60, what: 'Basque cheesecake' },
        { at: 19 * 60, what: 'Second round of croissants' }
      ],
      groups: [
        { id: 'viennoiserie', title: 'Viennoiserie',
          desc: 'French butter, three days from dough to oven.',
          items: [
            { id: 'butter-croissant', name: 'Butter croissant', desc: 'Shatters properly. Honeycomb inside.', price: 95, img: 'croissant', tags: ['v'], notes: 'Brown butter · honeycomb crumb', pairs: 'flat-white' },
            { id: 'pain-au-chocolat', name: 'Pain au chocolat', desc: 'Two batons of dark chocolate.', price: 110, img: 'painchoc', tags: ['v'], pairs: 'espresso' },
            { id: 'almond-croissant', name: 'Almond croissant', desc: 'Twice baked with frangipane and toasted almonds.', price: 130, img: 'almond', tags: ['v', 'n'] },
            { id: 'pistachio-cruffin', name: 'Pistachio cruffin', desc: 'Croissant dough baked in a tin, rolled in sugar, filled with pistachio cream.', price: 150, img: 'cruffin', tags: ['sig', 'v', 'n'], notes: 'Pistachio · vanilla · crunch', pairs: 'shorouk' },
            { id: 'roumy-croissant', name: 'Roumy cheese croissant', desc: 'Aged Egyptian roumy baked into the layers, black pepper on top.', price: 125, tags: ['v', 'new'] }
          ],
          extras: [['Warmed, with salted butter', 15]]
        },
        { id: 'buns-savoury', title: 'Buns & savoury',
          desc: 'Out of the oven at noon.',
          items: [
            { id: 'cardamom-knot', name: 'Cardamom knot', desc: 'Swedish-style bun, freshly ground cardamom, pearl sugar.', price: 105, img: 'cardamom', tags: ['v'], pairs: 'shorouk' },
            { id: 'zaatar-twist', name: 'Za’atar & halloumi twist', desc: 'Puff pastry, grilled halloumi, za’atar and sesame.', price: 120, img: 'zaatar', tags: ['v'], notes: 'Thyme · sumac · salty cheese' },
            { id: 'cinnamon-roll', name: 'Brown butter cinnamon roll', desc: 'Soft, sticky, cream cheese glaze.', price: 115, tags: ['v'] }
          ]
        },
        { id: 'loaves', title: 'Loaves', cols: ['Half', 'Whole'],
          desc: 'To take home. Sliced on request.',
          items: [
            { id: 'sourdough', name: 'Country sourdough', desc: 'Forty-eight hour ferment, dark crust, open crumb.', price: [110, 190], img: 'sourdough', tags: ['vg'] },
            { id: 'dukkah-rye', name: 'Dukkah rye', desc: 'Dense rye with toasted dukkah and seeds.', price: [120, 210], tags: ['vg', 'n'] },
            { id: 'baladi', name: 'Whole wheat baladi', desc: 'Our take on the Egyptian classic, baked on stone.', price: [null, 45], tags: ['vg'] }
          ]
        },
        { id: 'cakes', title: 'Cakes', cols: ['Slice', 'Whole'],
          desc: 'Whole cakes to order, 24 hours ahead.',
          items: [
            { id: 'basque-cheesecake', name: 'Basque cheesecake', desc: 'Burnt top, soft middle.', price: [175, 1450], img: 'cheesecake', tags: ['v'], notes: 'Caramel · cream · vanilla', pairs: 'plaster' },
            { id: 'olive-oil-cake', name: 'Olive oil & orange cake', desc: 'Egyptian olive oil, Baladi orange zest, a thin glaze.', price: [120, 850], tags: ['v'] },
            { id: 'date-cookie', name: 'Date & tahini cookie', desc: 'Siwa dates, tahini, flaky salt. Chewy in the middle.', price: [70, null], tags: ['vg'] }
          ]
        }
      ]
    },
    {
      id: 'kitchen', title: 'Kitchen', ar: 'مطبخ', when: 'Plates from 08:00 · Pizza soon',
      intro: 'Simple plates through the day. After dark, the oven gets very hot: wood-fired pizza is on its way.',
      groups: [
        { id: 'morning', title: 'Morning plates',
          desc: '08:00 to 13:00.',
          items: [
            { id: 'labneh', name: 'Labneh plate', desc: 'Thick labneh, Sinai olive oil, za’atar, olives and warm flatbread.', price: 185, img: 'labneh', tags: ['v'], notes: 'Tangy · herbal · green olive' },
            { id: 'eggs', name: 'Eggs on sourdough', desc: 'Soft scrambled eggs, brown butter, chives.', price: 210, tags: ['v'] },
            { id: 'shakshuka', name: 'Green shakshuka', desc: 'Eggs baked with spinach, leeks, feta and dill. Bread for dipping.', price: 230, tags: ['v'] }
          ],
          extras: [['Add an egg', 35], ['Add avocado', 60]]
        },
        { id: 'sandwiches', title: 'Sandwiches',
          desc: 'All day, on bread from our bakehouse.',
          items: [
            { id: 'croissant-sandwich', name: 'Croissant sandwich', desc: 'Smoked turkey, emmental, Dijon, pickled cucumber.', price: 225 },
            { id: 'focaccia', name: 'Focaccia caprese', desc: 'Mozzarella, tomato, basil pesto.', price: 240, tags: ['v', 'n'] },
            { id: 'halloumi', name: 'Halloumi & roasted pepper', desc: 'On country sourdough, with za’atar butter.', price: 230, tags: ['v'] }
          ]
        },
        { id: 'pizza', title: 'Pizza', note: 'From 19:00 · opening soon', special: 'pizza',
          desc: 'Forty-eight hour dough, wood-fired, about ninety seconds in the oven.',
          items: [
            { id: 'margherita', name: 'Margherita', desc: 'San Marzano tomato, fior di latte, basil, olive oil.', price: 295, img: 'margherita', tags: ['v', 'soon'] },
            { id: 'bianca', name: 'Funghi bianca', desc: 'No tomato. Ricotta, mozzarella, roasted mushrooms, thyme, parmesan.', price: 345, img: 'bianca', tags: ['v', 'soon'] },
            { id: 'sujuk', name: 'Sujuk & hot honey', desc: 'Spicy beef sujuk, mozzarella, tomato, chilli honey to finish.', price: 365, img: 'sujuk', tags: ['sig', 'soon'] },
            { id: 'zaatar-pizza', name: 'Za’atar bianca', desc: 'Manakish meets Naples: za’atar, labneh, olive oil, fresh mint.', price: 280, tags: ['v', 'soon'] }
          ]
        }
      ]
    }
  ],
  beans: [
    { role: 'House espresso', name: 'Daybreak', origin: 'Brazil Cerrado + Ethiopia Sidama', process: 'Natural + washed', notes: 'Milk chocolate · red apple · brown sugar', roast: 0.62 },
    { role: 'Slow bar', name: 'Guji Hambela', origin: 'Ethiopia · 2,100 m', process: 'Natural', notes: 'Blueberry · jasmine · cacao nib', roast: 0.28 },
    { role: 'Guest', name: 'Huila Pink Bourbon', origin: 'Colombia · 1,850 m', process: 'Washed', notes: 'Red grape · hibiscus · panela', roast: 0.36 }
  ],
  legend: { sig: 'House signature', v: 'Vegetarian', vg: 'Vegan', n: 'Contains nuts', new: 'New', soon: 'Coming soon' }
};
