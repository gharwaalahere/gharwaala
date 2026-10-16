export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { image, prompt, token, structure = 'seg' } = body;

    // Use token from request body (user settings) or environment variable from Cloudflare
    const apiToken = token || env.REPLICATE_API_TOKEN || env.VITE_REPLICATE_API_TOKEN;

    if (!apiToken) {
      return new Response(JSON.stringify({
        error: "AI remodeling engine is temporarily initializing. Please try again shortly or contact our design team on WhatsApp."
      }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided for transformation." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. Create prediction on Replicate with adirik/interior-design (ControlNet)
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "76604baddc2f763d6616da07425184311d15aca7b049b4665f97da7579126de5",
        input: {
          image: image,
          prompt: prompt || "modern modular kitchen interior, luxury minimalist, 8k photo",
          structure: structure, // 'seg' preserves room segments, 'hough' preserves clean lines
          a_prompt: "best quality, extremely detailed, photo, 8k, modern luxury modular kitchen interior design, architectural digest",
          n_prompt: "low quality, bad quality, sketches, blurry, deformed, watermark, low resolution, messy"
        }
      })
    });

    const prediction = await createRes.json();
    if (prediction.error) {
      return new Response(JSON.stringify({ error: prediction.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Poll until prediction completes (up to 50 seconds within Cloudflare execution limits)
    let pollResult = prediction;
    const startTime = Date.now();
    while (pollResult.status !== "succeeded" && pollResult.status !== "failed" && pollResult.status !== "canceled") {
      if (Date.now() - startTime > 50000) {
        // Return prediction ID for client-side polling if it takes longer
        return new Response(JSON.stringify({
          id: pollResult.id,
          status: pollResult.status,
          pollUrl: `/api/transform?id=${pollResult.id}`
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      await new Promise(r => setTimeout(r, 1800));
      const checkRes = await fetch(`https://api.replicate.com/v1/predictions/${pollResult.id}`, {
        headers: { "Authorization": `Bearer ${apiToken}` }
      });
      pollResult = await checkRes.json();
    }

    if (pollResult.status === "succeeded") {
      const outputUrl = Array.isArray(pollResult.output)
        ? pollResult.output[pollResult.output.length - 1]
        : pollResult.output;

      return new Response(JSON.stringify({
        output: outputUrl,
        status: "succeeded"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      error: pollResult.error || "Replicate prediction failed or was canceled."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    const token = url.searchParams.get("token") || context.env.REPLICATE_API_TOKEN || context.env.VITE_REPLICATE_API_TOKEN;

    if (!id || !token) {
      return new Response(JSON.stringify({ error: "Missing id or token parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const checkRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await checkRes.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
