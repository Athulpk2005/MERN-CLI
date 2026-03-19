import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runCli(projectName, opts = {}) {
  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`Error: Directory ${projectName} already exists!`));
    process.exit(1);
  }

  console.log(chalk.cyan(`Welcome to MERN Scaffolder CLI! Let's set up your project.`));
  console.log();

  // Support non-interactive usage via opts (commander options)
  let answers;
  if (opts && (opts.yes || opts.nonInteractive)) {
    answers = {
      includeRedux: false,
      useTailwind: true,
      language: (opts.template && opts.template.toLowerCase() === 'typescript') ? 'TypeScript' : 'JavaScript',
      extraFrontend: [],
      extraBackend: []
    };
    console.log(chalk.gray('Using defaults: Redux=false, Tailwind=true, language=' + answers.language));
  } else {
    answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'includeRedux',
        message: 'Include Redux?',
        default: false
      },
      {
        type: 'confirm',
        name: 'useTailwind',
        message: 'Use Tailwind CSS?',
        default: true
      },
      {
        type: 'list',
        name: 'language',
        message: 'TypeScript or JavaScript?',
        choices: ['JavaScript', 'TypeScript'],
        default: 'JavaScript'
      },
      {
        type: 'checkbox',
        name: 'extraFrontend',
        message: 'Select additional frontend libraries:',
        choices: [
          { name: 'React Query (Data Fetching)', value: 'react-query', checked: true },
          { name: 'React Hook Form + Zod (Forms & Validation)', value: 'react-hook-form' },
          { name: 'Framer Motion (Animations)', value: 'framer-motion' }
        ]
      },
      {
        type: 'checkbox',
        name: 'extraBackend',
        message: 'Select additional backend libraries:',
        choices: [
          { name: 'Cookie Parser (Secure cookies)', value: 'cookie-parser' },
          { name: 'Multer (File Uploads)', value: 'multer' },
          { name: 'Express Rate Limit (DDoS Protection)', value: 'express-rate-limit' },
          { name: 'Zod (Schema validation)', value: 'zod' }
        ]
      }
    ]);
  }

  console.log();

  const spinner = ora('Creating project directories and copying files...').start();
  try {
    await fs.mkdir(targetDir);

    const templateName = answers.language === 'TypeScript' ? 'client-ts' : 'client';
    const templateClientDir = path.resolve(__dirname, `../templates/${templateName}`);
    const targetClientDir = path.resolve(targetDir, 'client');
    await fs.copy(templateClientDir, targetClientDir);

    const templateServerDir = path.resolve(__dirname, '../templates/server');
    const targetServerDir = path.resolve(targetDir, 'server');
    await fs.copy(templateServerDir, targetServerDir);

    await fs.rename(
      path.resolve(targetServerDir, '.env.template'),
      path.resolve(targetServerDir, '.env')
    );

    await fs.copy(
      path.resolve(__dirname, '../templates/README.md.template'),
      path.resolve(targetDir, 'README.md')
    );

    const rootPkg = {
      name: projectName,
      version: '1.0.0',
      description: 'MERN stack project created with create-mern-app',
      main: 'index.js',
      type: 'module',
      scripts: {
        "client": "npm run dev --prefix client",
        "server": "npm run dev --prefix server",
        "dev": "concurrently \"npm run server\" \"npm run client\"",
        "install-all": "npm install && npm install --prefix client && npm install --prefix server"
      }
    };
    await fs.writeJson(path.resolve(targetDir, 'package.json'), rootPkg, { spaces: 2 });

    spinner.succeed('Project files created successfully.');
  } catch (error) {
    spinner.fail('Failed to scaffold project files.');
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  const installSpinner = ora('Installing client dependencies...').start();
  try {
    await execa('npm', ['install'], { cwd: path.resolve(targetDir, 'client') });
    installSpinner.succeed('Client dependencies installed.');
  } catch (err) {
    installSpinner.fail('Failed to install client dependencies.');
  }

  if (answers.useTailwind) {
    const tailwindSpinner = ora('Setting up Tailwind CSS...').start();
    try {
      await execa('npm', ['install', '-D', 'tailwindcss@^3.4.17', 'postcss', 'autoprefixer'], {
        cwd: path.resolve(targetDir, 'client')
      });
      await execa('npx', ['tailwindcss', 'init', '-p'], {
        cwd: path.resolve(targetDir, 'client')
      });
      
      let tailwindConfig = await fs.readFile(path.resolve(targetDir, 'client/tailwind.config.js'), 'utf-8');
      tailwindConfig = tailwindConfig.replace('content: []', `content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ]`);
      await fs.writeFile(path.resolve(targetDir, 'client/tailwind.config.js'), tailwindConfig);

      const cssPath = answers.language === 'TypeScript' ? 'client/src/index.css' : 'client/src/index.css';
      const tailwindImports = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n`;
      let existingCss = await fs.readFile(path.resolve(targetDir, cssPath), 'utf-8');
      await fs.writeFile(path.resolve(targetDir, cssPath), tailwindImports + existingCss);

      tailwindSpinner.succeed('Tailwind CSS installed and configured.');
    } catch (err) {
      tailwindSpinner.fail('Failed to set up Tailwind CSS.');
      console.error(err);
    }
  }

  if (answers.includeRedux) {
    const reduxSpinner = ora('Adding Redux Toolkit...').start();
    try {
      await execa('npm', ['install', '@reduxjs/toolkit', 'react-redux'], {
        cwd: path.resolve(targetDir, 'client')
      });
      reduxSpinner.succeed('Redux Toolkit installed.');
    } catch (err) {
      reduxSpinner.fail('Failed to add Redux Toolkit.');
    }
  }

  if (answers.extraFrontend && answers.extraFrontend.length > 0) {
    const extraSpinner = ora('Adding additional frontend libraries...').start();
    const pkgMap = {
      'react-query': ['@tanstack/react-query'],
      'react-hook-form': ['react-hook-form', 'zod', '@hookform/resolvers'],
      'framer-motion': ['framer-motion']
    };
    const packagesToInstall = answers.extraFrontend.flatMap(lib => pkgMap[lib]);
    
    try {
      await execa('npm', ['install', ...packagesToInstall], {
        cwd: path.resolve(targetDir, 'client')
      });
      extraSpinner.succeed(`Added: ${answers.extraFrontend.join(', ')}`);
    } catch (err) {
      extraSpinner.fail('Failed to add additional frontend libraries.');
    }
  }


  const serverInstallSpinner = ora('Installing server dependencies...').start();
  try {
    await execa('npm', ['install'], { cwd: path.resolve(targetDir, 'server') });
    serverInstallSpinner.succeed('Server dependencies installed.');
  } catch (err) {
    serverInstallSpinner.fail('Failed to install server dependencies.');
  }

  if (answers.extraBackend && answers.extraBackend.length > 0) {
    const backendExtraSpinner = ora('Adding additional backend libraries...').start();
    try {
      await execa('npm', ['install', ...answers.extraBackend], {
        cwd: path.resolve(targetDir, 'server')
      });
      backendExtraSpinner.succeed(`Added: ${answers.extraBackend.join(', ')}`);
    } catch (err) {
      backendExtraSpinner.fail('Failed to add additional backend libraries.');
    }
  }

  const rootInstallSpinner = ora('Setting up root scripts and concurrently...').start();
  try {
    await execa('npm', ['install', 'concurrently'], { cwd: targetDir });
    rootInstallSpinner.succeed('Root environment configured.');
  } catch (err) {
    rootInstallSpinner.fail('Failed to setup root environment.');
  }

  const gitSpinner = ora('Initializing Git repository...').start();
  try {
    await execa('git', ['init'], { cwd: targetDir });
    await fs.writeFile(
      path.resolve(targetDir, '.gitignore'),
      'node_modules\n.env\ndist\nbuild\n'
    );
    gitSpinner.succeed('Git repository initialized.');
  } catch (err) {
    gitSpinner.fail('Failed to initialize Git repository.');
  }

  console.log();
  console.log(chalk.green(`Successfully created MERN project at ${projectName}`));
  console.log(chalk.cyan(`\nNext steps:`));
  console.log(`  cd ${projectName}`);
  console.log(`  npm run dev    ${chalk.gray('# Starts both client and server')}`);
  console.log(`\n  # Individual Commands:`);
  console.log(`  npm run client ${chalk.gray('# Starts only the frontend')}`);
  console.log(`  npm run server ${chalk.gray('# Starts only the backend')}`);
}
