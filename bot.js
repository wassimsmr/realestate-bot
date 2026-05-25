const { VK, Keyboard } = require('vk-io');
const express = require('express');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TOKEN = process.env.VK_TOKEN || 'YOUR_VK_TOKEN_HERE';
const ADMIN_ID = process.env.ADMIN_VK_ID || null;
const PORT = process.env.PORT || 3000;

const vk = new VK({ token: TOKEN });

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
  },
];

// ─── FAQ DATA ─────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: '📄 Какие документы нужны для покупки?',
    a: 'Для покупки квартиры потребуются:\n• Паспорт (все страницы)\n• ИНН\n• Согласие супруга/супруги (если в браке)\n• Документы на ипотеку (если используете кредит)\n\nНаш агент поможет собрать полный пакет документов.',
  },
  {
    q: '🏦 Помогаете с ипотекой?',
    a: 'Да! Мы сотрудничаем с ведущими банками России:\n• Сбербанк — от 10,9%\n• ВТБ — от 11,2%\n• Альфа-Банк — от 11,5%\n\nПоможем подобрать лучшие условия и оформить заявку онлайн.',
  },
  {
    q: '⏱ Сколько времени занимает сделка?',
    a: 'Стандартные сроки:\n• Подбор объекта: 1–2 недели\n• Юридическая проверка: 3–5 дней\n• Оформление договора: 1–3 дня\n• Регистрация в Росреестре: 5–10 рабочих дней\n\nИтого: от 3 до 6 недель.',
  },
  {
    q: '💸 Каков размер комиссии агентства?',
    a: 'Наша комиссия:\n• Продажа/покупка: 2–3% от стоимости объекта\n• Аренда: 50–100% от месячной арендной платы\n\nТочная сумма обсуждается индивидуально. Первая консультация — бесплатно!',
  },
];

// ─── SESSION STORAGE ──────────────────────────────────────────────────────────
const sessions = {};

function getSession(userId) {
  if (!sessions[userId]) {
    sessions[userId] = { step: 'main', filters: {}, bookingData: {}, bookingIndex: 0 };
  }
  return sessions[userId];
}

// ─── KEYBOARDS ────────────────────────────────────────────────────────────────
const mainKeyboard = Keyboard.builder()
  .textButton({ label: '🏠 Объекты', color: Keyboard.PRIMARY_COLOR })
  .textButton({ label: '📅 Записаться', color: Keyboard.POSITIVE_COLOR })
  .row()
  .textButton({ label: '❓ Вопросы', color: Keyboard.DEFAULT_COLOR })
  .textButton({ label: '📞 Контакты', color: Keyboard.DEFAULT_COLOR })
  .row()
  .textButton({ label: 'ℹ️ О нас', color: Keyboard.DEFAULT_COLOR })
  .oneTime(false)
  .build();

const listingsKeyboard = Keyboard.builder()
  .textButton({ label: '🛒 Купить', color: Keyboard.PRIMARY_COLOR })
  .textButton({ label: '🔑 Снять', color: Keyboard.PRIMARY_COLOR })
  .row()
  .textButton({ label: '🏢 Квартира', color: Keyboard.DEFAULT_COLOR })
  .textButton({ label: '🏡 Дом', color: Keyboard.DEFAULT_COLOR })
  .textButton({ label: '🏪 Офис', color: Keyboard.DEFAULT_COLOR })
  .row()
  .textButton({ label: '🌆 Москва', color: Keyboard.DEFAULT_COLOR })
  .textButton({ label: '🌉 Петербург', color: Keyboard.DEFAULT_COLOR })
  .row()
  .textButton({ label: '📋 Все объекты', color: Keyboard.POSITIVE_COLOR })
  .textButton({ label: '🔙 Меню', color: Keyboard.NEGATIVE_COLOR })
  .oneTime(false)
  .build();

const backKeyboard = Keyboard.builder()
  .textButton({ label: '🔙 Меню', color: Keyboard.NEGATIVE_COLOR })
  .oneTime(false)
  .build();

const faqKeyboard = Keyboard.builder()
  .textButton({ label: '📄 Документы для покупки', color: Keyboard.DEFAULT_COLOR })
  .row()
  .textButton({ label: '🏦 Помогаете с ипотекой?', color: Keyboard.DEFAULT_COLOR })
  .row()
  .textButton({ label: '⏱ Сколько времени займёт?', color: Keyboard.DEFAULT_COLOR })
  .row()
  .textButton({ label: '💸 Размер комиссии?', color: Keyboard.DEFAULT_COLOR })
  .row()
  .textButton({ label: '🔙 Меню', color: Keyboard.NEGATIVE_COLOR })
  .oneTime(false)
  .build();

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatPrice(price, deal) {
  return deal === 'rent'
    ? `${price.toLocaleString('ru-RU')} ₽/мес`
    : `${price.toLocaleString('ru-RU')} ₽`;
}

