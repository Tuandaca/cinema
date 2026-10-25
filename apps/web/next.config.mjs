import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function precreateDirs() {
  const appSrc = path.join(__dirname, 'src/app');
  const prefixes = [
    path.join(__dirname, '.next/server/app'),
    path.join(__dirname, '.next/types/app'),
    path.join(__dirname, '.next/static/chunks/app'),
  ];

  function walk(dir, rel = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subRel = rel ? `${rel}/${entry.name}` : entry.name;
        for (const prefix of prefixes) {
          const target = path.join(prefix, subRel);
          try {
            fs.mkdirSync(target, { recursive: true });
          } catch {}
        }
        walk(path.join(dir, entry.name), subRel);
      }
    }
  }

  for (const prefix of prefixes) {
    try {
      fs.mkdirSync(prefix, { recursive: true });
    } catch {}
  }
  walk(appSrc);
}

// Pre-create at module load
precreateDirs();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config) => {
    precreateDirs();
    return config;
  },
  async rewrites() {
    const apiBase = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3006/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
