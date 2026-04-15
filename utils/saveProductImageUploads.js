import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.join(__dirname, '..', 'public', 'img');
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

/**
 * Saves req.files.imageFiles (express-fileupload) into public/img/.
 * @returns {Promise<string[]>} Filenames (e.g. upload_123_0_apple.jpg) suitable for Product.images
 */
export default async function saveProductImageUploads(req) {
    if (!req.files || !req.files.imageFiles) {
        return [];
    }
    let list = req.files.imageFiles;
    if (!Array.isArray(list)) {
        list = [list];
    }
    const saved = [];
    for (let i = 0; i < list.length; i++) {
        const file = list[i];
        if (!file || !file.name) {
            continue;
        }
        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXT.has(ext)) {
            continue;
        }
        const base =
            path
                .basename(file.name, ext)
                .replace(/[^a-zA-Z0-9_-]/g, '_')
                .slice(0, 48) || 'image';
        const filename = `upload_${Date.now()}_${i}_${base}${ext}`;
        const dest = path.join(IMG_DIR, filename);
        await file.mv(dest);
        saved.push(filename);
    }
    return saved;
}
