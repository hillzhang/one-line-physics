import re

with open('src/main.ts', 'r') as f:
    content = f.read()

# 1. Base Shadow
old_base = """    // 1. Base & Border
    const base = new PIXI.Graphics();
    base.beginFill(0xFFFFFF);
    base.drawRoundedRect(0, 0, cardW, cardH, 20);
    base.endFill();
    card.addChild(base);"""

new_base = """    // 1. Base & Border
    const base = new PIXI.Graphics();
    
    // Soft elegant shadow
    base.beginFill(0x000000, 0.08);
    base.drawRoundedRect(0, 4, cardW, cardH, 20);
    base.endFill();

    base.beginFill(0xFFFFFF);
    base.drawRoundedRect(0, 0, cardW, cardH, 20);
    base.endFill();
    card.addChild(base);"""

content = content.replace(old_base, new_base)

# 2. Gradients
old_grad = """        const gradients: any = {
            tiles: ['#E8F5E9', '#C8E6C9'],
            emojis: ['#FFEBEE', '#FFCDD2'],
            bgs: ['#E3F2FD', '#BBDEFB'],
            vfx: ['#F3E5F5', '#E1BEE7'],
            props: ['#FFFDE7', '#FFF59D'],
            coins: ['#E0F7FA', '#B2EBF2']
        };"""

new_grad = """        const gradients: any = {
            tiles: ['#F1F8E9', '#DCEDC8'],
            emojis: ['#FCE4EC', '#F8BBD0'],
            bgs: ['#E1F5FE', '#B3E5FC'],
            vfx: ['#F3E5F5', '#E1BEE7'],
            props: ['#FFF8E1', '#FFECB3'],
            coins: ['#FFF3E0', '#FFE082']
        };"""

content = content.replace(old_grad, new_grad)

# 3. Props / Coins Icons
old_icons = """        } else if (category === 'props') {
            const iconContainer = new PIXI.Container();
            iconContainer.position.set(cardW / 2, cardH / 2 - 10);

            // Draw a beautiful glossy game tile
            const tileBase = new PIXI.Graphics();

            // Tile Shadow
            tileBase.beginFill(0x000000, 0.15);
            tileBase.drawRoundedRect(-32, -28, 64, 64, 16);
            tileBase.endFill();

            // Tile Body (Golden warm tint for props)
            tileBase.beginFill(0xFFE082);
            tileBase.lineStyle(2, 0xFFB300, 1);
            tileBase.drawRoundedRect(-32, -32, 64, 64, 16);
            tileBase.endFill();

            // Glossy Overlay
            tileBase.lineStyle(0);
            tileBase.beginFill(0xFFFFFF, 0.5);
            tileBase.drawRoundedRect(-28, -28, 56, 26, 10);
            tileBase.endFill();

            iconContainer.addChild(tileBase);

            const emojis: any = {
                'undo': '↩️',
                'extract': '⬆️',
                'shuffle': '🔀',
                'bundle': '🎁'
            };
            const previewText = new PIXI.Text(emojis[item.id] || '🎁', { fontSize: 36 });
            previewText.anchor.set(0.5);
            previewText.position.set(0, -2);
            // Enhance emoji with drop shadow
            previewText.filters = [new PIXI.filters.ColorMatrixFilter()]; // Placeholder to enable filtering safely
            previewText.style.dropShadow = true;
            previewText.style.dropShadowDistance = 2;
            previewText.style.dropShadowAlpha = 0.3;

            iconContainer.addChild(previewText);
            content.addChild(iconContainer);

        } else if (category === 'coins') {
            const iconContainer = new PIXI.Container();
            iconContainer.position.set(cardW / 2, cardH / 2 - 10);

            // Draw a glossy tile base for coins
            const tileBase = new PIXI.Graphics();
            const isAd = item.id === 'ad';

            tileBase.beginFill(0x000000, 0.15);
            tileBase.drawRoundedRect(-32, -28, 64, 64, 16);
            tileBase.endFill();

            tileBase.beginFill(isAd ? 0xEF9A9A : 0x81D4FA);
            tileBase.lineStyle(2, isAd ? 0xE53935 : 0x039BE5, 1);
            tileBase.drawRoundedRect(-32, -32, 64, 64, 16);
            tileBase.endFill();

            tileBase.lineStyle(0);
            tileBase.beginFill(0xFFFFFF, 0.5);
            tileBase.drawRoundedRect(-28, -28, 56, 26, 10);
            tileBase.endFill();

            iconContainer.addChild(tileBase);

            const emojis: any = {
                'ad': '📺',
                'share': '🤝'
            };
            const previewText = new PIXI.Text(emojis[item.id] || '🪙', { fontSize: 36 });
            previewText.anchor.set(0.5);
            previewText.position.set(0, -2);
            previewText.style.dropShadow = true;
            previewText.style.dropShadowDistance = 2;
            previewText.style.dropShadowAlpha = 0.3;

            iconContainer.addChild(previewText);
            content.addChild(iconContainer);
        }"""

