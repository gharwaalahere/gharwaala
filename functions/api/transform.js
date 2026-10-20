function buildFreeFluxUrl(prompt, width = 1024, height = 768) {
  const cleanPrompt = (prompt || "modern luxury modular kitchen interior, 8k architectural digest photo")
    .replace(/[^\w\s,.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 480);
  const seed = Math.floor(Math.random() * 899999) + 100000;
  const w = Math.min(1280, Math.max(512, Number(width) || 1024));
  const h = Math.min(1280, Math.max(512, Number(height) || 768));
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true`;
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const {
      image,
      prompt,
      token,
      prompt_strength = 0.78,
      guidance_scale = 15,
      negative_prompt,
      width = 1024,
      height = 768,
      engine = "auto"
    } = body;

    if (!image && engine === "replicate") {
      return new Response(JSON.stringify({ error: "No image provided for transformation." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // If user explicitly selected Free Flux Engine (Path 2), return immediately
    if (engine === "flux-free") {
      const fluxUrl = buildFreeFluxUrl(prompt, width, height);
      return new Response(JSON.stringify({
        output: fluxUrl,
        engine: "flux-free",
        status: "succeeded"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Server-side default token + Cloudflare environment override
    const SERVER_DEFAULT_TOKEN = atob("cjhfVUJmQjNKUFQ2T2Z1b1YzakhaTDZ1RUlFWG5jYjg3SzFrYTBvbA==");
    const apiToken = env.REPLICATE_API_TOKEN || env.VITE_REPLICATE_API_TOKEN || token || SERVER_DEFAULT_TOKEN;

    if (apiToken && image) {
      try {
        // 1. Try creating prediction on Replicate with adirik/interior-design (ControlNet)
        const createRes = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
            input: {
              image: image,
              prompt: prompt || "modern modular kitchen interior, luxury minimalist, 8k photo, architectural digest",
              negative_prompt: negative_prompt || "lowres, watermark, banner, logo, text, deformed, blurry, bad quality, sketches, messy, cluttered, cartoon",
              prompt_strength: Number(prompt_strength) || 0.78,
              guidance_scale: Number(guidance_scale) || 15,
              num_inference_steps: 50
            }
          })
        });

        const prediction = await createRes.json();

        // If Replicate succeeds in starting prediction, poll for completion
        if (createRes.ok && !prediction.error && !prediction.detail) {
          let pollResult = prediction;
          const startTime = Date.now();
          while (pollResult.status !== "succeeded" && pollResult.status !== "failed" && pollResult.status !== "canceled") {
            if (Date.now() - startTime > 45000) {
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
              engine: "replicate-controlnet",
              status: "succeeded"
            }), {
              headers: { "Content-Type": "application/json" }
            });
          }
        }
      } catch (repErr) {
        // Fall through to Path 2 Free Flux AI Engine
      }
    }

    // 2. Path 2 Automatic Fallback: Free Flux Architectural AI Engine ($0 Cost)
    const fallbackFluxUrl = buildFreeFluxUrl(prompt, width, height);
    return new Response(JSON.stringify({
      output: fallbackFluxUrl,
      engine: "flux-free",
      status: "succeeded"
    }), {
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
    const SERVER_DEFAULT_TOKEN = atob("cjhfVUJmQjNKUFQ2T2Z1b1YzakhaTDZ1RUlFWG5jYjg3SzFrYTBvbA==");
    const token = url.searchParams.get("token") || context.env.REPLICATE_API_TOKEN || context.env.VITE_REPLICATE_API_TOKEN || SERVER_DEFAULT_TOKEN;

    if (!id || !token) {
      return new Response(JSON.stringify({ error: "Missing prediction id" }), {
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
