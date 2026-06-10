import * as PIXI from 'pixi.js';

const gradientCache: { [key: string]: PIXI.Texture } = {};

export function getGradientTexture(color1: string, color2: string, width: number, height: number): PIXI.Texture {
    const key = `${color1}-${color2}-${width}-${height}`;
    if (gradientCache[key]) return gradientCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const grd = ctx.createLinearGradient(0, 0, 0, height);
        grd.addColorStop(0, color1);
        grd.addColorStop(1, color2);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);
    }
    const texture = PIXI.Texture.from(canvas);
    gradientCache[key] = texture;
    return texture;
}
