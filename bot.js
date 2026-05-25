const TelegramBot = require('node-telegram-bot-api');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const bot = new TelegramBot(TOKEN, { polling: true });

// ─── SAMPLE LISTINGS ─────────────────────────────────────────────────────────
const listings = [
  {
    id: 1,
    title: '3-комн. квартира, Тверская ул.',
    type: 'apartment',
    deal: 'buy',
    city: 'Москва',
    price: 18500000,
    rooms: 3,
    area: 87,
    floor: '5/12',
    description: 'Просторная квартира с евроремонтом, паркинг, закрытый двор.',
    photo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
  },
  {
    id: 2,
    title: '1-комн. квартира, Арбат',
    type: 'apartment',
    deal: 'rent',
    city: 'Москва',
    price: 85000,
    rooms: 1,
    area: 42,
    floor: '3/9',
    description: 'Уютная квартира-студия, 5 мин до метро, вся мебель.',
    photo: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  },
  {
    id: 3,
    title: 'Коттедж 200 м², Подмосковье',
    type: 'house',
    deal: 'buy',
    city: 'Московская область',
    price: 12000000,
    rooms: 5,
    area: 200,
    floor: '2 этажа',
    description: 'Загородный дом с участком 10 соток, баня, гараж.',
    photo: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  },
  {
    id: 4,
    title: '2-комн. квартира, Невский пр.',
    type: 'apartment',
    deal: 'buy',
    city: 'Санкт-Петербург',
    price: 9800000,
    rooms: 2,
    area: 65,
    floor: '4/6',
    description: 'Историческое здание, высокие потолки, паркет, вид на канал.',
    photo: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  },
  {
    id: 5,
    title: 'Офис 120 м², Деловой центр',
    type: 'commercial',
    deal: 'rent',
    city: 'Москва',
    price: 200000,
    rooms: null,
    area: 120,
    floor: '8/20',
    description: 'Открытый офис в бизнес-центре класса А, парковка, охрана.',
    photo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
  },
  {
    id: 6,
    title: '4-комн. квартира, Крестовский остров',
    type: 'apartment',
    deal: 'rent',
    city: 'Санкт-Петербург',
    price: 150000,
    rooms: 4,
    area: 130,
    floor: '10/14',
    description: 'Элитная квартира, панорамный вид, консьерж, фитнес в доме.',
    photo: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  },
];

// ─── USER SESSION STORAGE ────────────────────────────────────────────────────
const sessions = {};

function getSession(chatId) {
  if (!sessions[chatId]) {
    sessions[chatId] = { step: 'main', filters: {}, bookingData: {} };
  }
  return sessions[chatId];
}

// ─── KEYBOARDS ────────────────────────────────────────────────────────────────
const mainMenuKeyboard = {
  reply_markup: {
    keyboard: [
      ['🏠 Объекты недвижимости', '📅 Записаться на просмотр'],
      ['❓ Частые вопросы', '📞 Связаться с агентом'],
      ['ℹ️ О нас'],
    ],
    resize_keyboard: true,
    persistent: true,
  },
};

const listingsMenuKeyboard = {
  reply_markup: {
    keyboard: [
      ['🛒 Купить', '🔑 Снять'],
      ['🏢 Квартира', '🏡 Дом / Коттедж', '🏪 Коммерческая'],
      ['🌆 Москва', '🌉 Санкт-Петербург', '📍 Подмосковье'],
      ['📋 Все объекты', '🔙 Главное меню'],
    ],
    resize_keyboard: true,
  },
};

