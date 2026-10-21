// populatedb.js
// 用法：
//   node populatedb.js                          # 按 NODE_ENV 自动选择数据库
//   node populatedb.js "mongodb+srv://..."      # 显式指定连接串
require('dotenv').config();

// 本机默认 DNS 拒绝 Node 的 SRV 查询，须指定公共 DNS 才能解析 Atlas 的 mongodb+srv 地址
const dns = require('dns');
dns.setServers(['223.5.5.5', '8.8.8.8']);

const mongoose = require('mongoose');
const Author = require('./models/author');
const Genre = require('./models/genre');
const Book = require('./models/book');
const BookInstance = require('./models/bookinstance');

// ==================== 1. 连接配置 ====================

const cliUri = process.argv[2];
const isProduction = process.env.NODE_ENV === 'production';
const envUri = isProduction
  ? process.env.ATLAS_MONGODB_URI
  : process.env.LOCAL_MONGODB_URI;
const mongoUri = cliUri || envUri;

if (!mongoUri) {
  console.error('❌ 缺少数据库地址！');
  console.error('   用法：node populatedb.js [mongodb_uri]');
  console.error('   或在 .env 中配置 LOCAL_MONGODB_URI / ATLAS_MONGODB_URI');
  process.exit(1);
}

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 15000, // 集群选择超时
  connectTimeoutMS: 15000, // TCP 建连超时
  socketTimeoutMS: 45000, // 读写超时
  maxPoolSize: 10, // 连接池上限
  minPoolSize: 0,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
};

// 把驱动抛出的底层异常翻译成可排查的中文原因
function classifyError(err) {
  const name = (err && err.name) || 'Error';
  const code = err && err.code;
  const msg = (err && err.message) || String(err);

  if (code === 18 || code === 8000 || /Authentication failed|bad auth|SCRAM|auth.*failed/i.test(msg)) {
    return '认证失败：用户名或密码错误，或该用户无权访问此数据库';
  }
  if (name === 'MongooseServerSelectionError') {
    return '集群不可达：网络不通 / Atlas IP 白名单未放行 / 集群地址错误（拓扑探测超时）';
  }
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || code === 'ESERVFAIL' || /querySrv|ENOTFOUND/i.test(msg)) {
    return 'DNS 解析失败：无法解析 Atlas 集群域名（可尝试更换 DNS）';
  }
  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || /ECONNREFUSED|ETIMEDOUT|socket hang up/i.test(msg)) {
    return '网络连接失败：端口不可达或 TCP 连接被拒绝/超时';
  }
  if (name === 'MongooseTimeoutError' || /timed out|timeout/i.test(msg)) {
    return '连接超时：在限定时间内未完成集群选择或握手';
  }
  return '未分类的数据库异常';
}

// 生命周期事件监听
function registerConnectionEvents() {
  const conn = mongoose.connection;
  conn.on('connecting', () => console.log('[事件] connecting → 正在连接数据库…'));
  conn.on('connected', () =>
    console.log(`[事件] connected → 已连接 ${conn.host}:${conn.port} / ${conn.name}`)
  );
  conn.on('open', () => console.log('[事件] open → 连接已就绪，可执行读写'));
  conn.on('error', (err) => {
    console.error(`[事件] error → ${classifyError(err)}`);
    console.error(err.stack);
  });
  conn.on('disconnected', () => console.warn('[事件] disconnected → 连接已断开'));
  conn.on('reconnected', () => console.log('[事件] reconnected → 已自动重连'));
  conn.on('close', () => console.log('[事件] close → 连接已关闭'));
}

