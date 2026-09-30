export async function onRequestGet(context) {
  const { results } = await context.env.DB.prepare(
    "SELECT * FROM ideas ORDER BY created_at DESC"
  ).all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const data = await context.request.json();
  const id = data.id || Date.now().toString();
  const created_at = new Date().toISOString();
  
  await context.env.DB.prepare(`
    INSERT INTO ideas (id, title, body, category, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      body = excluded.body,
      category = excluded.category,
      status = excluded.status
  `).bind(id, data.title, data.body, data.category, data.status, created_at).run();

  return Response.json({ success: true, id });
}

export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  await context.env.DB.prepare("DELETE FROM ideas WHERE id = ?").bind(id).run();
  return Response.json({ success: true });
}
