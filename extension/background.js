import { getSession } from "./auth.js";
chrome.runtime.onStartup.addListener(() => { getSession(); });
chrome.runtime.onInstalled.addListener(() => { getSession(); });
