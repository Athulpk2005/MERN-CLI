#!/usr/bin/env node

import { program } from 'commander';
import { runCli } from '../src/index.js';

program
  .name('create-mern-app')
  .version('1.0.0')
  .description('Scaffold a fullstack MERN project (client + server)')
  .argument('<project-name>', 'Name of the project directory to create')
  .option('-y, --yes', 'Use sensible defaults and skip interactive prompts')
  .option('-t, --template <type>', 'Choose template: javascript or typescript', /^(javascript|typescript)$/i, 'javascript')
  .addHelpText('after', `
Examples:
  npx create-mern-app my-app
  npx create-mern-app my-app -y
  npx create-mern-app my-app --template typescript
`)
  .action((projectName, options) => {
    // commander passes options as the second arg
    runCli(projectName, options).catch(err => {
      console.error(err);
      process.exit(1);
    });
  });

program.parse(process.argv);