function formatListing(l) {
  const dealLabel = l.deal === 'buy' ? '🛒 Продажа' : '🔑 Аренда';
  const roomsLine = l.rooms ? `🛏 Комнат: ${l.rooms}\n` : '';
  return (
    `🏷 ${l.title}\n` +
    `${dealLabel} | 📍 ${l.city}\n\n` +
    `📐 Площадь: ${l.area} м²\n` +
    `${roomsLine}` +
    `🏗 Этаж: ${l.floor}\n` +
    `📝 ${l.description}\n\n` +
    `💰 ${formatPrice(l.price, l.deal)}`
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

const bookingSteps = ['name', 'phone', 'date', 'time', 'address'];
const bookingPrompts = {
  name: '👤 Введите ваше имя и фамилию:',
  phone: '📱 Введите ваш номер телефона (например: +7 900 123-45-67):',
  date: '📅 Укажите желаемую дату просмотра (например: 25.06.2025):',
  time: '🕐 Укажите удобное время (например: 14:00):',
  address: '🏠 Введите адрес объекта или его номер из каталога:',
};

// ─── SEND LISTINGS ────────────────────────────────────────────────────────────
async function sendListings(context, filters) {
  const results = filterListings(filters);
  if (results.length === 0) {
    return context.send({
      message: '😔 По вашему запросу объекты не найдены. Попробуйте изменить фильтры.',
      keyboard: listingsKeyboard,
    });
  }

  await context.send({ message: `🏘 Найдено объектов: ${results.length}`, keyboard: listingsKeyboard });

  for (const listing of results.slice(0, 5)) {
    await context.send({
      message: formatListing(listing) + `\n\n✏️ Чтобы записаться, напишите: записаться ${listing.id}`,
    });
  }
}

// ─── NOTIFY ADMIN ─────────────────────────────────────────────────────────────
async function notifyAdmin(d) {
  if (!ADMIN_ID) return;
  try {
    await vk.api.messages.send({
      user_id: ADMIN_ID,
      random_id: Date.now(),
      message:
        `🔔 Новая запись на просмотр!\n\n` +
        `👤 Имя: ${d.name}\n` +
        `📱 Телефон: ${d.phone}\n` +
        `📅 Дата: ${d.date}\n` +
        `🕐 Время: ${d.time}\n` +
        `🏠 Объект: ${d.address}`,
    });
    console.log('Admin notified successfully');
  } catch (err) {
    console.error('Failed to notify admin:', err.message);
  }
}

// ─── MESSAGE HANDLER ──────────────────────────────────────────────────────────
vk.updates.on('message_new', async (context) => {
  const userId = context.senderId;
  const text = (context.text || '').trim();
  const session = getSession(userId);

  // Quick booking from listing
  if (text.toLowerCase().startsWith('записаться ')) {
    const id = text.split(' ')[1];
    const listing = listings.find((l) => l.id === parseInt(id));
    session.step = 'booking';
    session.bookingIndex = 0;
    session.bookingData = { address: listing ? listing.title : `Объект #${id}` };
    return context.send({
      message: `📅 Запись на просмотр\n🏠 Объект: ${session.bookingData.address}\n\n${bookingPrompts.name}`,
      keyboard: backKeyboard,
    });
  }

  // ── Booking flow ──
  if (session.step === 'booking') {
    if (text === '🔙 Меню') {
      session.step = 'main';
      session.bookingData = {};
      return context.send({ message: '🏠 Главное меню:', keyboard: mainKeyboard });
    }

    const currentField = bookingSteps[session.bookingIndex];
    session.bookingData[currentField] = text;
    session.bookingIndex++;

    if (session.bookingIndex < bookingSteps.length) {
      return context.send({
        message: bookingPrompts[bookingSteps[session.bookingIndex]],
        keyboard: backKeyboard,
      });
    } else {
      // Booking complete
      const d = session.bookingData;
      const summary =
        `✅ Запись на просмотр подтверждена!\n\n` +
        `👤 Имя: ${d.name}\n` +
        `📱 Телефон: ${d.phone}\n` +
        `📅 Дата: ${d.date}\n` +
        `🕐 Время: ${d.time}\n` +
        `🏠 Объект: ${d.address}\n\n` +
        `Наш агент свяжется с вами в течение 30 минут. Спасибо!`;
      await context.send({ message: summary, keyboard: mainKeyboard });
      await notifyAdmin(d);
      session.step = 'main';
      session.bookingData = {};
      session.bookingIndex = 0;
      return;
    }
  }

  // ── FAQ flow ──
  if (session.step === 'faq') {
    const faqMap = {
      '📄 Документы для покупки': faqs[0],
      '🏦 Помогаете с ипотекой?': faqs[1],
      '⏱ Сколько времени займёт?': faqs[2],
      '💸 Размер комиссии?': faqs[3],
    };
    if (faqMap[text]) {
      return context.send({ message: faqMap[text].a, keyboard: faqKeyboard });
    }
    if (text === '🔙 Меню') {
      session.step = 'main';
      return context.send({ message: '🏠 Главное меню:', keyboard: mainKeyboard });
    }
  }

  // ── Main menu ──
  switch (text) {
    case 'начать':
    case 'start':
    case 'привет':
    case 'ℹ️ О нас':
      session.step = 'main';
      const greeting = text === 'ℹ️ О нас'
        ? `🏢 АН Простор — агентство недвижимости с 2008 года.\n\n📊 Наша статистика:\n• 5 000+ успешных сделок\n• 120+ профессиональных агентов\n• Офисы в Москве и Санкт-Петербурге\n\n🏆 Лауреат премии «Лучшее агентство года» 2022, 2023`
        : `👋 Добро пожаловать в АН Простор!\n\nМы помогаем купить, продать и арендовать недвижимость по всей России.\n\nВыберите раздел:`;
      return context.send({ message: greeting, keyboard: mainKeyboard });

    case '🏠 Объекты':
      session.step = 'listings';
      session.filters = {};
      return context.send({ message: '🔍 Каталог объектов\nВыберите фильтр или смотрите все:', keyboard: listingsKeyboard });

    case '🛒 Купить':
      session.filters = { ...session.filters, deal: 'buy' };
      return sendListings(context, session.filters);

    case '🔑 Снять':
      session.filters = { ...session.filters, deal: 'rent' };
      return sendListings(context, session.filters);

    case '🏢 Квартира':
      session.filters = { ...session.filters, type: 'apartment' };
      return sendListings(context, session.filters);

    case '🏡 Дом':
      session.filters = { ...session.filters, type: 'house' };
      return sendListings(context, session.filters);

    case '🏪 Офис':
      session.filters = { ...session.filters, type: 'commercial' };
      return sendListings(context, session.filters);

    case '🌆 Москва':
      session.filters = { ...session.filters, city: 'Москва' };
      return sendListings(context, session.filters);

    case '🌉 Петербург':
      session.filters = { ...session.filters, city: 'Петербург' };
      return sendListings(context, session.filters);

    case '📋 Все объекты':
      session.filters = {};
      return sendListings(context, {});

    case '📅 Записаться':
      session.step = 'booking';
      session.bookingIndex = 0;
      session.bookingData = {};
      return context.send({ message: `📅 Запись на просмотр объекта\n\n${bookingPrompts.name}`, keyboard: backKeyboard });

    case '❓ Вопросы':
      session.step = 'faq';
      return context.send({ message: '❓ Частые вопросы\nВыберите интересующий вопрос:', keyboard: faqKeyboard });

    case '📞 Контакты':
      return context.send({
        message: `📞 Наши контакты\n\n📱 Телефон: +7 (495) 123-45-67\n📧 Email: info@prostor-estate.ru\n🌐 Сайт: www.prostor-estate.ru\n\n🕐 Режим работы:\nПн–Пт: 9:00 – 20:00\nСб–Вс: 10:00 – 18:00`,
        keyboard: mainKeyboard,
      });

    case '🔙 Меню':
      session.step = 'main';
      session.filters = {};
      return context.send({ message: '🏠 Главное меню:', keyboard: mainKeyboard });

    default:
      if (session.step === 'main' || !session.step) {
        return context.send({ message: '🏠 Выберите раздел из меню:', keyboard: mainKeyboard });
      }
  }
});

// ─── START ────────────────────────────────────────────────────────────────────
const app = express();
app.get('/', (req, res) => res.send('VK Bot is running!'));
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

vk.updates.startPolling()
  .then(() => console.log('🚀 VK Real Estate Bot запущен!'))
  .catch(console.error);
