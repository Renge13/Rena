/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router. The shared `public/` directory serves static assets.

  // Stage 5 reads docs/content/renderer-prompt.txt at runtime (lib/render/prompt.js).
  // A `.txt` has no import form the bundler can follow the way `glossary.json` is
  // followed, so the file is traced explicitly. Without this the file is absent from
  // the serverless bundle and the renderer throws ENOENT on the first cache miss in
  // production while working perfectly in dev.
  outputFileTracingIncludes: {
    // BOTH prompts. The pair prompt is READ AT RUNTIME exactly like the
    // mirror's, so a missing trace entry is a deploy that throws at module load
    // on every route touching the render chain - the failure the mirror entry's
    // own comment in lib/render/prompt.js describes.
    '/api/**/*': [
      './docs/content/renderer-prompt.txt',
      './docs/content/compat-renderer-prompt.txt',
    ],
  },
};

export default nextConfig;
