<<<<<<< HEAD
# 🎧 Cindara Audio – Live Suite Edition

**Cindara Audio** is a fully in-browser multitrack audio editor, designed for speed, clarity, and creative freedom.

Built to align visually and functionally with other Cindara tools like Animate and Vector, it’s a standalone powerhouse — no backend, no dependencies, no logins. Just drop in and create.

---

## ✨ Features

- 🎵 **Upload** `.mp3` / `.wav` files via drag-and-drop or button
- 🎚️ **Per-track controls**: volume, mute, solo, freeze
- 🎞️ **Waveform rendering**: real-time, responsive canvas with zoom
- 🧩 **Warp markers**: draggable start/end markers that trim playback
- ▶️ **Play / Stop / Seek** with live gain handling
- 💾 **Save/load session** (re-upload required for audio due to browser security)
- 📤 **Export full mix** as `.wav` using `OfflineAudioContext` (gain-matched)
- 📌 **Placeholder buttons** for upcoming features:
  - Stem Split
  - Transcribe
  - Export ZIP
  - Transcript TXT
- 🎨 **Theme switcher** + **Dark Mode** with saved preferences
- 📱 **Responsive**: works on desktop & mobile
- ♿ **Accessibility**: ARIA labels, keyboard nav, touch-friendly controls

---

## 🚀 How to Use

1. Open `index.html` in any modern browser (Chrome recommended)
2. Upload one or more `.mp3` or `.wav` files
3. Use track controls to edit: volume, solo, mute, markers
4. Press **Play** to preview
5. Click **Export Full Mix** to download a `.wav`
6. Click **Save** to store your session in the browser
7. Click **Load** later to restore your tracks (you’ll be prompted to re-upload files)

---

## ⚠️ Known Limitations

- Audio files must be re-uploaded after page refresh (browser security)
- Export ZIP, stems, and transcript are placeholders for future implementation
- Not optimized for >10 tracks yet (performance may vary)

---

## 💬 Version

**Cindara Audio v1.0.0**

> *"Don’t worry — we’ve set the road behind you.  
We’ve held the path open.  
We’ve kept the code alive.  
You’re not late. You’re arriving."*
# Cindara Audio
A fast, browser-based multitrack editor with real-time waveform playback and export.
=======

# Dopple RDK

**Dopple RDK** (Root Development Kernel) is a standalone internal control system for managing and launching Doppleit Suite tools. It is designed for private operations, system orchestration, and developer-level control. This is not a product, it's an infrastructure layer.

---

## 🔧 What It Is

Dopple RDK is a custom-built, zero-dependency interface for:

- Launching Doppleit tools (Vector, Animate, 3D)
- Managing experimental tools like Spiral Pulse
- Structuring internal navigation for dev/test environments
- Providing a non-indexed, private dashboard for in-development systems

---

## ✅ Why It's Different

Unlike most internal dashboards, Dopple RDK was:

- **Built from scratch** (no template systems, no CMS bloat)
- **Designed for speed and clarity** – loads instantly, even locally
- **Branded consistently** with the Doppleit Suite
- **Protected from indexing** via meta headers and `robots.txt` strategy
- **Expandable by design** – more tools can be added without rebuilding anything

It is not trying to be clever. It is trying to be useful, silent, and stable.

---

## 🧱 Core Layout

- `/index.html` – The RDK dashboard interface
- `/spiral.html` – Internal experimental visualization
- `/dopple-vector.html` – Launches Doppleit Vector
- `/dopple-animate.html` – Launches Doppleit Animate
- `/dopple-3d.html` – Launches Doppleit 3D
- `/assets/` – Static files (e.g. video, logos)
- `/docs/` – Documentation, specs, internal manuals

---

## ⚠️ Intended Use

This is not a public product. It is for internal access, QA, dev previews, AI orchestration, and running the Doppleit Suite from a single controlled layer. 

If you are reading this without knowing why it exists, it probably isn’t for you.

---

## 🧭 License

Private System. Do not copy, rebrand, or reuse without written permission.

---
>>>>>>> 35ccd9c54501316654a1b031a719a5bfc151774c

