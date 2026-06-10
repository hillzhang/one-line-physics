const fs = require('fs');
const config = JSON.parse(fs.readFileSync('project.config.json', 'utf-8'));
config.setting.nodeModules = false;
fs.writeFileSync('project.config.json', JSON.stringify(config, null, 4));
