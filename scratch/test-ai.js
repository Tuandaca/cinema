// Sequential AI test with delay between calls to avoid rate limit
const BASE = 'http://localhost:3001/api/ai/chat';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function chat(message, sessionId = null) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

async function test(name, message, sid, expect) {
  console.log(`\n🧪 ${name}`);
  console.log(`   → "${message}"`);
  try {
    const r = await chat(message, sid);
    const cardTypes = r.uiCards?.map(c => c.type) || [];
    console.log(`   📝 AI: ${r.text?.slice(0, 120)}...`);
    console.log(`   🃏 Cards: ${cardTypes.length > 0 ? cardTypes.join(', ') : '(none)'}`);
    const hasExpected = !expect || cardTypes.includes(expect);
    console.log(hasExpected ? `   ✅ PASS` : `   ⚠️ No ${expect} card (AI chose text-only)`);
    return { pass: hasExpected, sid: r.sessionId };
  } catch (e) {
    // Check if it's a rate limit friendly response
    if (e.message.includes('quá tải')) {
      console.log(`   ⏳ Rate limited - friendly message returned`);
      return { pass: false, sid };
    }
    console.log(`   ❌ ERROR: ${e.message}`);
    return { pass: false, sid };
  }
}

async function run() {
  console.log('═══════════════════════════════════════');
  console.log('  CoiCine AI - Sequential Test Suite');
  console.log('═══════════════════════════════════════');

  let results = [];
  
  // Test 1
  let r = await test('Now Showing', 'Đang chiếu phim gì?', null, 'MOVIE_LIST');
  results.push(r.pass);
  await delay(4000);

  // Test 2 (follow-up using session)
  r = await test('Movie Detail', 'Cho tôi xem chi tiết phim đầu tiên', r.sid, 'MOVIE_DETAIL');
  results.push(r.pass);
  await delay(4000);

  // Test 3
  r = await test('Showtimes', 'Xem lịch chiếu phim này', r.sid, 'SHOWTIME_LIST');
  results.push(r.pass);
  await delay(4000);

  // Test 4 (new session)
  r = await test('Combos', 'Có combo bắp nước gì?', null, 'COMBO_LIST');
  results.push(r.pass);
  await delay(4000);

  // Test 5
  r = await test('Top Rated', 'Gợi ý phim hay nhất nên xem', null, 'MOVIE_LIST');
  results.push(r.pass);
  await delay(4000);

  // Test 6
  r = await test('Theater Info', 'Thông tin về rạp chiếu phim', null, 'THEATER_INFO');
  results.push(r.pass);
  await delay(4000);

  // Test 7
  r = await test('Genre Search', 'Tìm phim hành động cho tôi', null, 'MOVIE_LIST');
  results.push(r.pass);
  await delay(4000);

  // Test 8
  r = await test('General Chat', 'Xin chào, tôi có thể làm gì ở đây?', null, null);
  results.push(r.pass);

  const passed = results.filter(Boolean).length;
  const total = results.length;
  console.log('\n═══════════════════════════════════════');
  console.log(`  RESULTS: ${passed}/${total} passed`);
  console.log('═══════════════════════════════════════');
}

run();