new_icons = """        } else if (category === 'props' || category === 'coins') {
            const iconContainer = new PIXI.Container();
            iconContainer.position.set(cardW / 2, cardH / 2 - 12);

            // Draw an elegant glowing pedestal
            const glow = new PIXI.Graphics();
            const isAd = item.id === 'ad';
            const isShare = item.id === 'share';
            const baseColor = category === 'props' ? 0xFFCA28 : (isAd ? 0xFF8A65 : 0x29B6F6);
            
            glow.beginFill(baseColor, 0.15);
            glow.drawCircle(0, 0, 36);
            glow.beginFill(baseColor, 0.3);
            glow.drawCircle(0, 0, 26);
            glow.beginFill(0xFFFFFF, 0.8);
            glow.drawCircle(0, 0, 18);
            glow.endFill();
            iconContainer.addChild(glow);

            let emojiStr = '🎁';
            if (category === 'props') {
                const emojis: any = { 'undo': '↩️', 'extract': '⬆️', 'shuffle': '🔀', 'bundle': '🎁' };
                emojiStr = emojis[item.id] || '🎁';
            } else {
                const emojis: any = { 'ad': '📺', 'share': '🤝' };
                emojiStr = emojis[item.id] || '🪙';
            }

            const previewText = new PIXI.Text(emojiStr, { fontSize: 38 });
            previewText.anchor.set(0.5);
            previewText.position.set(0, 0);
            previewText.style.dropShadow = true;
            previewText.style.dropShadowDistance = 3;
            previewText.style.dropShadowBlur = 3;
            previewText.style.dropShadowAlpha = 0.2;

            iconContainer.addChild(previewText);
            content.addChild(iconContainer);
        }"""

content = content.replace(old_icons, new_icons)

# 4. State Overlays
old_states = """    if (item.isConsumable && item.id !== 'bundle' && (playerData.props as any)[item.id] !== undefined) {
        const count = (playerData.props as any)[item.id];
        const countBg = new PIXI.Graphics();
        countBg.beginFill(0xFF5252);
        countBg.drawRoundedRect(cardW - 45, 10, 40, 20, 10);
        countBg.endFill();
        content.addChild(countBg);

        const countText = new PIXI.Text(`拥有:${count}`, {
            fontFamily: 'Arial', fontSize: 10, fill: '#FFFFFF', fontWeight: 'bold'
        });
        countText.anchor.set(0.5);
        countText.position.set(cardW - 25, 20);
        content.addChild(countText);
    }

    if (isConsumable) {
        const actionBg = new PIXI.Graphics();
        actionBg.beginFill(item.isVideo ? 0x9C27B0 : (item.isShare ? 0x03A9F4 : 0xFF8F00));
        actionBg.drawRoundedRect(cardW / 2 - 45, cardH - 30, 90, 24, 12);
        actionBg.endFill();
        content.addChild(actionBg);

        const text = item.isVideo ? '看视频 (+300)' : (item.isShare ? '去分享 (+100)' : `${item.price} 金币`);
        const actionText = new PIXI.Text(text, { fontSize: 12, fill: '#FFFFFF', fontWeight: 'bold' });
        actionText.anchor.set(0.5);
        actionText.position.set(cardW / 2, cardH - 18);
        content.addChild(actionText);
    } else if (isEquipped) {"""

