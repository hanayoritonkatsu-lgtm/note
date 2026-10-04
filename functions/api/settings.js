export async function onRequestGet(context) {
  // 設定保存用テーブル (settings: key, value)
  try {
    const row = await context.env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'project_spec' LIMIT 1"
    ).first();
    return Response.json({ text: row ? row.value : null });
  } catch (e) {
    return Response.json({ text: null });
  }
}

export async function onRequestPost(context) {
  try {
    const { text } = await context.request.json();
    await context.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `).run();

    await context.env.DB.prepare(`
      INSERT INTO settings (key, value) VALUES ('project_spec', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind(text).run();

    return Response.json({ success: true });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
