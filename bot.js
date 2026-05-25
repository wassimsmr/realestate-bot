const { VK, KeyboardBuilder, ButtonColor } = require('vk-io');
const express = require('express');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TOKEN = process.env.VK_TOKEN || 'YOUR_VK_TOKEN_HERE';
const ADMIN_ID = process.env.ADMIN_VK_ID ? parseInt(process.env.ADMIN_VK_ID) : null;
const PORT = process.env.PORT || 3000;

const vk = new VK({ token: TOKEN });

// ─── SAMPLE LISTINGS ─────────────────────────────────────────────────────────
const listings = [
  { id: 1, title: '3-комн. квартира, Тверская ул.', type: 'apartment', deal: 'buy', city: 'Москва', price: 18500000, rooms: 3, area: 87, floor: '5/12', description: 'Просторная квартира с евроремонтом, паркинг, закрытый двор.' },
  { id: 2, title: '1-комн. квартира, Арбат', type: 'apartment', deal: 'rent', city: 'Москва', price: 85000, rooms: 1, area: 42, floor: '3/9', description: 'Уютная квартира-студия, 5 мин до метро, вся мебель.' },
  { id: 3, title: 'Коттедж 200 м², Подмосковье', type: 'house', deal: 'buy', city: 'Московская область', price: 12000000, rooms: 5, area: 200, floor: '2 этажа', description: 'Загородный дом с участком 10 соток, баня, гараж.' },
  { id: 4, title: '2-комн. квартира, Невский пр.', type: 'apartment', deal: 'buy', city: 'Санкт-Петербург', price: 9800000, rooms: 2, area: 65, floor: '4/6', description: 'Историческое здание, высокие потолки, паркет, вид на канал.' },
  { id: 5, title: 'Офис 120 м², Деловой центр', type: 'commercial', deal: 'rent', city: 'Москва', price: 200000, rooms: null, area: 120, floor: '8/20', description: 'Открытый офис в бизнес-центре класса А, парковка, охрана.' },
  { id: 6, title: '4-комн. квартира, Крестовский остров', type: 'apartment', deal: 'rent', city: 'Санкт-Петербург', price: 150000, rooms: 4, area: 130, floor: '10/14', description: 'Элитная квартира, панорамный вид, консьерж, фитнес в доме.' },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs = {
  '1': { q: '📄 Документы для покупки', a: 'Для покупки квартиры потребуются:\n• Паспорт (все страницы)\n• ИНН\n• Согласие супруга/супруги (если в браке)\n• Документы на ипотеку (если используете кредит)' },
  '2': { q: '🏦 Ипотека', a: 'Да! Мы сотрудничаем с ведущими банками:\n• Сбербанк — от 10,9%\n• ВТБ — от 11,2%\n• Альфа-Банк — от 11,5%' },
  '3': { q: '⏱ Сроки сделки', a: 'Стандартные сроки:\n• Подбор объекта: 1–2 недели\n• Юридическая проверка: 3–5 дней\n• Регистрация: 5–10 рабочих дней\n\nИтого: от 3 до 6 недель.' },
  '4': { q: '💸 Комиссия', a: 'Наша комиссия:\n• Продажа/покупка: 2–3%\n• Аренда: 50–100% от месячной платы\n\nПервая консультация — бесплатно!' },
};

// ─── KEYBOARDS ────────────────────────────────────────────────────────────────
function makeMainKeyboard() {
  return new KeyboardBuilder()
    .textButton({ label: '🏠 Объекты', color: ButtonColor.PRIMARY })
    .textButton({ label: '📅 Записаться', color: ButtonColor.POSITIVE })
    .row()
    .textButton({ label: '❓ Вопросы', color: ButtonColor.SECONDARY })
    .textButton({ label: '📞 Контакты', color: ButtonColor.SECONDARY })
    .row()
    .textButton({ label: 'ℹ️ О нас', color: ButtonColor.SECONDARY })
    .oneTime(false)
    .toString();
}

function makeListingsKeyboard() {
  return new KeyboardBuilder()
    .textButton({ label: '🛒 Купить', color: ButtonColor.PRIMARY })
    .textButton({ label: '🔑 Снять', color: ButtonColor.PRIMARY })
    .row()
    .textButton({ label: '🏢 Квартира', color: ButtonColor.SECONDARY })
    .textButton({ label: '🏡 Дом', color: ButtonColor.SECONDARY })
    .textButton({ label: '🏪 Офис', color: ButtonColor.SECONDARY })
    .row()
    .textButton({ label: '🌆 Москва', color: ButtonColor.SECONDARY })
    .textButton({ label: '🌉 Петербург', color: ButtonColor.SECONDARY })
    .row()
    .textButton({ label: '📋 Все объекты', color: ButtonColor.POSITIVE })
    .textButton({ label: '🔙 Меню', color: ButtonColor.NEGATIVE })
    .oneTime(false)
    .toString();
}

function makeBackKeyboard() {
  return new KeyboardBuilder()
    .textButton({ label: '🔙 Меню', color: ButtonColor.NEGATIVE })
    .oneTime(false)
    .toString();
}

function makeFaqKeyboard() {
  return new KeyboardBuilder()
    .textButton({ label: '1. Документы', color: ButtonColor.SECONDARY })
    .textButton({ label: '2. Ипотека', color: ButtonColor.SECONDARY })
    .row()
    .textButton({ label: '3. Сроки', color: ButtonColor.SECONDARY })
    .textButton({ label: '4. Комиссия', color: ButtonColor.SECONDARY })
    .row()
    .textButton({ label: '🔙 Меню', color: ButtonColor.NEGATIVE })
    .oneTime(false)
    .toString();
}

// ─── SESSION ──────────────────────────────────────────────────────────────────
const sessions = {};
function getSession(userId) {
  if (!sessions[userId]) sessions[userId] = { step: 'main', filters: {}, bookingData: {}, bookingIndex: 0 };
  return sessions[userId];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatPrice(price, deal) {
  return deal === 'rent' ? `${price.toLocaleString('ru-RU')} ₽/мес` : `${price.toLocaleString('ru-RU')} ₽`;
}

function formatListing(l) {
  const roomsLine = l.rooms ? `🛏 Комнат: ${l.rooms}\n` : '';
  return `🏷 ${l.title}\n${l.deal === 'buy' ? '🛒 Продажа' : '🔑 Аренда'} | 📍 ${l.city}\n\n📐 ${l.area} м² | 🏗 Этаж: ${l.floor}\n${roomsLine}📝 ${l.description}\n\n💰 ${formatPrice(l.price, l.deal)}\n\nЧтобы записаться: напишите "записаться ${l.id}"`;
}

function filterListings(filters) {
  return listings.filter(l => {
    if (filters.deal && l.deal !== filters.deal) return false;
    if (filters.type && l.type !== filters.type) return false;
    if (filters.city && !l.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    return true;
  });
}

const bookingSteps = ['name', 'phone', 'date', 'time', 'address'];
const bookingPrompts = {
  name: '👤 Введите ваше имя и фамилию:',
  phone: '📱 Введите номер телефона (например: +7 900 123-45-67):',
  date: '📅 Укажите дату просмотра (например: 25.06.2025):',
  time: '🕐 Укажите удобное время (например: 14:00):',
  address: '🏠 Введите адрес объекта или его номер из каталога:',
};

async function notifyAdmin(d) {
  if (!ADMIN_ID) return;
  try {
    await vk.api.messages.send({
      user_id: ADMIN_ID,
      random_id: Math.floor(Math.random() * 1000000),
      message: `🔔 Новая запись на просмотр!\n\n👤 Имя: ${d.name}\n📱 Телефон: ${d.phone}\n📅 Дата: ${d.date}\n🕐 Время: ${d.time}\n🏠 Объект: ${d.address}`,
    });
    console.log('Admin notified');
  } catch (err) {
    console.error('Admin notify error:', err.message);
  }
}

// ─── MESSAGE HANDLER ──────────────────────────────────────────────────────────
vk.updates.on('message_new', async (context) => {
  if (context.isOutbox) return;
  const userId = context.senderId;
  const text = (context.text || '').trim();
  const session = getSession(userId);

  const send = (message, keyboard) => context.send({ message, keyboard });

  // Quick booking
  if (text.toLowerCase().startsWith('записаться ')) {
    const id = parseInt(text.split(' ')[1]);
    const listing = listings.find(l => l.id === id);
    session.step = 'booking';
    session.bookingIndex = 0;
    session.bookingData = { address: listing ? listing.title : `Объект #${id}` };
    return send(`📅 Запись на просмотр\n🏠 ${session.bookingData.address}\n\n${bookingPrompts.name}`, makeBackKeyboard());
  }

  // Booking flow
  if (session.step === 'booking') {
    if (text === '🔙 Меню') {
      session.step = 'main';
      return send('🏠 Главное меню:', makeMainKeyboard());
    }
    const field = bookingSteps[session.bookingIndex];
    session.bookingData[field] = text;
    session.bookingIndex++;
    if (session.bookingIndex < bookingSteps.length) {
      return send(bookingPrompts[bookingSteps[session.bookingIndex]], makeBackKeyboard());
    } else {
      const d = session.bookingData;
      const summary = `✅ Запись подтверждена!\n\n👤 ${d.name}\n📱 ${d.phone}\n📅 ${d.date}\n🕐 ${d.time}\n🏠 ${d.address}\n\nАгент свяжется с вами в течение 30 минут. Спасибо!`;
      await send(summary, makeMainKeyboard());
      await notifyAdmin(d);
      session.step = 'main';
      session.bookingData = {};
      session.bookingIndex = 0;
      return;
    }
  }

  // FAQ flow
  if (session.step === 'faq') {
    const faqMap = { '1. Документы': '1', '2. Ипотека': '2', '3. Сроки': '3', '4. Комиссия': '4' };
    if (faqMap[text]) return send(faqs[faqMap[text]].a, makeFaqKeyboard());
    if (text === '🔙 Меню') { session.step = 'main'; return send('🏠 Главное меню:', makeMainKeyboard()); }
  }

  // Main menu
  switch (text) {
    case 'начать': case 'start': case 'привет': case '/start':
      session.step = 'main';
      return send('👋 Добро пожаловать в АН Простор!\n\nМы помогаем купить, продать и арендовать недвижимость по всей России.\n\nВыберите раздел:', makeMainKeyboard());

    case 'ℹ️ О нас':
      return send('🏢 АН Простор — агентство недвижимости с 2008 года.\n\n• 5 000+ успешных сделок\n• 120+ профессиональных агентов\n• Офисы в Москве и Санкт-Петербурге\n\n🏆 Лауреат премии «Лучшее агентство года» 2022, 2023', makeMainKeyboard());

    case '🏠 Объекты':
      session.step = 'listings';
      session.filters = {};
      return send('🔍 Каталог объектов\nВыберите фильтр или смотрите все:', makeListingsKeyboard());

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
      return send(`📅 Запись на просмотр объекта\n\n${bookingPrompts.name}`, makeBackKeyboard());

    case '❓ Вопросы':
      session.step = 'faq';
      return send('❓ Частые вопросы\nВыберите номер вопроса:', makeFaqKeyboard());

    case '📞 Контакты':
      return send('📞 Наши контакты\n\n📱 +7 (495) 123-45-67\n📧 info@prostor-estate.ru\n🌐 www.prostor-estate.ru\n\n🕐 Пн–Пт: 9:00–20:00\nСб–Вс: 10:00–18:00', makeMainKeyboard());

    case '🔙 Меню':
      session.step = 'main';
      session.filters = {};
      return send('🏠 Главное меню:', makeMainKeyboard());

    default:
      return send('🏠 Выберите раздел из меню:', makeMainKeyboard());
  }
});

async function sendListings(context, filters) {
  const results = filterListings(filters);
  if (results.length === 0) {
    return context.send({ message: '😔 Объекты не найдены. Попробуйте изменить фильтры.', keyboard: makeListingsKeyboard() });
  }
  await context.send({ message: `🏘 Найдено объектов: ${results.length}`, keyboard: makeListingsKeyboard() });
  for (const listing of results.slice(0, 5)) {
    await context.send({ message: formatListing(listing) });
  }
}

// ─── START ────────────────────────────────────────────────────────────────────
const app = express();
app.get('/', (req, res) => res.send('VK Bot is running!'));
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

vk.updates.startPolling()
  .then(() => console.log('🚀 VK Real Estate Bot запущен!'))
  .catch(console.error);