// 带退避重试的连接，覆盖瞬时网络抖动
async function connectWithRetry(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[连接] 第 ${attempt}/${retries} 次尝试…`);
      await mongoose.connect(mongoUri, CONNECT_OPTIONS);
      return;
    } catch (err) {
      console.error(`[连接] 失败原因：${classifyError(err)}`);
      console.error(err.stack);
      if (attempt === retries) {
        throw err;
      }
      const wait = 2000 * attempt;
      console.log(`[连接] ${wait}ms 后重试…`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

// ==================== 2. 种子数据 ====================

const authors = [
  { first_name: 'John', family_name: 'Doe', date_of_birth: '1970-01-01' },
  { first_name: 'Jane', family_name: 'Smith', date_of_birth: '1980-05-15' },
  { first_name: 'Bob', family_name: 'Brown', date_of_birth: '1965-11-30' },
];

const genres = [{ name: 'Fantasy' }, { name: 'Science Fiction' }, { name: 'History' }, { name: 'Poetry' }];

const books = [
  {
    title: 'The Fantasy Book',
    summary: 'A wonderful fantasy adventure story.',
    isbn: '9781234567890',
    author: null,
    genre: [],
  },
  {
    title: 'Space Journey',
    summary: 'Travel across the galaxy.',
    isbn: '9781234567891',
    author: null,
    genre: [],
  },
  {
    title: 'Ancient Times',
    summary: 'Stories from old history.',
    isbn: '9781234567892',
    author: null,
    genre: [],
  },
];

const bookinstances = [
  { imprint: 'First Edition Press', status: 'Available', due_back: '2026-12-01', book: null },
  { imprint: 'Second Print House', status: 'Loaned', due_back: '2026-11-10', book: null },
  { imprint: 'Old Book Publisher', status: 'Maintenance', due_back: null, book: null },
];

const EXPECTED_COUNTS = { authors: 3, genres: 4, books: 3, bookinstances: 3 };
const STATUS_ENUM = ['Available', 'Maintenance', 'Loaned', 'Reserved'];

// ==================== 3. 写入 ====================

async function insertOne(Model, data, label) {
  const doc = await Model.create(data);
  console.log(`  ✓ ${label} 写入成功  _id=${doc._id}`);
  return doc;
}

async function seedDB() {
  console.log('\n[清空] 删除四个集合的旧数据…');
  const removed = await Promise.all([
    Author.deleteMany({}),
    Genre.deleteMany({}),
    Book.deleteMany({}),
    BookInstance.deleteMany({}),
  ]);
  console.log(
    `[清空] 完成  authors=${removed[0].deletedCount} genres=${removed[1].deletedCount} ` +
      `books=${removed[2].deletedCount} bookinstances=${removed[3].deletedCount}`
  );

  console.log('\n[写入] 作者');
  const savedAuthors = [];
  for (const a of authors) {
    savedAuthors.push(await insertOne(Author, a, `Author ${a.first_name} ${a.family_name}`));
  }

  console.log('\n[写入] 分类');
  const savedGenres = [];
  for (const g of genres) {
    savedGenres.push(await insertOne(Genre, g, `Genre ${g.name}`));
  }

  console.log('\n[写入] 图书');
  books[0].author = savedAuthors[0]._id;
  books[0].genre = [savedGenres[0]._id];
  books[1].author = savedAuthors[1]._id;
  books[1].genre = [savedGenres[1]._id];
  books[2].author = savedAuthors[2]._id;
  books[2].genre = [savedGenres[2]._id];

  const savedBooks = [];
  for (const b of books) {
    savedBooks.push(await insertOne(Book, b, `Book ${b.title}`));
  }

  console.log('\n[写入] 藏书副本');
  bookinstances[0].book = savedBooks[0]._id;
  bookinstances[1].book = savedBooks[1]._id;
  bookinstances[2].book = savedBooks[2]._id;

  for (const bi of bookinstances) {
    await insertOne(BookInstance, bi, `BookInstance ${bi.imprint} (${bi.status})`);
  }
}

// ==================== 4. 数据校验 ====================

function push(problems, cond, message) {
  if (!cond) problems.push(message);
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

async function validateData() {
  console.log('\n[校验] 开始数据校验…');
  const problems = [];

  // 4.1 文档数量
  const counts = {
    authors: await Author.countDocuments({}),
    genres: await Genre.countDocuments({}),
    books: await Book.countDocuments({}),
    bookinstances: await BookInstance.countDocuments({}),
  };
  for (const [key, expected] of Object.entries(EXPECTED_COUNTS)) {
    const ok = counts[key] === expected;
    console.log(`  ${ok ? '✓' : '✗'} ${key} 数量 ${counts[key]} / 预期 ${expected}`);
    push(problems, ok, `${key} 数量不符：实际 ${counts[key]}，预期 ${expected}`);
  }

  // 4.2 作者字段
  const authorDocs = await Author.find({}).lean();
  const authorIds = new Set(authorDocs.map((d) => String(d._id)));
  authorDocs.forEach((d, i) => {
    push(problems, isNonEmptyString(d.first_name), `authors[${i}].first_name 缺失或类型错误`);
    push(problems, isNonEmptyString(d.family_name), `authors[${i}].family_name 缺失或类型错误`);
    push(
      problems,
      d.date_of_birth === null || d.date_of_birth instanceof Date,
      `authors[${i}].date_of_birth 应为 Date`
    );
  });
  console.log(`  作者字段检查完成（${authorDocs.length} 条）`);

  // 4.3 分类字段
  const genreDocs = await Genre.find({}).lean();
  const genreIds = new Set(genreDocs.map((d) => String(d._id)));
  genreDocs.forEach((d, i) => {
    push(problems, isNonEmptyString(d.name), `genres[${i}].name 缺失或类型错误`);
    push(problems, isNonEmptyString(d.name) && d.name.length >= 3, `genres[${i}].name 长度小于 3`);
  });
  console.log(`  分类字段检查完成（${genreDocs.length} 条）`);

  // 4.4 图书字段与外键
  const bookDocs = await Book.find({}).lean();
  const bookIds = new Set(bookDocs.map((d) => String(d._id)));
  bookDocs.forEach((d, i) => {
    push(problems, isNonEmptyString(d.title), `books[${i}].title 缺失或类型错误`);
    push(problems, isNonEmptyString(d.summary), `books[${i}].summary 缺失或类型错误`);
    push(problems, isNonEmptyString(d.isbn), `books[${i}].isbn 缺失或类型错误`);
    push(problems, d.author instanceof mongoose.Types.ObjectId, `books[${i}].author 应为 ObjectId`);
    push(problems, authorIds.has(String(d.author)), `books[${i}].author 引用了不存在的作者`);
    push(problems, Array.isArray(d.genre), `books[${i}].genre 应为数组`);
    (d.genre || []).forEach((gid, j) => {
      push(problems, gid instanceof mongoose.Types.ObjectId, `books[${i}].genre[${j}] 应为 ObjectId`);
      push(problems, genreIds.has(String(gid)), `books[${i}].genre[${j}] 引用了不存在的分类`);
    });
  });
  console.log(`  图书字段与外键检查完成（${bookDocs.length} 条）`);

  // 4.5 副本字段与外键
  const instDocs = await BookInstance.find({}).lean();
  instDocs.forEach((d, i) => {
    push(problems, d.book instanceof mongoose.Types.ObjectId, `bookinstances[${i}].book 应为 ObjectId`);
    push(problems, bookIds.has(String(d.book)), `bookinstances[${i}].book 引用了不存在的图书`);
    push(problems, isNonEmptyString(d.imprint), `bookinstances[${i}].imprint 缺失或类型错误`);
    push(problems, STATUS_ENUM.includes(d.status), `bookinstances[${i}].status 不在枚举范围内`);
    push(
      problems,
      d.due_back === null || d.due_back instanceof Date,
      `bookinstances[${i}].due_back 应为 Date 或 null`
    );
  });
  console.log(`  副本字段与外键检查完成（${instDocs.length} 条）`);

  if (problems.length > 0) {
    console.error(`\n[校验] ✗ 发现 ${problems.length} 个问题：`);
    problems.forEach((p) => console.error(`   - ${p}`));
    return false;
  }

  console.log('\n[校验] ✓ 全部通过：数量、字段结构、数据类型、必填字段、外键引用均符合预期');
  return true;
}

// ==================== 5. 主流程 ====================

async function main() {
  console.log('========================================');
  console.log(`运行环境：${process.env.NODE_ENV || '未设置'}`);
  console.log(`连接来源：${cliUri ? '命令行参数' : '.env 按 NODE_ENV 选择'}`);
  console.log(`目标地址：${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
  console.log('========================================');

  registerConnectionEvents();
  await connectWithRetry();
  console.log('✅ 数据库连接成功\n');

  await seedDB();

  const ok = await validateData();
  if (!ok) {
    console.error('❌ 数据校验未通过，终止');
    process.exit(1);
  }

  console.log('\n🎉 种子数据导入并校验完成');
  console.log(`🔗 连接保持活跃，未主动关闭（readyState=${mongoose.connection.readyState}，1=已连接）`);
  console.log('   按 Ctrl+C 结束进程');
}

main().catch((err) => {
  console.error('\n❌ 执行中断');
  console.error(`原因：${classifyError(err)}`);
  console.error(err.stack);
  process.exit(1);
});
