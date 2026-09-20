import { Pool } from '@neondatabase/serverless';

const MAX_BODY_BYTES = 50 * 1024 * 1024;

let pool;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.');
  }

  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  return pool;
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('content-length', Buffer.byteLength(payload));
  res.end(payload);
}

function getPath(req) {
  const host = req.headers.host ?? 'localhost';
  return new URL(req.url ?? '/', `http://${host}`).pathname;
}

function readJson(req) {
  // Vercel's Node runtime parses the body for us and leaves the request stream
  // drained, so listening for 'data' there would hang until the function times
  // out. Vite's middleware and server.mjs hand us an untouched stream instead.
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      if (req.body === '') return Promise.resolve(null);
      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch {
        return Promise.reject(new Error('Request body must be valid JSON.'));
      }
    }
    if (Buffer.isBuffer(req.body)) {
      if (req.body.length === 0) return Promise.resolve(null);
      try {
        return Promise.resolve(JSON.parse(req.body.toString('utf8')));
      } catch {
        return Promise.reject(new Error('Request body must be valid JSON.'));
      }
    }
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body is too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });

    req.on('error', reject);
  });
}

function methodNotAllowed(res) {
  sendJson(res, 405, { error: 'Method not allowed.' });
}

function notFound(res) {
  sendJson(res, 404, { error: 'Not found.' });
}

function rowToPack(row, questions) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    questions: questions.map((q, i) => ({
      id: i + 1,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
      correctIndex: q.correct_index,
      difficulty: ['medium', 'hard', 'expert'].includes(q.difficulty) ? q.difficulty : 'medium',
      topic: q.topic,
      explanation: q.explanation ?? undefined,
      image: q.image ?? undefined,
      imageAlt: q.image_alt ?? undefined,
    })),
  };
}

async function loadPacks(res) {
  const db = getPool();
  const { rows: packs } = await db.query(
    'select id, name, description, author, created_at from public.packs order by created_at desc',
  );

  if (packs.length === 0) {
    sendJson(res, 200, []);
    return;
  }

  const ids = packs.map((pack) => pack.id);
  const { rows: questions } = await db.query(
    `select pack_id, position, question, options, correct_index, difficulty, topic, explanation, image, image_alt
     from public.questions
     where pack_id = any($1)
     order by pack_id, position`,
    [ids],
  );

  const questionsByPack = new Map();
  for (const question of questions) {
    const list = questionsByPack.get(question.pack_id) ?? [];
    list.push(question);
    questionsByPack.set(question.pack_id, list);
  }

  sendJson(
    res,
    200,
    packs.map((pack) => rowToPack(pack, questionsByPack.get(pack.id) ?? [])),
  );
}

/**
 * Insert questions as one multi-row statement instead of a query per question.
 * A 260-question pack is otherwise 260 round trips, which is slow enough to
 * risk the serverless function timeout.
 */
