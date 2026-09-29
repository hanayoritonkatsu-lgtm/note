export async function onRequestGet(context) {
  const { results } = await context.env.DB.prepare(
    "SELECT * FROM ideas ORDER BY created_at DESC"
  ).all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const data = await context.request.json();
  const id = Date.now().toString();
  const created_at = new Date().toISOString();
  
  await context.env.DB.prepare(
    "INSERT INTO ideas (id, title, body, category, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, data.title, data.body, data.category, data.status, created_at).run();

  return Response.json({ success: true, id });
}