import {defineConfig} from '@playwright/test';
import fs from 'node:fs';
const defaultPath = '/Users/adish./Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(defaultPath) ? defaultPath : undefined);
export default defineConfig({testDir:'./tests',timeout:60000,use:{baseURL:'http://localhost:3000',headless:true,launchOptions:execPath?{executablePath:execPath}:{}},workers:1,reporter:'list'});
