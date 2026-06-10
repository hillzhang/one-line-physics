const fs = require('fs');
const config = JSON.parse(fs.readFileSync('project.config.json', 'utf-8'));
const ignores = config.packOptions.ignore || [];
if (!ignores.find(i => i.value === 'node_modules')) {
  ignores.push({ value: 'node_modules', type: 'folder' });
  config.packOptions.ignore = ignores;
  fs.writeFileSync('project.config.json', JSON.stringify(config, null, 4));
}