const backKeyboard = {
  reply_markup: {
    keyboard: [['🔙 Главное меню']],
    resize_keyboard: true,
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatPrice(price, deal) {
  if (deal === 'rent') return `${price.toLocaleString('ru-RU')} ₽/мес`;
  return `${price.toLocaleString('ru-RU')} ₽`;
}

function formatListing(l) {
  const dealLabel = l.deal === 'buy' ? '🛒 Продажа' : '🔑 Аренда';
  const roomsLine = l.rooms ? `🛏 Комнат: ${l.rooms}\n` : '';
  return (
    `🏷 *${l.title}*\n` +
    `${dealLabel} | 📍 ${l.city}\n\n` +
    `📐 Площадь: ${l.area} м²\n` +
    `${roomsLine}` +
    `🏗 Этаж: ${l.floor}\n` +
    `📝 ${l.description}\n\n` +
    `💰 *${formatPrice(l.price, l.deal)}*`
  );
}

function filterListings(filters) {
  return listings.filter((l) => {
    if (filters.deal && l.deal !== filters.deal) return false;
    if (filters.type && l.type !== filters.type) return false;
    if (filters.city && !l.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    return true;
  });
}

// ─── FAQ DATA ─────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: '📄 Какие документы нужны для покупки?',
    a:
      'Для покупки квартиры потребуются:\n' +
      '• Паспорт (все страницы)\n' +
      '• ИНН\n' +
      '• Согласие супруга/супруги (если в браке)\n' +
      '• Документы на ипотеку (если используете кредит)\n\n' +
      'Наш агент поможет собрать полный пакет документов.',
  },
  {
    q: '🏦 Помогаете с ипотекой?',
    a:
      'Да! Мы сотрудничаем с ведущими банками России:\n' +
      '• Сбербанк — от 10,9%\n' +
      '• ВТБ — от 11,2%\n' +
      '• Альфа-Банк — от 11,5%\n\n' +
      'Поможем подобрать лучшие условия и оформить заявку онлайн.',
  },
  {
    q: '⏱ Сколько времени занимает сделка?',
    a:
      'Стандартные сроки:\n' +
      '• Подбор объекта: 1–2 недели\n' +
      '• Юридическая проверка: 3–5 дней\n' +
      '• Оформление договора: 1–3 дня\n' +
      '• Регистрация в Росреестре: 5–10 рабочих дней\n\n' +
      'Итого: от 3 до 6 недель.',
  },
  {
    q: '💸 Каков размер комиссии агентства?',
    a:
      'Наша комиссия:\n' +
      '• Продажа/покупка: 2–3% от стоимости объекта\n' +
      '• Аренда: 50–100% от месячной арендной платы\n\n' +
      'Точная сумма обсуждается индивидуально. Первая консультация — бесплатно!',
  },
];

// ─── BOOKING FLOW ─────────────────────────────────────────────────────────────
const bookingSteps = ['name', 'phone', 'date', 'time', 'address'];

function askBookingStep(chatId, step) {
  const prompts = {
    name: '👤 Введите ваше имя и фамилию:',
    phone: '📱 Введите ваш номер телефона (например: +7 900 123-45-67):',
    date: '📅 Укажите желаемую дату просмотра (например: 25.06.2025):',
    time: '🕐 Укажите удобное время (например: 14:00):',
    address: '🏠 Введите адрес объекта или его ID из каталога:',
  };
  bot.sendMessage(chatId, prompts[step], backKeyboard);
}

// ─── MESSAGE HANDLER ──────────────────────────────────────────────────────────
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const session = getSession(chatId);

  // ── Booking flow ───────────────────────────────────────────────────────────
  if (session.step === 'booking') {
    const currentField = bookingSteps[session.bookingIndex || 0];

    if (text === '🔙 Главное меню') {
      session.step = 'main';
      session.bookingData = {};
      return bot.sendMessage(chatId, '🏠 Главное меню:', mainMenuKeyboard);
    }

    session.bookingData[currentField] = text;
    session.bookingIndex = (session.bookingIndex || 0) + 1;

    if (session.bookingIndex < bookingSteps.length) {
      askBookingStep(chatId, bookingSteps[session.bookingIndex]);
    } else {
      // Booking complete
      const d = session.bookingData;
      const summary =
        `✅ *Запись на просмотр подтверждена!*\n\n` +
        `👤 Имя: ${d.name}\n` +
        `📱 Телефон: ${d.phone}\n` +
        `📅 Дата: ${d.date}\n` +
        `🕐 Время: ${d.time}\n` +
        `🏠 Объект: ${d.address}\n\n` +
        `Наш агент свяжется с вами в течение 30 минут для подтверждения. Спасибо!`;
      bot.sendMessage(chatId, summary, { parse_mode: 'Markdown' });
      session.step = 'main';
      session.bookingData = {};
      session.bookingIndex = 0;
      setTimeout(() => bot.sendMessage(chatId, '🏠 Главное меню:', mainMenuKeyboard), 1500);
    }
    return;
  }

  // ── FAQ flow ───────────────────────────────────────────────────────────────
  if (session.step === 'faq') {
    const faq = faqs.find((f) => f.q === text);
    if (faq) {
      await bot.sendMessage(chatId, faq.a, { parse_mode: 'Markdown' });
      // Show FAQ menu again after answer
      const faqKeyboard = {
        reply_markup: {
          keyboard: [...faqs.map((f) => [f.q]), ['🔙 Главное меню']],
          resize_keyboard: true,
        },
      };
      return bot.sendMessage(chatId, 'Выберите другой вопрос или вернитесь в меню:', faqKeyboard);
    }
    if (text === '🔙 Главное меню') {
      session.step = 'main';
      return bot.sendMessage(chatId, '🏠 Главное меню:', mainMenuKeyboard);
    }
  }

  // ── Main & Listings menu ───────────────────────────────────────────────────
  switch (text) {
    case '/start':
    case 'ℹ️ О нас':
    case '🔙 Главное меню': {
      session.step = 'main';
      session.filters = {};
      const greeting =
        text === '/start'
          ? `👋 Добро пожаловать в *АН Простор*!\n\nМы помогаем купить, продать и арендовать недвижимость по всей России.\n\nВыберите раздел:`
          : text === 'ℹ️ О нас'
          ? `🏢 *АН Простор* — агентство недвижимости с 2008 года.\n\n` +
            `📊 *Наша статистика:*\n` +
            `• 5 000+ успешных сделок\n` +
            `• 120+ профессиональных агентов\n` +
            `• Офисы в Москве и Санкт-Петербурге\n\n` +
            `🏆 Лауреат премии «Лучшее агентство года» 2022, 2023\n\n` +
            `Лицензия: 77-2008-РН-01234`
          : `🏠 *Главное меню*`;
      return bot.sendMessage(chatId, greeting, {
        parse_mode: 'Markdown',
        ...mainMenuKeyboard,
      });
    }

    case '🏠 Объекты недвижимости': {
      session.step = 'listings';
      session.filters = {};
      return bot.sendMessage(
        chatId,
        '🔍 *Каталог объектов*\n\nВыберите фильтр или посмотрите все объекты:',
        { parse_mode: 'Markdown', ...listingsMenuKeyboard }
      );
    }

    case '🛒 Купить':
      session.filters.deal = 'buy';
      return sendFilteredListings(chatId, session.filters);

    case '🔑 Снять':
      session.filters.deal = 'rent';
      return sendFilteredListings(chatId, session.filters);

    case '🏢 Квартира':
      session.filters.type = 'apartment';
      return sendFilteredListings(chatId, session.filters);

    case '🏡 Дом / Коттедж':
      session.filters.type = 'house';
      return sendFilteredListings(chatId, session.filters);

    case '🏪 Коммерческая':
      session.filters.type = 'commercial';
      return sendFilteredListings(chatId, session.filters);

    case '🌆 Москва':
      session.filters.city = 'Москва';
      return sendFilteredListings(chatId, session.filters);

    case '🌉 Санкт-Петербург':
      session.filters.city = 'Санкт-Петербург';
      return sendFilteredListings(chatId, session.filters);

    case '📍 Подмосковье':
      session.filters.city = 'Московская';
      return sendFilteredListings(chatId, session.filters);

    case '📋 Все объекты':
      session.filters = {};
      return sendFilteredListings(chatId, {});

    case '📅 Записаться на просмотр': {
      session.step = 'booking';
      session.bookingIndex = 0;
      session.bookingData = {};
      await bot.sendMessage(
        chatId,
        '📅 *Запись на просмотр объекта*\n\nЯ задам несколько вопросов. В любой момент можно вернуться в меню.',
        { parse_mode: 'Markdown' }
      );
      return askBookingStep(chatId, 'name');
    }

    case '❓ Частые вопросы': {
      session.step = 'faq';
      const faqKeyboard = {
        reply_markup: {
          keyboard: [...faqs.map((f) => [f.q]), ['🔙 Главное меню']],
          resize_keyboard: true,
        },
      };
      return bot.sendMessage(chatId, '❓ *Частые вопросы*\n\nВыберите интересующий вопрос:', {
        parse_mode: 'Markdown',
        ...faqKeyboard,
      });
    }

    case '📞 Связаться с агентом': {
      const contactText =
        `📞 *Наши контакты*\n\n` +
        `📱 Телефон: +7 (495) 123-45-67\n` +
        `📧 Email: info@prostor-estate.ru\n` +
        `🌐 Сайт: www.prostor-estate.ru\n\n` +
        `🕐 Режим работы:\n` +
        `Пн–Пт: 9:00 – 20:00\n` +
        `Сб–Вс: 10:00 – 18:00\n\n` +
        `💬 Или напишите нам в Telegram: @prostor_agent`;
      return bot.sendMessage(chatId, contactText, { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }

    default:
      if (session.step === 'main') {
        return bot.sendMessage(
          chatId,
          '🤔 Я не понял вашу команду. Пожалуйста, используйте кнопки меню.',
          mainMenuKeyboard
        );
      }
  }
});

// ─── SEND FILTERED LISTINGS ───────────────────────────────────────────────────
async function sendFilteredListings(chatId, filters) {
  const results = filterListings(filters);

  if (results.length === 0) {
    return bot.sendMessage(
      chatId,
      '😔 По вашему запросу объекты не найдены.\nПопробуйте изменить фильтры.',
      listingsMenuKeyboard
    );
  }

  await bot.sendMessage(
    chatId,
    `🏘 *Найдено объектов: ${results.length}*`,
    { parse_mode: 'Markdown' }
  );

  for (const listing of results.slice(0, 5)) {
    try {
      await bot.sendPhoto(chatId, listing.photo, {
        caption: formatListing(listing),
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📅 Записаться на просмотр', callback_data: `book_${listing.id}` },
              { text: '📞 Позвонить', callback_data: `call_${listing.id}` },
            ],
          ],
        },
      });
    } catch {
      await bot.sendMessage(chatId, formatListing(listing), { parse_mode: 'Markdown' });
    }
  }
}