async function insertQuestions(client, packId, questions, startPosition) {
  if (questions.length === 0) return;

  const columns = 10;
  const values = [];
  const tuples = questions.map((question, i) => {
    const base = i * columns;
    values.push(
      packId,
      startPosition + i,
      question.question,
      JSON.stringify(question.options ?? []),
      question.correctIndex,
      question.difficulty ?? 'medium',
      question.topic ?? 'General',
      question.explanation ?? null,
      question.image ?? null,
      question.imageAlt ?? null,
    );
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}::jsonb, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10})`;
  });

  await client.query(
    `insert into public.questions
     (pack_id, position, question, options, correct_index, difficulty, topic, explanation, image, image_alt)
     values ${tuples.join(', ')}`,
    values,
  );
}

async function savePack(req, res) {
  const pack = await readJson(req);
  if (!pack?.id || !pack?.name || !Array.isArray(pack.questions)) {
    sendJson(res, 400, { error: 'Pack must include id, name, and questions.' });
    return;
  }

  const db = getPool();
  const client = await db.connect();

  try {
    await client.query('begin');
    await client.query(
      `insert into public.packs (id, name, description, author, builtin, created_at)
       values ($1, $2, $3, $4, false, $5)
       on conflict (id) do update
       set name = excluded.name,
           description = excluded.description,
           author = excluded.author,
           builtin = false,
           created_at = excluded.created_at`,
      [
        pack.id,
        pack.name,
        pack.description ?? null,
        pack.author ?? null,
        new Date(pack.createdAt ?? Date.now()).toISOString(),
      ],
    );
    await client.query('delete from public.questions where pack_id = $1', [pack.id]);
    await insertQuestions(client, pack.id, pack.questions, 0);

    await client.query('commit');
    sendJson(res, 200, { ok: true });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Append a further batch of questions to a pack that already exists.
 *
 * Vercel caps a request body at 4.5 MB, and image-heavy packs go past that, so
 * the client sends the pack head first and streams the rest through here.
 * Positions continue from whatever is already stored.
 */
async function appendQuestions(req, res, packId) {
  const body = await readJson(req);
  if (!Array.isArray(body?.questions)) {
    sendJson(res, 400, { error: 'Body must include a questions array.' });
    return;
  }

  const db = getPool();
  const client = await db.connect();

  try {
    await client.query('begin');

    const { rows } = await client.query(
      'select id from public.packs where id = $1 for update',
      [packId],
    );
    if (rows.length === 0) {
      await client.query('rollback');
      sendJson(res, 404, { error: 'Pack not found. Save the pack before appending questions.' });
      return;
    }

    const { rows: next } = await client.query(
      'select coalesce(max(position) + 1, 0) as start from public.questions where pack_id = $1',
      [packId],
    );

    await insertQuestions(client, packId, body.questions, Number(next[0].start));
    await client.query('commit');
    sendJson(res, 200, { ok: true });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function deletePack(path, res) {
  const id = decodeURIComponent(path.slice('/api/packs/'.length));
  if (!id) {
    sendJson(res, 400, { error: 'Pack id is required.' });
    return;
  }

  await getPool().query('delete from public.packs where id = $1', [id]);
  sendJson(res, 200, { ok: true });
}

async function saveAttempt(req, res) {
  const attempt = await readJson(req);
  if (!attempt?.studentName || !attempt?.packId || !attempt?.packName) {
    sendJson(res, 400, { error: 'Attempt must include studentName, packId, and packName.' });
    return;
  }

  await getPool().query(
    `insert into public.attempts
     (student_name, pack_id, pack_name, total, correct, wrong, skipped, percentage, duration_seconds)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      attempt.studentName,
      attempt.packId,
      attempt.packName,
      attempt.total,
      attempt.correct,
      attempt.wrong,
      attempt.skipped,
      attempt.percentage,
      attempt.durationSeconds,
    ],
  );

  sendJson(res, 200, { ok: true });
}

async function loadAttempts(res) {
  const { rows } = await getPool().query(
    `select id, student_name, pack_id, pack_name, total, correct, wrong, skipped, percentage,
            duration_seconds, created_at
     from public.attempts
     order by created_at desc`,
  );

  sendJson(
    res,
    200,
    rows.map((row) => ({
      id: row.id,
      studentName: row.student_name,
      packId: row.pack_id,
      packName: row.pack_name,
      total: row.total,
      correct: row.correct,
      wrong: row.wrong,
      skipped: row.skipped,
      percentage: row.percentage,
      durationSeconds: row.duration_seconds,
      createdAt: new Date(row.created_at).getTime(),
    })),
  );
}

export async function handleApiRequest(req, res, pathOverride) {
  const path = pathOverride ?? getPath(req);

  try {
    if (path === '/api/health') {
      sendJson(res, 200, { ok: true });
      return true;
    }

    if (path === '/api/packs') {
      if (req.method === 'GET') await loadPacks(res);
      else if (req.method === 'PUT' || req.method === 'POST') await savePack(req, res);
      else methodNotAllowed(res);
      return true;
    }

    if (path.endsWith('/questions') && path.startsWith('/api/packs/')) {
      const id = decodeURIComponent(path.slice('/api/packs/'.length, -'/questions'.length));
      if (!id) notFound(res);
      else if (req.method === 'POST') await appendQuestions(req, res, id);
      else methodNotAllowed(res);
      return true;
    }

    if (path.startsWith('/api/packs/')) {
      if (req.method === 'DELETE') await deletePack(path, res);
      else methodNotAllowed(res);
      return true;
    }

    if (path === '/api/attempts') {
      if (req.method === 'GET') await loadAttempts(res);
      else if (req.method === 'POST') await saveAttempt(req, res);
      else methodNotAllowed(res);
      return true;
    }

    if (path.startsWith('/api/')) {
      notFound(res);
      return true;
    }

    return false;
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unexpected server error.' });
    return true;
  }
}
