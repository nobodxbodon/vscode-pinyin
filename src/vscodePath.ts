import { join, dirname } from 'path';

export var base = dirname(require.main.filename);

export var nodeModulesDir = join(base, '..', 'node_modules');

export var workbenchDir = join(base, 'vs', 'workbench', 'electron-browser');

export var workbenchMainJs = join(workbenchDir, 'workbench.main.js');