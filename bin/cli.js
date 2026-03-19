#!/usr/bin/env node

import { program } from 'commander';
import { runCli } from '../src/index.js';

program
  .version('1.0.0')
  .description('A CLI tool to scaffold a fullstack MERN project')
  .argument('<project-name>', 'Name of the project directory to create')
  .action((projectName) => {
    runCli(projectName);
  });

program.parse(process.argv);
