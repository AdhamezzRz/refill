/* REFILL menu. Every item has its name (name) and the Arabic name (ar).
   The menu page, the home page and table ordering all read from this one file.

   section: { id, title, ar, when, intro, groups, special }
   group:   { id, title, ar, desc, items }
   item:    { id, name, ar, desc, img, iced, serve, options, price, tags, pairs }
            serve:   ['hot'], ['iced'] or ['hot', 'iced']. Drinks only.
            img:     file in /assets/menu/ without .webp. iced: the iced photo, shown when the menu is switched to Iced.
            options: [[label, img], ...] — flavours you pick from; tapping one swaps the photo.
            price:   EGP. Leave it out (or null) until prices are final: the menu then shows no prices at all.
            tags:    v = vegetarian, n = contains nuts, new = new, soon = not served yet */
window.MENU = {
  currency: 'EGP',
  hours: { open: 7 * 60, close: 24 * 60 },
  sections: [
    {
      id: 'coffee', title: 'Coffee', ar: 'قهوة', when: 'All day',
      intro: 'Espresso for every mood, a few sweet ones we are quietly proud of, and a slow bar for when you have the time.',
      groups: [
        { id: 'espresso-bar', title: 'Espresso bar', ar: 'إسبريسو بار',
          desc: 'Our house espresso, pulled to order.',
          items: [
            { id: 'espresso', name: 'Espresso', ar: 'إسبريسو', serve: ['hot'], img: 'espresso',
              desc: 'A double shot, short and sweet. Where every day at Refill starts.', tags: ['v'], pairs: 'croissant' },
            { id: 'cortado', name: 'Cortado', ar: 'كورتادو', serve: ['hot'], img: 'cortado',
              desc: 'Espresso cut with an equal splash of warm milk. Small, strong, to the point.', tags: ['v'] },
            { id: 'flat-white', name: 'Flat White', ar: 'فلات وايت', serve: ['hot'], img: 'flatwhite',
              desc: 'A double shot under a thin layer of silky milk. For people who know exactly what they want.', tags: ['v'], pairs: 'croissant' },
            { id: 'cappuccino', name: 'Cappuccino', ar: 'كابتشينو', serve: ['hot'], img: 'cappuccino',
              desc: 'Espresso, steamed milk and a deep, airy crown of foam. Cocoa on top if you like.', tags: ['v'] },
            { id: 'latte', name: 'Caffè Latte', ar: 'لاتيه', serve: ['hot', 'iced'], img: 'latte', iced: 'latte-iced',
              desc: 'Espresso and plenty of milk. Made for conversations that run long.', tags: ['v'] },
            { id: 'americano', name: 'Caffè Americano', ar: 'أمريكانو', serve: ['hot'], img: 'americano',
              desc: 'Espresso stretched with hot water. Clean, long, nothing to hide.', tags: ['v'] },
            { id: 'iced-coffee', name: 'Iced Coffee', ar: 'آيس كوفي', serve: ['iced'], iced: 'iced-coffee',
              desc: 'Coffee poured over ice. The simplest way to cool down.', tags: ['v'] }
          ]
        },
        { id: 'sweet-side', title: 'The sweet side', ar: 'الحلو',
          desc: 'Lattes with something extra. Every one of them comes iced too, unless it says otherwise.',
          items: [
            { id: 'spanish-latte', name: 'Spanish Latte', ar: 'سبانيش لاتيه', serve: ['hot', 'iced'], img: 'spanish', iced: 'spanish-iced',
              desc: 'Espresso, milk and sweetened condensed milk. Smooth, rich, very easy to like.', tags: ['v'] },
            { id: 'sweet-cream', name: 'Sweet Cream Latte', ar: 'سويت كريم', serve: ['hot'], img: 'sweetcream',
              desc: 'A latte topped with a cap of sweet vanilla cream.', tags: ['v'] },
            { id: 'salted-vanilla', name: 'Salted Vanilla Cream Latte', ar: 'سولتد فانيلا كريم', serve: ['hot'], img: 'saltedvanilla',
              desc: 'Vanilla cream with a pinch of sea salt over espresso and milk. Sweet, then salty, then gone.', tags: ['v'] },
            { id: 'salted-caramel', name: 'Salted Caramel Latte', ar: 'سولتد كراميل لاتيه', serve: ['hot', 'iced'], img: 'saltedcaramel', iced: 'saltedcaramel-iced',
              desc: 'Espresso, milk and salted caramel. Sweet, salty and smooth.', tags: ['v'] },
            { id: 'mocha', name: 'Caffè Mocha', ar: 'موكا', serve: ['hot', 'iced'], img: 'mocha', iced: 'mocha-iced',
              desc: 'Espresso, dark chocolate and milk.', tags: ['v'] },
            { id: 'white-mocha', name: 'White Chocolate Mocha', ar: 'وايت موكا', serve: ['hot', 'iced'], img: 'whitemocha', iced: 'whitemocha-iced',
              desc: 'Espresso, white chocolate and milk. Sweeter than it looks.', tags: ['v'] }
          ]
        },
        { id: 'slow-bar', title: 'Slow bar', ar: 'سلو بار',
          desc: 'Filter coffee, brewed by hand, one cup at a time.',
          items: [
            { id: 'drip', name: 'Drip Coffee', ar: 'قهوة فلتر', serve: ['hot'], img: 'drip',
              desc: 'Freshly brewed filter coffee. Your everyday cup.', tags: ['v'] },
            { id: 'v60', name: 'V60 Pour-Over', ar: 'V60', serve: ['hot'], img: 'v60',
              desc: 'Poured slowly by hand through paper. Light, bright and clean. Ask us about the beans.', tags: ['v'] },
            { id: 'french-press', name: 'French Press', ar: 'فرنش بريس', serve: ['hot'], img: 'frenchpress',
              desc: 'Steeped for four minutes, then pressed. Full body, made to share.', tags: ['v'] },
            { id: 'aeropress', name: 'AeroPress', ar: 'إيروبريس', serve: ['hot'], img: 'aeropress',
              desc: 'Pressed with air. Rich and smooth, somewhere between filter and espresso.', tags: ['v'] }
          ]
        }
      ]
    },
    {
      id: 'not-coffee', title: 'Not coffee', ar: 'مش قهوة', when: 'All day',
      intro: 'For the ones who came for the company: chocolate and tea, a whole matcha bar, and cold things in tall glasses.',
      groups: [
        { id: 'cocoa-tea', title: 'Cocoa & tea', ar: 'شوكولاتة وشاي',
          desc: 'Warm hands, all winter.',
          items: [
            { id: 'hot-chocolate', name: 'Hot Chocolate', ar: 'هوت شوكليت', serve: ['hot'], img: 'hotchoc',
              desc: 'Real chocolate melted into steamed milk. Thick, rich, and this winter we refill it.', tags: ['v'] },
            { id: 'black-tea', name: 'Black Tea', ar: 'شاي', serve: ['hot'], img: 'blacktea',
              desc: 'Strong black tea, the way it has always been. Milk, mint or sugar on request.', tags: ['v'] },
            { id: 'green-tea', name: 'Green Tea', ar: 'شاي أخضر', serve: ['hot'], img: 'greentea',
              desc: 'Light, grassy green tea. A reset in a cup.', tags: ['v'] }
          ]
        },
        { id: 'matcha-bar', title: 'Matcha bar', ar: 'ماتشا بار',
          desc: 'Whisked to order, every time.',
          items: [
            { id: 'matcha', name: 'Matcha Latte', ar: 'ماتشا', serve: ['hot'], img: 'matcha',
              desc: 'Matcha whisked smooth and poured into steamed milk. Calm, green, unbothered.', tags: ['v'] },
            { id: 'honey-matcha', name: 'Honey Matcha Latte', ar: 'ماتشا بالعسل', serve: ['hot', 'iced'], img: 'honeymatcha', iced: 'honeymatcha-iced',
              desc: 'Matcha and milk, sweetened with honey. Hot or over ice.', tags: ['v'] },
            { id: 'spanish-matcha', name: 'Iced Spanish Matcha', ar: 'سبانيش ماتشا', serve: ['iced'], iced: 'spanishmatcha',
              desc: 'Matcha over milk and sweetened condensed milk. The Spanish latte’s greener cousin.', tags: ['v'] },
            { id: 'blueberry-matcha', name: 'Blueberry Matcha Frappé', ar: 'فرابيه ماتشا بلوبيري', serve: ['iced'], iced: 'bluematcha',
              desc: 'Blueberry blended with ice and milk, with a layer of matcha on top.', tags: ['v'] },
            { id: 'strawberry-matcha', name: 'Strawberry Matcha Frappé', ar: 'فرابيه ماتشا فراولة', serve: ['iced'], iced: 'pinkmatcha',
              desc: 'Strawberry blended with ice and milk, with a layer of matcha on top.', tags: ['v'] }
          ]
        },
        { id: 'cold', title: 'Cold & fresh', ar: 'ساقع وفريش',
          desc: 'Tall glasses, lots of ice.',
          items: [
            { id: 'mojito', name: 'Mojito', ar: 'موهيتو', serve: ['iced'], iced: 'mojito-berry',
              options: [['Berry', 'mojito-berry'], ['Passion fruit', 'mojito-passion'], ['Peach', 'mojito-peach']],
              desc: 'Fresh mint, lime and sparkling soda over ice. Alcohol-free. Pick your fruit.', tags: ['v'] },
            { id: 'juice', name: 'Fresh Juice', ar: 'عصير فريش', serve: ['iced'], iced: 'juice-mango',
              options: [['Mango', 'juice-mango'], ['Strawberry', 'juice-strawberry'], ['Lemon', 'juice-lemon']],
              desc: 'Fresh fruit, made to order. Pick one.', tags: ['v'] },
            { id: 'frappe', name: 'Frappé', ar: 'فرابيه', serve: ['iced'], iced: 'frappe-vanilla',
              options: [['Vanilla', 'frappe-vanilla'], ['Caramel', 'frappe-caramel']],
              desc: 'Blended with milk and ice, topped with cream. Vanilla or caramel.', tags: ['v'] },
            { id: 'fruit-frappe', name: 'Fruit Frappé', ar: 'فرابيه فواكه', serve: ['iced'], iced: 'fruitfrappe',
              desc: 'Mixed fruit blended thick with ice. Ask what’s in season.', tags: ['v'] },
            { id: 'red-bull', name: 'Red Bull', ar: 'ريد بُل', serve: ['iced'],
              desc: 'Served cold, with a glass of ice.' },
            { id: 'water', name: 'Water', ar: 'مية', serve: ['iced'],
              desc: 'Still mineral water. The first refill there ever was.' }
          ]
        }
      ]
    },
    {
      id: 'bakehouse', title: 'Bakehouse', ar: 'مخبوزات', when: 'From 07:00 until it is gone',
      intro: 'Croissants, sweet mornings and a cake counter. Baked in small batches through the day: when it is gone, it is gone.',
      groups: [
        { id: 'croissants', title: 'Croissants', ar: 'كرواسون',
          desc: 'Butter, layers and a proper shatter.',
          items: [
            { id: 'croissant', name: 'Croissant', ar: 'كرواسون', img: 'croissant-cheese',
              options: [['Cheese', 'croissant-cheese'], ['Berry', 'croissant-berry'], ['Almond', 'croissant-almond'], ['Chocolate', 'croissant-chocolate']],
              desc: 'Golden, buttery, layered by hand. Pick your filling.', tags: ['v'], pairs: 'flat-white' }
          ]
        },
        { id: 'sweet-mornings', title: 'Sweet mornings', ar: 'فطار حلو',
          items: [
            { id: 'french-toast', name: 'French Toast', ar: 'فرنش توست', img: 'frenchtoast',
              desc: 'Thick brioche soaked in custard, pan-fried golden, finished with syrup and berries.', tags: ['v'] },
            { id: 'pancakes', name: 'Mini Pancakes', ar: 'ميني بان كيك', img: 'pancakes',
              desc: 'A stack of little fluffy pancakes with syrup. Made for sharing, or not.', tags: ['v'] },
            { id: 'cookies', name: 'Cookies', ar: 'كوكيز', img: 'cookies',
              desc: 'Chewy in the middle, crisp at the edge, plenty of chocolate.', tags: ['v'] }
          ]
        },
        { id: 'cakes', title: 'Cakes & desserts', ar: 'كيك وحلويات',
          desc: 'From the cake counter, by the slice.',
          items: [
            { id: 'san-sebastian', name: 'San Sebastián Cheesecake', ar: 'سان سيباستيان', img: 'sansebastian',
              desc: 'Burnt on top, soft and creamy in the middle. Deliberately.', tags: ['v'], pairs: 'americano' },
            { id: 'cheesecake', name: 'Classic Cheesecake', ar: 'تشيز كيك', img: 'cheesecake',
              desc: 'Classic baked cheesecake on a buttery biscuit base.', tags: ['v'] },
            { id: 'brownies', name: 'Brownies', ar: 'براونيز', img: 'brownies',
              desc: 'Dense, fudgy, with a crackly top.', tags: ['v'] },
            { id: 'cloud-cake', name: 'Cloud Cake', ar: 'كلاود كيك', img: 'cloudcake',
              desc: 'Light as air, soft cream, barely there.', tags: ['v'] },
            { id: 'fudge', name: 'Chocolate Fudge Cake', ar: 'شوكليت فدج', img: 'fudge',
              desc: 'Layer after layer of dark chocolate cake and fudge.', tags: ['v'] },
            { id: 'coffee-mousse', name: 'Coffee Mousse', ar: 'موس قهوة', img: 'coffeemousse',
              desc: 'Silky coffee mousse made with our espresso. Dessert and a shot in one.', tags: ['v'], pairs: 'espresso' },
            { id: 'berry-mousse', name: 'Berry Mousse', ar: 'موس بيري', img: 'berrymousse',
              desc: 'Light, tart mixed-berry mousse.', tags: ['v'] }
          ]
        }
      ]
    },
    {
      id: 'kitchen', title: 'Kitchen', ar: 'مطبخ', when: 'Breakfast, lunch and in between',
      intro: 'Omelettes, focaccia, salads and sandwiches through the day. After dark, the oven gets very hot: pizza is on its way.',
      special: 'pizza',
      groups: [
        { id: 'omelettes', title: 'Omelettes', ar: 'أومليت',
          desc: 'Three eggs, folded soft, served with toast.',
          items: [
            { id: 'omelette-classic', name: 'Classic Omelette', ar: 'أومليت كلاسيك', img: 'om-classic',
              desc: 'Eggs, butter, a little salt. Done right.', tags: ['v'] },
            { id: 'omelette-cheese', name: 'Mixed Cheese Omelette', ar: 'أومليت مكس تشيز', img: 'om-cheese',
              desc: 'Folded around a melting mix of cheeses.', tags: ['v'] },
            { id: 'omelette-avocado', name: 'Avocado Omelette', ar: 'أومليت أفوكادو', img: 'om-avocado',
              desc: 'Topped with fresh sliced avocado.', tags: ['v'] },
            { id: 'omelette-turkey', name: 'Turkey Omelette', ar: 'أومليت تركي', img: 'om-turkey',
              desc: 'With smoked turkey folded in.' },
            { id: 'omelette-bacon', name: 'Bacon Omelette', ar: 'أومليت بيكون', img: 'om-bacon',
              desc: 'With crisp bacon folded in.' }
          ]
        },
        { id: 'focaccia', title: 'Focaccia', ar: 'فوكاتشا',
          desc: 'Olive oil focaccia, filled and pressed warm.',
          items: [
            { id: 'focaccia-turkey', name: 'Turkey Focaccia', ar: 'فوكاتشا تركي', img: 'focaccia-turkey',
              desc: 'Smoked turkey and melted cheese in warm focaccia.' },
            { id: 'focaccia-jalapeno', name: 'Jalapeño Focaccia', ar: 'فوكاتشا هالابينو', img: 'focaccia-jalapeno',
              desc: 'Melted cheese and jalapeños in warm focaccia. Bring water.' }
          ]
        },
        { id: 'salads', title: 'Salads', ar: 'سلطات',
          items: [
            { id: 'caesar', name: 'Caesar Salad', ar: 'سلطة سيزر', img: 'caesar',
              desc: 'Romaine, parmesan, croutons and creamy Caesar dressing, with grilled chicken.' },
            { id: 'tuna-salad', name: 'Tuna Salad', ar: 'سلطة تونة', img: 'tuna',
              desc: 'Tuna, crisp greens, sweetcorn, olives and a light dressing.' },
            { id: 'rocca', name: 'Rocca Salad', ar: 'سلطة جرجير', img: 'rocca',
              desc: 'Peppery rocket, parmesan and a sharp lemon dressing.', tags: ['v'] },
            { id: 'mexican', name: 'Mexican Salad', ar: 'سلطة مكسيكي', img: 'mexican',
              desc: 'Chicken, beans, sweetcorn, peppers and tortilla crunch, with a spicy dressing.' }
          ]
        },
        { id: 'sandwiches', title: 'Sandwiches', ar: 'ساندوتشات',
          items: [
            { id: 'crispy-chicken', name: 'Crispy Chicken Sandwich', ar: 'كرسبي تشيكن', img: 'crispychicken',
              desc: 'Crispy fried chicken, lettuce and house sauce in a soft bun.' },
            { id: 'cajun-chicken', name: 'Cajun Chicken Sandwich', ar: 'كاجن تشيكن', img: 'cajun',
              desc: 'Grilled chicken in Cajun spices, with peppers and cheese.' },
            { id: 'quesadilla', name: 'Chicken Quesadilla', ar: 'كاساديا فراخ', img: 'quesadilla',
              desc: 'Grilled tortilla filled with chicken, peppers and lots of melted cheese.' },
            { id: 'pepperoni', name: 'Chicken Pepperoni Sandwich', ar: 'تشيكن بيبروني', img: 'pepperoni',
              desc: 'Chicken pepperoni and melted cheese, toasted.' },
            { id: 'smoked-salmon', name: 'Smoked Salmon Sandwich', ar: 'سموكد سالمون', img: 'salmon',
              desc: 'Smoked salmon, cream cheese, rocket and capers.' },
            { id: 'roast-beef', name: 'Roast Beef Sandwich', ar: 'روست بيف', img: 'roastbeef',
              desc: 'Thin-sliced roast beef, cheese, greens and mustard mayo.' },
            { id: 'salmon-croissant', name: 'Avocado Salmon Croissant', ar: 'كرواسون أفوكادو سالمون', img: 'salmoncroissant',
              desc: 'Our butter croissant filled with smoked salmon and fresh avocado.' }
          ]
        }
      ]
    }
  ],
  legend: { v: 'Vegetarian', n: 'Contains nuts', new: 'New', soon: 'Coming soon' }
};
