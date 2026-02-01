# 🏃‍♂️ DuoRunner - Automatic Legendary Lessons Runner for Duolingo

## ⚠️ Disclaimer

**DuoRunner is a demonstration script created for educational purposes only.** Please read this disclaimer carefully before use:

### About DuoRunner:
- Performs **mechanical navigation only** through Duolingo lessons
- Has **limited functionality** and cannot independently earn XP
- Does **NOT** modify user account data or alter earned points
- Does **NOT** solve exercises or answer questions
- Works in tandem with **DuoHacker** for actual lesson completion

### How it Works:
1. **DuoRunner** handles automatic navigation between lessons/sections
2. **DuoHacker** provides exercise solving and XP earning capabilities
3. The scripts are **separate programs** with different functions

### Important Notes:
- Use **at your own risk** and discretion
- **Not affiliated with** or endorsed by Duolingo
- May violate Duolingo's Terms of Service
- Educational/demonstration purposes only

### Responsibility:
The author accepts **no responsibility** for account suspensions, data loss, or any consequences resulting from script usage.

**⚠️ WARNING: Using automation scripts may result in account termination. Proceed with caution.**

## 📋 Program Description

DuoRunner is a JavaScript script designed for fast automatic XP farming in competitions on the Duolingo language learning website. The script works in tandem with the DuoHacker solver script and handles automatic navigation through course lessons.

## ✨ Features

- Automatic completion of Legendary lessons in Duolingo
- Works in pair with DuoHacker for solving exercises
- Skips problematic lessons by default
- Data caching support for resuming work
- English control interface
- Lesson completion statistics

## 🛠️ Prerequisites

1. **Install the TamperMonkey browser extension** for running JavaScript scripts
2. **Download the DuoHacker program** from https://www.twisk.fun/ (script named `install.user.js`)
3. **Download the DuoRunner program** from this repository (script `duo_runner.js`)
4. **Install both scripts** in the TamperMonkey extension
5. **Go to the Duolingo website** and log in (email verification required on first login)
6. **Enable TamperMonkey** and both scripts

## 🔄 Workflow

### Preparation
1. **Complete the main course** using DuoHacker - the script works only with Legendary lessons
2. **Open the last lesson** of the selected course with DuoHacker running and complete it

### Getting Started
1. **Open the desired Section** of the language course
2. **Scroll the page** to the desired Unit - processing will start from here
3. **Click the "Start" button** in the DuoRunner program menu

### Lesson Processing
- The script automatically:
  - Finds all lessons in the current Unit
  - Classifies them (skip/complete)
  - Processes Legendary lessons
  - Moves to the next Unit

### Completion
- After processing all lessons in the Section, the script completes its work
- A completion notification with statistics appears

## ⚡ Working Features

### Lesson Skipping
The script by default skips:
- Already completed lessons ("completed" icon)
- The last lesson in each Unit (often causes errors in automatic processing)

### Caching
- Data about completed lessons is saved in cache
- Work can be resumed after stopping
- Cache can be cleared through the program menu

### Statistics
The interface displays:
- Current work status
- Number of the currently processing Unit
- Number of lessons (todo/total)
- Completed/Failed/Skipped lessons

## 💡 Additional Notes

### XP Points
- Base points per lesson: **40 XP**
- Can be increased to **80 XP** using the "mana potion" in DuoHacker
- **Important:** After activating the potion in DuoHacker, refresh the Duolingo page (F5) for the bonus to apply correctly
- Only 15-minute boost is realistically obtainable (not always available)

### Browser Window Management
**⚠️ Critical:** The browser window/tab with the running DuoRunner script **must remain open and active** for the entire duration of operation.

#### Recommended Setup:
1. **Keep the Duolingo window visible** - don't minimize it or switch to other windows that might interrupt script execution
2. **For multitasking in the same browser:** Open **separate browser windows** instead of tabs
   - ✅ **Good:** Chrome Window 1 (Duolingo + DuoRunner) + Chrome Window 2 (other websites)
   - ❌ **Avoid:** Multiple tabs in the same window (can cause script interruption)

### Muting Sound
- Hover cursor over the Duolingo tab icon
- Left-click to open context menu
- Select "Mute site" option

### Caching
- When moving to the next Section, it's recommended to clear the cache
- To clear, press the "Clear Cache" button in the menu

### Work Management
- Script work can be interrupted at any time with the "Stop" button
- Can be resumed from any point
- **Use separate browser windows** for other work during script execution

## 🔧 Technical Details

### Compatibility
- Browsers: Chrome, Firefox, Edge (with TamperMonkey)
- Sites: duolingo.com, duolingo.cn
- Runtime: automatic completion or on command

### Security
- Script does not require access to your data
- Works only on Duolingo pages
- Does not store passwords or personal information

## 🚨 Troubleshooting

### Script Won't Start
1. Check if TamperMonkey is installed
2. Ensure both scripts are enabled in the extension
3. Verify you're on the Duolingo website

### Script Stops Unexpectedly
1. **Ensure the browser window remains open and active**
2. Check if you opened another Duolingo tab in the same window
3. Try clearing the cache
4. Restart the script from the current Unit

### Lesson Search Issues
1. Ensure the course is completed up to Legendary level
2. Verify you're in the correct Section
3. Try scrolling the page down and restarting the script

## 📄 License
MIT License

---

**Use responsibly and at your own risk. Educational purposes only.**