new_states = """    if (item.isConsumable && item.id !== 'bundle' && (playerData.props as any)[item.id] !== undefined) {
        const count = (playerData.props as any)[item.id];
        // Elegant count badge
        const countContainer = new PIXI.Container();
        const countBg = new PIXI.Graphics();
        countBg.beginFill(0xFF8A65); // Soft elegant orange
        countBg.lineStyle(1, 0xFFFFFF, 0.8);
        countBg.drawRoundedRect(0, 0, 44, 20, 10);
        countBg.endFill();
        countContainer.addChild(countBg);

        const countText = new PIXI.Text(`余 ${count}`, {
            fontFamily: '"PingFang SC", sans-serif', fontSize: 11, fill: '#FFFFFF', fontWeight: 'bold'
        });
        countText.anchor.set(0.5);
        countText.position.set(22, 10);
        countContainer.addChild(countText);
        
        countContainer.position.set(cardW - 48, 8);
        content.addChild(countContainer);
    }

    if (isConsumable) {
        const actionContainer = new PIXI.Container();
        actionContainer.position.set(cardW / 2, cardH - 18);

        const actionBg = new PIXI.Graphics();
        const btnColor = item.isVideo ? 0xBA68C8 : (item.isShare ? 0x4FC3F7 : 0xFFCA28);
        actionBg.beginFill(btnColor);
        actionBg.lineStyle(2, 0xFFFFFF, 0.8);
        actionBg.drawRoundedRect(-48, -14, 96, 28, 14);
        actionBg.endFill();
        actionContainer.addChild(actionBg);

        const text = item.isVideo ? '看视频' : (item.isShare ? '去分享' : `${item.price} 金币`);
        const actionText = new PIXI.Text(text, { fontSize: 13, fill: '#FFFFFF', fontWeight: '900' });
        actionText.style.dropShadow = true;
        actionText.style.dropShadowDistance = 1;
        actionText.style.dropShadowAlpha = 0.2;
        actionText.anchor.set(0.5);
        actionContainer.addChild(actionText);

        content.addChild(actionContainer);
    } else if (isEquipped) {"""

content = content.replace(old_states, new_states)

# 5. Lock and Top Badge
old_lock = """        const bar = new PIXI.Graphics();
        bar.beginFill(0x000000, 0.6);
        bar.drawRect(0, cardH - 36, cardW, 36);
        bar.endFill();
        lockContainer.addChild(bar);

        const priceText = new PIXI.Text(`🔒 ${item.price} 金币`, { fontSize: 14, fill: '#FFFFFF', fontWeight: 'bold' });
        priceText.anchor.set(0.5);
        priceText.position.set(cardW / 2, cardH - 18);
        lockContainer.addChild(priceText);

        content.addChild(lockContainer);
    }

    // 5. Top Badge (Name)
    const badge = new PIXI.Graphics();
    badge.beginFill(0xFFFFFF);
    badge.lineStyle(2, 0x333333, 1);
    badge.drawRoundedRect(cardW / 2 - 45, -12, 90, 24, 12);
    badge.endFill();
    card.addChild(badge);

    const badgeText = new PIXI.Text(item.name, { fontSize: 12, fill: '#333333', fontWeight: 'bold' });
    badgeText.anchor.set(0.5);
    badgeText.position.set(cardW / 2, 0);
    card.addChild(badgeText);"""

new_lock = """        const lockBg = new PIXI.Graphics();
        lockBg.beginFill(0x607D8B, 0.9); // slate gray pill
        lockBg.lineStyle(2, 0xFFFFFF, 0.8);
        lockBg.drawRoundedRect(-48, -14, 96, 28, 14);
        lockBg.endFill();
        lockBg.position.set(cardW / 2, cardH - 18);
        lockContainer.addChild(lockBg);

        const priceText = new PIXI.Text(`🔒 ${item.price}`, { fontSize: 13, fill: '#FFFFFF', fontWeight: 'bold' });
        priceText.anchor.set(0.5);
        priceText.position.set(cardW / 2, cardH - 18);
        lockContainer.addChild(priceText);

        content.addChild(lockContainer);
    }

    // 5. Top Badge (Name)
    const badge = new PIXI.Graphics();
    badge.beginFill(0x8D6E63); // Warm premium brown
    badge.lineStyle(2, 0xFFFFFF, 1); // Clean white border
    badge.drawRoundedRect(cardW / 2 - 45, -10, 90, 22, 11);
    badge.endFill();
    card.addChild(badge);

    const badgeText = new PIXI.Text(item.name, { fontSize: 12, fill: '#FFFFFF', fontWeight: 'bold' });
    badgeText.anchor.set(0.5);
    badgeText.position.set(cardW / 2, 1);
    card.addChild(badgeText);"""

content = content.replace(old_lock, new_lock)

with open('src/main.ts', 'w') as f:
    f.write(content)

