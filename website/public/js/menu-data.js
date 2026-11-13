/* REFILL menu — DEMO CONTENT. Names, prices and descriptions are placeholders to show the layout.
   Edit freely: every page reads from this one file.
   tags: sig = house signature, v = vegetarian, vg = vegan, n = contains nuts, new = new, soon = not served yet
   img:  file name in /assets/menu/ (without .webp); items without img are shown text-only. */
window.MENU = {
  currency: 'EGP',
  hours: { open: 7 * 60, close: 24 * 60 },
  sections: [
    {
      id: 'coffee', title: 'Coffee', ar: 'قهوة', when: 'All day',
      intro: 'A house espresso for milk, a rotating single origin for the slow bar, and a few signatures we are quietly proud of.',
      special: 'beans',
      groups: [
        { title: 'Espresso bar', items: [
          { id: 'espresso', name: 'Espresso', desc: 'Daybreak house blend, pulled short and sweet.', price: 95, img: 'espresso', notes: 'Milk chocolate · red apple · brown sugar', pairs: 'pain-au-chocolat' },
          { id: 'cortado', name: 'Cortado', desc: 'Equal parts espresso and warm milk. Small, strong, honest.', price: 115, img: 'espresso', notes: 'Cocoa · caramel' },
          { id: 'flat-white', name: 'Flat white', desc: 'Double ristretto, a thin layer of silky milk.', price: 135, img: 'flatwhite', notes: 'Hazelnut · toffee · cream', pairs: 'butter-croissant' },
          { id: 'cappuccino', name: 'Cappuccino', desc: 'A proper one: dense foam, a single shot, cocoa on request.', price: 130, img: 'flatwhite' },
          { id: 'latte', name: 'Latte', desc: 'Long and soft. Oat, almond or lactose-free at no extra cost.', price: 140, img: 'flatwhite', tags: ['v'] }
        ]},
        { title: 'Signatures', items: [
          { id: 'plaster', name: 'Plaster', desc: 'Our latte with white chocolate, a cold cream cap and a few flakes of sea salt. Named after our walls.', price: 175, img: 'plaster', tags: ['sig', 'v'], notes: 'White chocolate · salt · vanilla', pairs: 'basque-cheesecake' },
          { id: 'shorouk', name: 'Shorouk', desc: 'Iced Spanish latte with a hint of cardamom, poured over clear ice.', price: 165, img: 'spanish', tags: ['sig', 'v'], notes: 'Condensed milk · cardamom · cocoa', pairs: 'cardamom-knot' },
          { id: 'golden-hour', name: 'Golden Hour', desc: 'Espresso over tonic and orange peel. Tastes like 17:30.', price: 160, img: 'tonic', tags: ['sig', 'vg'], notes: 'Bitter orange · quinine · cocoa nib' },
          { id: 'ahwa', name: 'Ahwa Mazbout', desc: 'Egyptian coffee, specialty beans, cardamom if you like, brewed in brass. Thick foam, no shortcuts.', price: 90, img: 'ahwa', tags: ['sig', 'vg'], notes: 'Dark cocoa · cardamom · spice' }
        ]},
        { title: 'Slow bar', items: [
          { id: 'v60', name: 'V60 pour-over', desc: 'This week: Ethiopia Guji, natural process. Brewed to order, about four minutes.', price: 170, img: 'v60', tags: ['vg'], notes: 'Blueberry · jasmine · cacao nib' },
          { id: 'batch', name: 'Batch brew', desc: 'Filter coffee, fresh every hour. Free refill while you stay.', price: 110, img: 'v60', tags: ['vg'] },
          { id: 'cold-brew', name: 'Cold brew', desc: 'Steeped for eighteen hours. Smooth, round, quietly strong.', price: 140, img: 'tonic', tags: ['vg'] }
        ]},
        { title: 'Not coffee', items: [
          { id: 'matcha', name: 'Iced matcha', desc: 'Ceremonial grade from Uji, whisked and floated over milk.', price: 170, img: 'matcha', tags: ['v'], notes: 'Grassy · sweet · umami' },
          { id: 'karkade', name: 'Karkade spritz', desc: 'Cold hibiscus over tonic, orange and mint. Very Cairo, very cold.', price: 120, img: 'karkade', tags: ['vg', 'new'], notes: 'Red berries · citrus · mint' },
          { id: 'chocolate', name: 'Hot chocolate', desc: '70% dark chocolate melted into steamed milk.', price: 145, tags: ['v'] },
          { id: 'mint-tea', name: 'Fresh mint tea', desc: 'A pot for one, or for two.', price: 80, tags: ['vg'] }
        ]}
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
        { title: 'Viennoiserie', items: [
          { id: 'butter-croissant', name: 'Butter croissant', desc: 'French butter, three days from dough to oven. Shatters properly.', price: 95, img: 'croissant', tags: ['v'], notes: 'Brown butter · honeycomb crumb', pairs: 'flat-white' },
          { id: 'pain-au-chocolat', name: 'Pain au chocolat', desc: 'Two batons of dark chocolate, the same laminated dough.', price: 110, img: 'painchoc', tags: ['v'], pairs: 'espresso' },
          { id: 'almond-croissant', name: 'Almond croissant', desc: 'Twice baked with frangipane and toasted almonds.', price: 130, img: 'almond', tags: ['v', 'n'] },
          { id: 'pistachio-cruffin', name: 'Pistachio cruffin', desc: 'Croissant dough baked in a tin, rolled in sugar, filled with pistachio cream.', price: 150, img: 'cruffin', tags: ['sig', 'v', 'n'], notes: 'Pistachio · vanilla · crunch', pairs: 'shorouk' }
        ]},
        { title: 'Buns & savoury', items: [
          { id: 'cardamom-knot', name: 'Cardamom knot', desc: 'Swedish-style bun, freshly ground cardamom, pearl sugar.', price: 105, img: 'cardamom', tags: ['v'], pairs: 'shorouk' },
          { id: 'zaatar-twist', name: 'Za’atar & halloumi twist', desc: 'Puff pastry, grilled halloumi, za’atar and sesame.', price: 120, img: 'zaatar', tags: ['v'], notes: 'Thyme · sumac · salty cheese' },
          { id: 'roumy-croissant', name: 'Roumy cheese croissant', desc: 'Aged Egyptian roumy cheese baked into the layers, black pepper on top.', price: 125, tags: ['v', 'new'] }
        ]},
        { title: 'Loaves', items: [
          { id: 'sourdough', name: 'Country sourdough', desc: 'Forty-eight hour ferment, dark crust, open crumb. Whole loaf to take home.', price: 190, img: 'sourdough', tags: ['vg'] },
          { id: 'dukkah-rye', name: 'Dukkah rye', desc: 'Dense rye studded with toasted dukkah and seeds.', price: 210, tags: ['vg', 'n'] }
        ]},
        { title: 'Cakes', items: [
          { id: 'basque-cheesecake', name: 'Basque cheesecake', desc: 'Burnt top, soft middle. A slice is never enough, two is a lot.', price: 175, img: 'cheesecake', tags: ['v'], notes: 'Caramel · cream · vanilla', pairs: 'plaster' },
          { id: 'olive-oil-cake', name: 'Olive oil & orange cake', desc: 'Egyptian olive oil, Baladi orange zest, a thin glaze.', price: 120, tags: ['v'] },
          { id: 'date-cookie', name: 'Date & tahini cookie', desc: 'Siwa dates, tahini, flaky salt. Chewy in the middle.', price: 70, tags: ['vg'] }
        ]}
      ]
    },
    {
      id: 'kitchen', title: 'Kitchen', ar: 'مطبخ', when: 'Plates from 08:00 · Pizza soon',
      intro: 'Simple plates through the day. After dark, the oven gets very hot: wood-fired pizza is on its way.',
      special: 'pizza',
      groups: [
        { title: 'Morning plates', items: [
          { id: 'labneh', name: 'Labneh plate', desc: 'Thick labneh, Sinai olive oil, za’atar, olives and warm flatbread.', price: 185, img: 'labneh', tags: ['v'], notes: 'Tangy · herbal · green olive' },
          { id: 'eggs', name: 'Eggs on sourdough', desc: 'Soft scrambled eggs, brown butter, chives, on our country loaf.', price: 210, tags: ['v'] },
          { id: 'croissant-sandwich', name: 'Croissant sandwich', desc: 'Smoked turkey, emmental, Dijon, pickled cucumber.', price: 225 }
        ]},
        { title: 'Pizza', note: 'From 19:00 · opening soon', items: [
          { id: 'margherita', name: 'Margherita', desc: 'San Marzano tomato, fior di latte, basil, olive oil. Forty-eight hour dough.', price: 295, img: 'margherita', tags: ['v', 'soon'] },
          { id: 'bianca', name: 'Funghi bianca', desc: 'No tomato. Ricotta, mozzarella, roasted mushrooms, thyme, parmesan.', price: 345, img: 'bianca', tags: ['v', 'soon'] },
          { id: 'sujuk', name: 'Sujuk & hot honey', desc: 'Spicy beef sujuk, mozzarella, tomato, chilli honey to finish.', price: 365, img: 'sujuk', tags: ['sig', 'soon'] },
          { id: 'zaatar-pizza', name: 'Za’atar bianca', desc: 'Manakish meets Naples: za’atar, labneh, olive oil, fresh mint.', price: 280, tags: ['v', 'soon'] }
        ]}
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
