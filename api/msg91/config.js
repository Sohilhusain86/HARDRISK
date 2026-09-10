export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "GET method required"
    });
  }

  const widgetId = process.env.MSG91_WIDGET_ID;
  const tokenAuth = process.env.MSG91_WIDGET_TOKEN;

  if (!widgetId || !tokenAuth) {
    console.error("[MSG91] Widget configuration missing");

    return res.status(500).json({
      success: false,
      error: "MSG91 Widget configuration missing"
    });
  }

  res.setHeader(
    "Cache-Control",
    "no-store, max-age=0"
  );

  return res.status(200).json({
    success: true,
    widgetId,
    tokenAuth
  });
}