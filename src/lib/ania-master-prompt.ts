export function buildAniaPrompt(topic: string, text: string): string {
  return `Create a professional, photorealistic 3D-rendered LinkedIn graphic in 16:9 landscape format, in the exact visual style of a luxury editorial business/procurement brand series.

VISUAL STYLE — FOLLOW EXACTLY:
- Central subject: one everyday object reimagined in polished gold/brass metal, photorealistic 3D render, cinematic studio lighting, shallow depth of field
- The object visually embodies the message/metaphor of the text (broken, chained, cracked, melting, on fire, unlocking — whatever fits the concept)
- Delicate gold chains, fragments, or dust particles floating near the object for dynamism (only if it fits the concept)
- Background: warm cream-to-champagne gradient, soft and perfectly clean — NO visible grain, NO pixelation, NO moiré pattern, NO compression artifacts, ultra-smooth, high resolution
- A thin gold horizontal line sits in the lower third of the frame, like the edge of a table, separating "stage" from background
- Blurred gold coins in soft bokeh focus, upper-right corner of the frame

TYPOGRAPHY — FOLLOW EXACTLY:
- Headline: bold serif font, aligned upper-left, dark navy-almost-black color (never pure black)
- If quote instead of headline: italic serif font in quotation marks, same dark navy color
- Bottom-right corner, always present: "Anna Iwanicka" on one line, "12+ Years in Indirect Procurement" below it, smaller serif font, same dark navy color
- Any text engraved onto the 3D object itself (labels, currency symbols, short words) must look naturally embossed into the metal, not pasted on top

QUALITY — NON-NEGOTIABLE:
- Ultra-high resolution, sharp focus on the main object
- Absolutely no pixelation, no JPEG artifacts, no grid/moiré texture in the background
- Premium editorial advertising quality, like a luxury brand campaign — not stock photo, not clipart, not illustration

CONTENT FOR THIS GRAPHIC:
Topic/concept: ${topic}
Exact text to display (do not alter wording): "${text}"`;
}
