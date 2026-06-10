const activeTiles = [
    { tileData: { x: 0, y: 10, z: 0 }, name: "T1" },
    { tileData: { x: 0, y: 10, z: 1 }, name: "T2" },
];

activeTiles.forEach(t1 => {
    let isCovered = false;
    for (let i = 0; i < activeTiles.length; i++) {
        const t2 = activeTiles[i];
        if (t2 === t1) continue;

        if (t2.tileData.z > t1.tileData.z) {
            const dx = Math.abs(t2.tileData.x - t1.tileData.x);
            const dy = Math.abs(t2.tileData.y - t1.tileData.y);
            if (dx < 0.95 && dy < 0.95) {
                isCovered = true;
                console.log(`${t1.name} is covered by ${t2.name}`);
                break;
            }
        }
    }
    console.log(`${t1.name} isCovered: ${isCovered}`);
});
