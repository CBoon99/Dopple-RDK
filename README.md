
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

