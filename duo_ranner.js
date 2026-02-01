// ==UserScript==
// @name         DuoRunner ULTIMATE
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Ultimate legendary lessons processor - section-based algorithm
// @author       You
// @match        https://*.duolingo.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        delays: {
            minCheck: 300,
            stepDelay: 1000,
            solveTime: 3000,
            betweenLessons: 800,
            scrollDelay: 1200,
            scrollStep: 0.33
        }
    };

    // ================== SIMPLE CACHE ==================
    class SimpleCache {
        constructor() {
            this.cacheKey = 'duorunner-simple-cache-v2';
            this.cache = {
                currentUnit: null,
                units: {}
            };
            this.load();
        }

        load() {
            try {
                const saved = GM_getValue(this.cacheKey, '{}');
                const parsed = JSON.parse(saved);
                if (parsed.currentUnit) this.cache.currentUnit = parsed.currentUnit;
                if (parsed.units) this.cache.units = parsed.units;
            } catch (e) {}
        }

        save() {
            GM_setValue(this.cacheKey, JSON.stringify(this.cache));
        }

        setCurrentUnit(unitNumber) {
            this.cache.currentUnit = unitNumber;
            if (!this.cache.units[unitNumber]) {
                this.cache.units[unitNumber] = {
                    lastLesson: null,
                    lessons: {}
                };
            }
            this.save();
        }

        getCurrentUnit() {
            return this.cache.currentUnit;
        }

        setUnitLessons(unitNumber, lessonsData) {
            // Clean data before saving - don't store DOM elements
            const cleanLessonsData = {
                lastLesson: lessonsData.lastLesson,
                lessons: {}
            };

            for (const [lessonNumber, lesson] of Object.entries(lessonsData.lessons)) {
                cleanLessonsData.lessons[lessonNumber] = {
                    number: lesson.number,
                    status: lesson.status
                };
            }

            this.cache.units[unitNumber] = cleanLessonsData;
            this.save();
        }

        getUnitLessons(unitNumber) {
            return this.cache.units[unitNumber];
        }

        updateLessonStatus(unitNumber, lessonNumber, status) {
            if (this.cache.units[unitNumber] && this.cache.units[unitNumber].lessons) {
                this.cache.units[unitNumber].lessons[lessonNumber].status = status;
                this.save();
            }
        }

        clear() {
            this.cache = {
                currentUnit: null,
                units: {}
            };
            this.save();
        }
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ================== DETERMINE UNIT ==================
    function getCurrentUnitFromText() {
        const bodyText = document.body.innerText;
        const match = bodyText.match(/SECTION\s+\d+,\s*UNIT\s+(\d+)/i);
        return match ? parseInt(match[1]) : null;
    }

    // ================== FIND UNIT BLOCK ==================
    function findUnitBlock(unitNumber) {
        console.log(`🔍 Searching for unit ${unitNumber} block...`);

        // 1. Find unit boundary (last lesson)
        const boundaryBtn = document.querySelector(`[aria-label="Level up Unit ${unitNumber} to Legendary"]`);

        if (!boundaryBtn) {
            console.log(`❌ Unit ${unitNumber} boundary not found`);
            return null;
        }

        // 2. Find parent section
        const section = boundaryBtn.closest('section[data-test^="skill-path-unit-"]');

        if (!section) {
            console.log(`❌ Section for unit ${unitNumber} not found`);
            return null;
        }

        console.log(`✅ Found unit ${unitNumber} block`);
        return section;
    }

    // ================== FIND LESSON BUTTON ==================
    function findLessonButton(unitNumber, lessonNumber) {
        const unitBlock = findUnitBlock(unitNumber);
        if (!unitBlock) {
            console.log(`❌ Cannot find unit ${unitNumber} block`);
            return null;
        }

        // Strategy: Partial match (starts with...)
        const lessonBtn = unitBlock.querySelector(`[data-test^="skill-path-level-${lessonNumber}"]`);

        if (lessonBtn) {
            console.log(`✅ Found lesson ${lessonNumber} button in unit ${unitNumber}`);
            return lessonBtn;
        } else {
            console.log(`❌ Lesson ${lessonNumber} button not found in unit ${unitNumber}`);
            return null;
        }
    }

    // ================== FIND LESSONS IN UNIT ==================
    function findLessonsInUnit(unitNumber) {
        console.log(`🔍 Searching for lessons in unit ${unitNumber}...`);

        const unitBlock = findUnitBlock(unitNumber);
        if (!unitBlock) {
            return [];
        }

        // Find all lesson buttons in section
        const lessons = [];
        const buttons = unitBlock.querySelectorAll('button[data-test^="skill-path-level-"]');

        console.log(`📋 Found ${buttons.length} buttons in section`);

        for (const btn of buttons) {
            const dataTest = btn.getAttribute('data-test');
            const match = dataTest.match(/skill-path-level-(\d+)/);

            if (match) {
                const lessonNumber = parseInt(match[1]);

                // Check icons inside button
                const imgs = btn.querySelectorAll('img');
                let iconType = null;

                for (const img of imgs) {
                    const src = img.src || '';
                    if (src.includes('bfa591f6854b4de08e1656b3e8ca084f.svg')) {
                        iconType = 'legendary'; // not completed
                        break;
                    }
                    if (src.includes('53727b0c96103443bc616435bb1f2fbc.svg')) {
                        iconType = 'completed'; // completed
                        break;
                    }
                }

                if (iconType) {
                    lessons.push({
                        number: lessonNumber,
                        iconType: iconType
                    });
                    console.log(`  Lesson ${lessonNumber}: icon=${iconType}`);
                }
            }
        }

        console.log(`📚 Found ${lessons.length} lessons in unit ${unitNumber}`);
        return lessons;
    }

    // ================== CLASSIFY LESSONS ==================
    function classifyLessons(lessons) {
        if (lessons.length === 0) {
            return { lastLesson: null, classified: {} };
        }

        // 1. Find last lesson (max number)
        const lastLesson = Math.max(...lessons.map(l => l.number));
        console.log(`📊 Last lesson in unit: ${lastLesson}`);

        // 2. Classify each lesson
        const classified = {};

        lessons.forEach(lesson => {
            let status;

            // Rule 1: "completed" icon → ALWAYS toskip
            if (lesson.iconType === 'completed') {
                status = "toskip";
                console.log(`🎯 Lesson ${lesson.number}: "completed" icon → toskip`);
            }
            // Rule 2: Last lesson → ALWAYS toskip
            else if (lesson.number === lastLesson) {
                status = "toskip";
                console.log(`🎯 Lesson ${lesson.number}: last lesson → toskip`);
            }
            // Rule 3: Otherwise → todo
            else {
                status = "todo";
                console.log(`🎯 Lesson ${lesson.number}: needs completion → todo`);
            }

            classified[lesson.number] = {
                number: lesson.number,
                status: status
            };
        });

        return {
            lastLesson: lastLesson,
            classified: classified
        };
    }

    // ================== LESSON PROCESSING ==================
    function isOnUnitMap() {
        return !!document.querySelector('[aria-label^="Level up Unit"]');
    }

    function hasContinueButton() {
        return !!document.querySelector('[data-test="legendary-session-end-continue"]');
    }

    async function waitForElement(selector, timeout = 5000) {
        const startTime = Date.now();
        const checkInterval = 300;

        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }

            if (isOnUnitMap()) {
                return null;
            }

            await delay(checkInterval);
        }

        return null;
    }

    async function waitForContinue() {
        const maxWaitTime = 5 * 60 * 1000;
        const startTime = Date.now();
        const checkInterval = 1000;

        console.log('⏳ Waiting for Continue (up to 5 minutes)...');

        while (Date.now() - startTime < maxWaitTime) {
            if (hasContinueButton()) {
                const waitTime = Date.now() - startTime;
                console.log(`✅ Continue found in ${waitTime}ms`);
                return true;
            }

            if (isOnUnitMap()) {
                console.log('✅ Already on map');
                return true;
            }

            await delay(checkInterval);

            const elapsed = Date.now() - startTime;
            if (elapsed % 30000 < checkInterval) {
                console.log(`⏳ Waiting for Continue... (${Math.floor(elapsed / 1000)} sec)`);
            }
        }

        console.log('❌ Timeout: Continue not found in 5 minutes');
        return false;
    }

    async function processLesson(unitNumber, lessonNumber) {
        console.log(`🔄 Starting lesson ${lessonNumber} in unit ${unitNumber}...`);

        try {
            // 1. Find lesson button
            const lessonBtn = findLessonButton(unitNumber, lessonNumber);
            if (!lessonBtn) {
                console.log(`❌ Cannot find lesson ${lessonNumber} button`);
                return { success: false, kicked: true };
            }

            // 2. Scroll to button and click
            lessonBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await delay(1000);
            lessonBtn.click();
            await delay(CONFIG.delays.stepDelay);

            // 3. Start legendary lesson
            const legendaryBtn = await waitForElement('[data-test="legendary-node-button"]', 3000);
            if (!legendaryBtn) {
                console.log('❌ Start legendary not found (possible crash)');
                return { success: false, kicked: true };
            }

            legendaryBtn.click();
            await delay(CONFIG.delays.stepDelay);

            // 4. Start lesson
            const startBtn = await waitForElement('[data-test="legendary-start-button"]', 3000);
            if (!startBtn) {
                console.log('❌ Start button not found (possible crash)');
                return { success: false, kicked: true };
            }

            startBtn.click();
            await delay(CONFIG.delays.stepDelay);

            // 5. Wait for lesson to load
            for (let i = 0; i < 10; i++) {
                await delay(CONFIG.delays.minCheck);

                const solveBtn = document.getElementById('nw-solve-all');
                const challenge = document.querySelector('[data-test="challenge"]');

                if (solveBtn || challenge) {
                    console.log(`✅ Lesson loaded in ${(i + 1) * 300}ms`);
                    break;
                }

                if (isOnUnitMap()) {
                    console.log('⚠️ Crash during lesson loading');
                    return { success: false, kicked: true };
                }

                if (i === 9) {
                    console.log('❌ Lesson did not load');
                    return { success: false, kicked: false };
                }
            }

            // 6. Solve lesson
            const solveBtn = document.getElementById('nw-solve-all');
            if (solveBtn) {
                solveBtn.click();
                await delay(CONFIG.delays.solveTime);
            }

            // 7. Wait for Continue
            const continueFound = await waitForContinue();
            if (!continueFound) {
                console.log('❌ Critical hang on Continue');
                return { success: false, kicked: false, critical: true };
            }

            // 8. Click Continue
            const continueBtn = document.querySelector('[data-test="legendary-session-end-continue"]');
            if (continueBtn) {
                continueBtn.click();
                await delay(CONFIG.delays.stepDelay);

                await delay(500);
                if (isOnUnitMap()) {
                    console.log('✅ Successfully returned to map');
                    return { success: true, kicked: false };
                }
            }

            if (isOnUnitMap()) {
                console.log('✅ Lesson completed');
                return { success: true, kicked: false };
            }

            return { success: false, kicked: false };

        } catch (error) {
            console.error('❌ Lesson error:', error);
            return { success: false, kicked: false };
        }
    }

    // ================== FIND NEXT UNIT ==================
    async function findNextUnit(currentUnit) {
        console.log(`🔍 Searching for next unit after ${currentUnit}...`);

        const maxScrollAttempts = 10;
        let attempts = 0;

        while (attempts < maxScrollAttempts) {
            // Scroll down
            window.scrollBy(0, window.innerHeight * CONFIG.delays.scrollStep);
            await delay(CONFIG.delays.scrollDelay);

            // Check current unit
            const newUnit = getCurrentUnitFromText();

            if (newUnit && newUnit !== currentUnit) {
                console.log(`✅ Found next unit: ${newUnit}`);
                return newUnit;
            }

            attempts++;
        }

        console.log(`❌ Could not find next unit after ${currentUnit}`);
        return null;
    }

    // ================== MAIN CONTROLLER ==================
    class DuoRunner {
        constructor() {
            this.cache = new SimpleCache();
            this.isRunning = false;
            this.completed = 0;
            this.failed = 0;
            this.skipped = 0;
            this.currentProcessingUnit = null;

            this.setupUI();
            this.updateUI();
        }

        setupUI() {
            const existing = document.getElementById('duorunner-ui');
            if (existing) existing.remove();

            const ui = document.createElement('div');
            ui.id = 'duorunner-ui';
            ui.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: #1a1a2e;
                border: 2px solid #58cc02;
                border-radius: 10px;
                padding: 15px;
                color: white;
                font-family: Arial, sans-serif;
                min-width: 250px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            `;

            ui.innerHTML = `
                <div style="margin-bottom: 15px; text-align: center;">
                    <div style="font-weight: bold; color: #58cc02; font-size: 16px; margin-bottom: 5px;">
                        DuoRunner ULTIMATE
                    </div>
                    <div style="font-size: 11px; color: #aaa;">
                        Section algorithm • Unit boundaries
                    </div>
                </div>

                <div style="margin-bottom: 10px; background: rgba(255,255,255,0.07); border-radius: 8px; padding: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-size: 12px; color: #B0BEC5;">Status:</span>
                        <span id="status-display" style="font-weight: bold; color: #58cc02;">Ready</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-size: 12px; color: #B0BEC5;">Unit:</span>
                        <span id="unit-display" style="font-weight: bold;">-</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-size: 12px; color: #B0BEC5;">Lessons:</span>
                        <span id="lessons-display" style="font-weight: bold;">0/0</span>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <button id="start-btn" style="flex: 1; background: #58cc02; color: white;
                            border: none; padding: 10px; border-radius: 8px; font-weight: bold;
                            cursor: pointer; font-size: 14px;">
                        ▶ Start
                    </button>
                    <button id="stop-btn" style="flex: 1; background: #ff4b4b; color: white;
                            border: none; padding: 10px; border-radius: 8px; font-weight: bold;
                            cursor: pointer; font-size: 14px;">
                        ⏹ Stop
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <div style="text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #58cc02;" id="completed-display">0</div>
                        <div style="font-size: 11px; color: #B0BEC5;">Completed</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #ff6b6b;" id="failed-display">0</div>
                        <div style="font-size: 11px; color: #B0BEC5;">Failed</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #ffc800;" id="skipped-display">0</div>
                        <div style="font-size: 11px; color: #B0BEC5;">Skipped</div>
                    </div>
                </div>

                <button id="clear-cache" style="width: 100%; background: #ef4444; color: white;
                        border: none; padding: 8px; border-radius: 6px; font-size: 12px; cursor: pointer;">
                    Clear Cache
                </button>
            `;

            document.body.appendChild(ui);

            document.getElementById('start-btn').onclick = () => this.start();
            document.getElementById('stop-btn').onclick = () => this.stop();
            document.getElementById('clear-cache').onclick = () => {
                if (confirm('Clear cache?')) {
                    this.cache.clear();
                    this.updateUI();
                }
            };
        }

        updateUI() {
            const status = this.isRunning ? 'Running' : 'Ready';
            const statusColor = this.isRunning ? '#1cb0f6' : '#58cc02';

            document.getElementById('status-display').textContent = status;
            document.getElementById('status-display').style.color = statusColor;

            const currentUnit = this.currentProcessingUnit || this.cache.getCurrentUnit();
            document.getElementById('unit-display').textContent =
                currentUnit ? `Unit ${currentUnit}` : '-';

            // Count lessons
            let todoCount = 0;
            let totalCount = 0;

            if (currentUnit && this.cache.cache.units[currentUnit]) {
                const unitData = this.cache.cache.units[currentUnit];
                totalCount = Object.keys(unitData.lessons || {}).length;
                todoCount = Object.values(unitData.lessons || {}).filter(l => l && l.status === 'todo').length;
            }

            document.getElementById('lessons-display').textContent =
                `${todoCount}/${totalCount}`;

            document.getElementById('completed-display').textContent = this.completed;
            document.getElementById('failed-display').textContent = this.failed;
            document.getElementById('skipped-display').textContent = this.skipped;

            const startBtn = document.getElementById('start-btn');
            if (this.isRunning) {
                startBtn.innerHTML = '▶ Running';
                startBtn.style.background = '#1cb0f6';
            } else {
                startBtn.innerHTML = '▶ Start';
                startBtn.style.background = '#58cc02';
            }
        }

        async start() {
            if (this.isRunning) return;

            console.log('🚀 Starting DuoRunner ULTIMATE v37...');
            this.isRunning = true;
            this.updateUI();

            await this.runMainLoop();
        }

        stop() {
            console.log('🛑 Stopping...');
            this.isRunning = false;
            this.updateUI();
        }

        // Analyze and process unit
        async processUnit(unitNumber) {
            console.log(`\n=== PROCESSING UNIT ${unitNumber} ===`);

            this.currentProcessingUnit = unitNumber;
            this.cache.setCurrentUnit(unitNumber);
            this.updateUI();

            // 1. Check if data exists in cache
            let unitData = this.cache.getUnitLessons(unitNumber);

            if (!unitData || !unitData.lessons || Object.keys(unitData.lessons).length === 0) {
                console.log(`🔍 Analyzing unit ${unitNumber}...`);

                // 2. Find lessons in unit section
                const lessons = findLessonsInUnit(unitNumber);

                if (lessons.length === 0) {
                    console.log(`📭 No lessons in unit ${unitNumber}`);
                    return false;
                }

                // 3. Classify lessons
                const classification = classifyLessons(lessons);

                // 4. Save to cache
                unitData = {
                    lastLesson: classification.lastLesson,
                    lessons: classification.classified
                };

                this.cache.setUnitLessons(unitNumber, unitData);
                console.log(`📊 Cache updated: ${Object.keys(unitData.lessons).length} lessons`);
            } else {
                console.log(`📁 Using cached data for unit ${unitNumber}`);
            }

            // 5. Process lessons with status: "todo"
            const sortedLessons = Object.values(unitData.lessons)
                .sort((a, b) => a.number - b.number);

            let processedCount = 0;
            let hasTodoLessons = false;

            for (const lesson of sortedLessons) {
                if (!this.isRunning) break;

                if (lesson.status === "todo") {
                    hasTodoLessons = true;
                    console.log(`🎯 Processing lesson ${lesson.number} in unit ${unitNumber}`);

                    const result = await processLesson(unitNumber, lesson.number);

                    if (result.success) {
                        this.completed++;
                        // Update status in cache
                        this.cache.updateLessonStatus(unitNumber, lesson.number, "toskip");
                        console.log(`✅ Completed: ${this.completed}`);
                    } else if (result.kicked) {
                        this.failed++;
                        this.skipped++;
                        this.cache.updateLessonStatus(unitNumber, lesson.number, "toskip");
                        console.log(`⚠️ Kicked from lesson ${lesson.number}`);
                    } else if (result.critical) {
                        console.log('❌ Critical error on Continue');
                        this.skipped++;
                        this.failed++;
                        this.stop();
                        alert('❌ Script stopped: stuck on Continue button');
                        return false;
                    } else {
                        console.log(`❌ Lesson ${lesson.number} error`);
                        this.skipped++;
                        this.failed++;
                        this.cache.updateLessonStatus(unitNumber, lesson.number, "toskip");
                    }

                    processedCount++;
                    this.updateUI();

                    // If lesson was processed successfully, wait before next
                    if (result.success || result.kicked) {
                        await delay(CONFIG.delays.betweenLessons);
                    }
                }
            }

            if (!hasTodoLessons) {
                console.log(`📭 No lessons to process in unit ${unitNumber}`);
            } else {
                console.log(`✅ Unit ${unitNumber} processed: ${processedCount} lessons`);
            }

            return true;
        }

        // Main loop
        async runMainLoop() {
            console.log('🔄 Starting main loop...');

            // Start with current unit
            let currentUnit = getCurrentUnitFromText();
            if (!currentUnit) {
                console.log('❌ Cannot determine starting unit');
                this.stop();
                return;
            }

            console.log(`📍 Starting with unit ${currentUnit}`);

            // Process current unit
            await this.processUnit(currentUnit);

            while (this.isRunning) {
                try {
                    // Remember current unit
                    const lastUnit = currentUnit;

                    // Find next unit
                    const nextUnit = await findNextUnit(lastUnit);

                    if (nextUnit && this.isRunning) {
                        // Process next unit
                        await this.processUnit(nextUnit);
                        currentUnit = nextUnit;
                    } else if (!nextUnit) {
                        // No more units found - stop
                        console.log('🏁 No more units to process');
                        this.stop();
                        break;
                    }

                    // Short pause before searching for next unit
                    await delay(1000);

                } catch (error) {
                    console.error('❌ Error in main loop:', error);
                    await delay(3000);
                }
            }

            console.log('🏁 Work completed');
            alert(`🎉 Done!\nCompleted: ${this.completed}\nFailed: ${this.failed}\nSkipped: ${this.skipped}`);
        }
    }

    // ================== INITIALIZATION ==================
    function init() {
        if (!window.location.hostname.includes('duolingo')) return;

        console.log('✅ DuoRunner ULTIMATE v37 loaded');

        if (window.runner) {
            try { window.runner.stop(); } catch {}
        }

        window.runner = new DuoRunner();

        setInterval(() => {
            if (window.runner) {
                window.runner.updateUI();
            }
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();