import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_IMG_DIR = path.join(__dirname, '..', 'public', 'img');

/** Filenames we never unlink (shared stock assets). */
const NEVER_DELETE = new Set(['default.jpg']);

/**
 * After a product is removed, delete matching files under public/img when no other
 * product still references the filename. Skips remote URLs and protected names.
 * @param {string[]|string|undefined} imagesField - product.images from the deleted document
 */
export default async function deleteProductImageFilesIfUnused(imagesField) {
    const list = Array.isArray(imagesField)
        ? imagesField
        : imagesField
          ? [imagesField]
          : [];

    for (const raw of list) {
        if (!raw || typeof raw !== 'string') {
            continue;
        }
        const trimmed = raw.trim();
        if (/^https?:\/\//i.test(trimmed)) {
            continue;
        }
        const base = path.basename(trimmed);
        if (!base || base === '.' || base === '..' || NEVER_DELETE.has(base)) {
            continue;
        }

        const others = await Product.countDocuments({ images: base });
        if (others > 0) {
            continue;
        }

        const absPath = path.resolve(PUBLIC_IMG_DIR, base);
        const resolvedDir = path.resolve(PUBLIC_IMG_DIR);
        const rel = path.relative(resolvedDir, absPath);
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
            continue;
        }

        try {
            await fs.unlink(absPath);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error('deleteProductImageFilesIfUnused:', absPath, err.message);
            }
        }
    }
}
