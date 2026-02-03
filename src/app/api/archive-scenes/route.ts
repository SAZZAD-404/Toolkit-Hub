import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { scenes, metadata, format, zipVariant } = await req.json();
    
    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json({ error: "Invalid scenes data" }, { status: 400 });
    }

    const formatSceneJson = (scene: any) => {
      return JSON.stringify(scene, null, 2);
    };

    const formatSceneText = (scene: any) => {
      // Best-effort human-readable text export (falls back gracefully)
      const n = scene?.scene_number ?? '';
      const title = scene?.title ?? '';
      const hook = scene?.hook ?? '';
      const narration = scene?.narration ?? scene?.voiceover ?? scene?.voice_over ?? scene?.dialogue ?? '';
      const description = scene?.description ?? scene?.scene_description ?? '';

      const visuals = scene?.visuals || {};
      const subject = visuals?.subject ?? '';
      const environment = visuals?.environment ?? '';
      const prompt = visuals?.prompt ?? scene?.prompt ?? scene?.image_prompt ?? '';

      const lines: string[] = [];
      lines.push(`SCENE ${n}`);
      if (title) lines.push(`TITLE: ${String(title).trim()}`);
      if (hook) lines.push(`HOOK: ${String(hook).trim()}`);
      if (description) {
        lines.push('');
        lines.push('DESCRIPTION:');
        lines.push(String(description).trim());
      }
      if (narration) {
        lines.push('');
        lines.push('NARRATION / VOICEOVER:');
        lines.push(String(narration).trim());
      }
      if (subject || environment) {
        lines.push('');
        lines.push('VISUALS:');
        if (subject) lines.push(`- Subject: ${String(subject).trim()}`);
        if (environment) lines.push(`- Environment: ${String(environment).trim()}`);
      }
      if (prompt) {
        lines.push('');
        lines.push('PROMPT:');
        lines.push(String(prompt).trim());
      }

      if (lines.length <= 1) {
        // Nothing meaningful; last-resort fallback
        return formatSceneJson(scene);
      }

      return lines.join('\n');
    };

    if (format === 'text') {
      // If Text→Image→Video pipeline is active, export ONLY the prompt-pack as text.
      const pipeline = metadata?.pipeline;
      if (pipeline?.mode === 'tti-i2v') {
        const toMMSS = (sec: number) => {
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        const tti = Array.isArray(pipeline?.text_to_image) ? pipeline.text_to_image : [];
        const i2v = Array.isArray(pipeline?.image_to_video) ? pipeline.image_to_video : [];
        const byScene = (arr: any[], sceneNumber: number) => arr.find(x => Number(x.scene_number) === Number(sceneNumber));

        const lines: string[] = [];
        // Header (exact format requested)
        lines.push(`TITLE: ${String(metadata?.title || '').trim()}`);
        lines.push(`SNAPSHOT: ${String(metadata?.synopsis || '').trim()}`);
        lines.push('RHYTHM: ');
        lines.push('RETENTION: ');
        lines.push('');

        scenes.forEach((scene: any) => {
          const n = Number(scene?.scene_number) || 1;
          const start = (n - 1) * 8;
          const end = start + 8;
          const range = `${toMMSS(start)}–${toMMSS(end)}`;

          const ttiRow = byScene(tti, n);
          const i2vRow = byScene(i2v, n);

          const imgPrompt = String(ttiRow?.prompt || '').trim();
          const vidPrompt = String(i2vRow?.prompt || '').trim();

          lines.push(`Scene ${n} (${range})`);
          lines.push('----------');
          lines.push(`TEXT-TO-IMAGE: ${imgPrompt}`);
          lines.push('--------------------------------------------------------------------------------------------------------------------------------');
          lines.push(`IMAGE-TO-VIDEO: ${vidPrompt}`);
          lines.push('');
        });

        const content = lines.join('\n');
        return new NextResponse(content, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename=${(metadata?.title || 'prompt-pack').replace(/\s+/g, '-').toLowerCase()}.txt`
          }
        });
      }

      // Default: export the raw data (kept for Format 1)
      const fullData = {
        metadata: metadata || {},
        scenes: scenes
      };

      const jsonContent = JSON.stringify(fullData, null, 2);

      return new NextResponse(jsonContent, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=${(metadata?.title || 'script').replace(/\s+/g, '-').toLowerCase()}.txt`
        }
      });
    }

    // Dynamic import for JSZip to avoid build issues
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Use script title as the folder name inside the zip
    const rawTitle = String(metadata?.title || 'script');
    const safeTitle = rawTitle
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '-');
    const folderName = safeTitle || 'script';

    const root = zip.folder(folderName) || zip;

    // Always include a small README so the zip is never empty.
    root.file(
      'README.txt',
      `Export generated by ToolkitHub\nTitle: ${rawTitle}\nScenes: ${scenes.length}\nMode: ${String(metadata?.pipeline?.mode || 'text-to-video')}\n`
    );

    // Add Story Metadata (JSON)
    if (metadata) {
      root.file("000-story-overview.txt", JSON.stringify(metadata, null, 2));
    }

    // SEO pack + thumbnail prompt (single text file named as the title)
    const first = scenes?.[0];
    const last = scenes?.[scenes.length - 1];

    const safeTextFileName = `${folderName}.txt`;

    const synopsis = String(metadata?.synopsis || '').trim();
    const hook = String(metadata?.hook || '').trim();
    const cta = String(metadata?.cta || '').trim();

    // YouTube best practice: keep title <= 70 characters
    const rawSeoTitle = rawTitle.trim() || 'Script';
    const seoTitle = rawSeoTitle.length <= 70
      ? rawSeoTitle
      : rawSeoTitle.slice(0, 67).trimEnd() + '...';

    const subject = String(first?.visuals?.subject || '').trim();
    const environment = String(first?.visuals?.environment || '').trim();
    const endingEnv = String(last?.visuals?.environment || '').trim();

    // Build an SEO-ish YouTube description (deterministic, no extra AI cost)
    const keywords = Array.from(
      new Set(
        [
          // strong keywords
          'cinematic',
          'story',
          'short film',
          'ai video',
          'faceless video',
          // rescue/car/cooking niches can override via title
          ...seoTitle
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 20)
        ]
      )
    ).slice(0, 25);

    const tagsArr = Array.from(
      new Set(
        [
          ...keywords,
          ...(Array.isArray(metadata?.hashtags)
            ? metadata.hashtags.map((h: any) => String(h).replace(/^#/, '').toLowerCase())
            : [])
        ]
      )
    )
      .filter(Boolean)
      .slice(0, 40);

    // YouTube tags limit is ~500 characters total. Keep a safe margin.
    const tags: string[] = [];
    let tagChars = 0;
    for (const t of tagsArr) {
      const piece = (tags.length ? ', ' : '') + t;
      if (tagChars + piece.length > 450) break;
      tags.push(t);
      tagChars += piece.length;
    }

    // YouTube: keep hashtags small (best practice: 1–3)
    const hashtags = (Array.isArray(metadata?.hashtags) ? metadata.hashtags : [])
      .map((h: any) => {
        const s = String(h).trim();
        if (!s) return '';
        return s.startsWith('#') ? s : `#${s}`;
      })
      .filter(Boolean)
      .slice(0, 3)
      .join(' ');

    const descriptionLines: string[] = [];
    descriptionLines.push(`TITLE (<=70 chars): ${seoTitle}`);
    descriptionLines.push('');
    descriptionLines.push('YOUTUBE DESCRIPTION (SEO-Optimized):');
    // Use a strong first line for SEO/CTR
    if (hook) descriptionLines.push(hook);
    if (synopsis) descriptionLines.push(synopsis);
    if (subject || environment) {
      const loc = [environment, endingEnv].filter(Boolean).slice(0, 2).join(' → ');
      descriptionLines.push('');
      descriptionLines.push(`What you\'ll see: ${[subject, loc].filter(Boolean).join(' | ')}`);
    }
    descriptionLines.push('');
    descriptionLines.push('Subscribe for more cinematic, retention-first faceless stories.');
    if (cta) {
      descriptionLines.push('');
      descriptionLines.push(cta);
    }
    if (hashtags) {
      descriptionLines.push('');
      descriptionLines.push(hashtags);
    }

    descriptionLines.push('');
    descriptionLines.push('YOUTUBE TAGS (comma-separated, <=500 chars recommended):');
    descriptionLines.push(tags.join(', '));

    // Thumbnail prompt (Text-to-Image)
    descriptionLines.push('');
    descriptionLines.push('THUMBNAIL PROMPT (Text-to-Image, SEO/CTR optimized):');
    descriptionLines.push(
      [
        `Create a YouTube thumbnail for: "${seoTitle}".`,
        'Style: ultra-realistic cinematic still, high contrast, sharp details, professional color grading.',
        'Composition: one clear subject, strong emotion, simple readable silhouette, rule-of-thirds, shallow depth of field.',
        subject ? `Main subject: ${subject}.` : 'Main subject: the key character/object from the story.',
        environment ? `Setting: ${environment}.` : 'Setting: environment that matches the story.',
        'Lighting: dramatic rim light + soft key, clean highlights.',
        'Do NOT include text, logos, watermarks, subtitles, or extra limbs. No messy background clutter.',
        'Goal: maximum click-through rate while staying truthful to the story.'
      ].join(' ')
    );

    root.file(safeTextFileName, descriptionLines.join('\n'));

    // If the user chose Text→Image→Video mode, also export a single prompt-pack file
    const pipeline = metadata?.pipeline;
    if (pipeline?.mode === 'tti-i2v') {
      const toMMSS = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      };

      const tti = Array.isArray(pipeline?.text_to_image) ? pipeline.text_to_image : [];
      const i2v = Array.isArray(pipeline?.image_to_video) ? pipeline.image_to_video : [];

      const byScene = (arr: any[], sceneNumber: number) => arr.find(x => Number(x.scene_number) === Number(sceneNumber));

      const lines: string[] = [];

      // Header (exact format requested)
      lines.push(`TITLE: ${String(metadata?.title || '').trim()}`);
      lines.push(`SNAPSHOT: ${String(metadata?.synopsis || '').trim()}`);
      lines.push('RHYTHM: ');
      lines.push('RETENTION: ');
      lines.push('');

      scenes.forEach((scene: any) => {
        const n = Number(scene.scene_number) || 1;
        const start = (n - 1) * 8;
        const end = start + 8;
        const range = `${toMMSS(start)}–${toMMSS(end)}`;

        const ttiRow = byScene(tti, n);
        const i2vRow = byScene(i2v, n);

        const imgPrompt = String(ttiRow?.prompt || '').trim();
        const vidPrompt = String(i2vRow?.prompt || '').trim();

        lines.push(`Scene ${n} (${range})`);
        lines.push('----------');
        lines.push(`TEXT-TO-IMAGE: ${imgPrompt}`);
        lines.push('--------------------------------------------------------------------------------------------------------------------------------');
        lines.push(`IMAGE-TO-VIDEO: ${vidPrompt}`);
        lines.push('');
      });

      root.file(`001-prompt-pack.txt`, lines.join('\n'));
    }

    // Scene files
    // zipVariant controls what we put in the zip:
    // - "zip-text-json": include JSON (full + per-scene)
    // - "zip-text-text": include human-readable text per scene
    // Default (back-compat): previous behavior

    if (!(pipeline?.mode === 'tti-i2v')) {
      if (zipVariant === 'zip-text-json') {
        // User meaning: TEXT files that contain JSON inside
        root.file('scenes.txt', JSON.stringify({ metadata: metadata || {}, scenes }, null, 2));
        scenes.forEach((scene: any) => {
          const num = String(scene.scene_number).padStart(3, '0');
          root.file(`scene-${num}.txt`, formatSceneJson(scene));
        });
      } else if (zipVariant === 'zip-text-text') {
        // Per-scene human-readable TXT files
        scenes.forEach((scene: any) => {
          const num = String(scene.scene_number).padStart(3, '0');
          root.file(`scene-${num}.txt`, formatSceneText(scene));
        });
      } else {
        // Back-compat: keep old behavior (scene TXT contained JSON)
        scenes.forEach((scene: any) => {
          const num = String(scene.scene_number).padStart(3, '0');
          root.file(`scene-${num}.txt`, formatSceneJson(scene));
        });
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    return new NextResponse(Buffer.from(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${folderName}.zip`
      }
    });
  } catch (error: any) {
    console.error("ZIP Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate archive" }, { status: 500 });
  }
}