// ─── CALLBACK QUERY HANDLER (inline buttons) ──────────────────────────────────
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const session = getSession(chatId);

  await bot.answerCallbackQuery(query.id);

  if (data.startsWith('book_')) {
    const listingId = data.split('_')[1];
    const listing = listings.find((l) => l.id === parseInt(listingId));
    session.step = 'booking';
    session.bookingIndex = 0;
    session.bookingData = { address: listing ? listing.title : `Объект #${listingId}` };
    // Skip address step since we know it
    session.bookingIndex = bookingSteps.indexOf('address') + 1 > 0
      ? bookingSteps.length - 1  // pre-fill address, start from name
      : 0;
    session.bookingIndex = 0;
    session.bookingData = { address: listing ? listing.title : `Объект #${listingId}` };

    await bot.sendMessage(
      chatId,
      `📅 *Запись на просмотр*\n🏠 Объект: ${session.bookingData.address}`,
      { parse_mode: 'Markdown' }
    );
    askBookingStep(chatId, 'name');
  }

  if (data.startsWith('call_')) {
    bot.sendMessage(
      chatId,
      `📞 Позвоните нам по номеру:\n*+7 (495) 123-45-67*\n\nИли укажите ваш номер, и мы перезвоним в течение 30 минут!`,
      { parse_mode: 'Markdown', ...mainMenuKeyboard }
    );
  }
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log('🚀 Real Estate Bot запущен!');
